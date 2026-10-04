import { NextRequest, NextResponse } from 'next/server';
import { format } from 'date-fns';
import { parseIntent, ParsedIntent } from '@/lib/ai/intentParser';
import {
  sendTelegramMessage,
  sendConfirmationCard,
  answerCallbackQuery,
  downloadTelegramFile,
} from '@/lib/telegram/bot';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { timeStringToMinutes, minutesToTimeString } from '@/lib/date-utils';
import { createProblemResponse } from '@/lib/rfc7807';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

    // 1. Validate Secret Token Header if configured
    if (webhookSecret) {
      const receivedSecret = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (receivedSecret !== webhookSecret) {
        return createProblemResponse(
          403,
          'Acceso no autorizado',
          'El encabezado X-Telegram-Bot-Api-Secret-Token no es válido.',
          'forbidden-webhook-secret',
          '/api/telegram/webhook'
        );
      }
    }

    const update = await req.json();

    // 2. Handle Callback Queries (Inline Button Clicks)
    if (update.callback_query) {
      const callback = update.callback_query;
      const callbackId = callback.id;
      const data: string = callback.data || '';
      const chatId = callback.message?.chat?.id;

      if (!chatId) {
        await answerCallbackQuery(callbackId, 'Error de sesión');
        return NextResponse.json({ ok: false, error: 'missing_chat_id' });
      }

      // Check authorized chat ID if configured
      const authorizedChatId = process.env.TELEGRAM_AUTHORIZED_CHAT_ID;
      if (authorizedChatId && String(chatId) !== String(authorizedChatId)) {
        await answerCallbackQuery(callbackId, 'Acceso no autorizado');
        return NextResponse.json({ ok: false, error: 'unauthorized_chat' });
      }

      // A. Discard Action
      if (data.startsWith('discard:') || data.startsWith('cancel_')) {
        await answerCallbackQuery(callbackId, 'Operación descartada');
        await sendTelegramMessage(
          chatId,
          '❌ <i>Operación descartada. No se modificó tu calendario.</i>'
        );

        const supabase = getSupabaseServerClient();
        await supabase.from('telegram_conversations').insert({
          chat_id: chatId,
          message_id: callback.message?.message_id || Date.now(),
          role: 'user',
          content: '[Acción: Descartar propuesta]',
        });

        return NextResponse.json({
          ok: true,
          action: 'callback_discarded',
          chatId,
        });
      }

      // B. Confirm Action
      if (data.startsWith('confirm:') || data.startsWith('confirm_')) {
        await answerCallbackQuery(callbackId, 'Guardando en Ritmo...');

        const supabase = getSupabaseServerClient();

        // Retrieve the most recent pending intent for this chat
        let intentToApply: ParsedIntent | null = null;
        const { data: convHistory } = await supabase
          .from('telegram_conversations')
          .select('*')
          .eq('chat_id', chatId)
          .not('intent_detected', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (convHistory?.intent_detected) {
          try {
            intentToApply = JSON.parse(convHistory.intent_detected);
          } catch (e) {
            console.warn('[Webhook] Failed to parse cached intent JSON:', e);
          }
        }

        // Fallback intent if history is unavailable
        if (!intentToApply) {
          const rawIntent = data.split(':')[1] || 'CREATE_EVENT';
          intentToApply = {
            intent: rawIntent as ParsedIntent['intent'],
            confidence: 1.0,
            userConfirmationSummary: 'Evento confirmado directamente',
            eventData: {
              title: 'Compromiso agendado vía Telegram',
              targetDate: format(new Date(), 'yyyy-MM-dd'),
              startTime: '16:00',
              durationMinutes: 60,
              tier: 'tier_2',
              color: 'blue',
              difficultyScore: 2,
            },
          };
        }

        // Branch by Intent Type
        if (
          intentToApply.intent === 'CREATE_EVENT' ||
          intentToApply.intent === 'ADD_DRAWING_PLATE'
        ) {
          const evData = intentToApply.eventData || {
            title: 'Evento Ritmo',
            targetDate: format(new Date(), 'yyyy-MM-dd'),
            startTime: '16:00',
            durationMinutes: 60,
            tier: 'tier_2',
            color: 'blue',
            difficultyScore: 2,
          };

          const targetDate = evData.targetDate || format(new Date(), 'yyyy-MM-dd');
          const startTime = evData.startTime || '16:00';
          const startMin = timeStringToMinutes(startTime);
          const endMin = startMin + (evData.durationMinutes || 60);
          const endTime = minutesToTimeString(endMin);

          // Tier 1 Collision Check
          const { data: tier1Events } = await supabase
            .from('events')
            .select('*')
            .eq('event_date', targetDate)
            .eq('tier', 'tier_1');

          let collisionDetected = false;
          let collidedTitle = '';

          if (tier1Events && tier1Events.length > 0 && evData.tier !== 'tier_1') {
            for (const t1 of tier1Events) {
              const t1Start = timeStringToMinutes(t1.start_time);
              const t1End = timeStringToMinutes(t1.end_time);

              if (Math.max(startMin, t1Start) < Math.min(endMin, t1End)) {
                collisionDetected = true;
                collidedTitle = t1.title;
                break;
              }
            }
          }

          if (collisionDetected) {
            await sendTelegramMessage(
              chatId,
              `⚠️ <b>Conflicto con Inamovible (Tier 1):</b>\nEl horario <code>${startTime} - ${endTime}</code> colisiona con <b>${escapeHtml(
                collidedTitle
              )}</b>.\n\nPor favor, enviá otro horario.`
            );
            return NextResponse.json({ ok: false, error: 'tier1_collision' });
          }

          // Insert into events table
          const isDrawing = intentToApply.intent === 'ADD_DRAWING_PLATE';
          const { error: insertError } = await supabase.from('events').insert({
            title: evData.title,
            description: `Registrado automáticamente vía Telegram Bot (${intentToApply.intent})`,
            event_date: targetDate,
            start_time: startTime,
            end_time: endTime,
            tier: evData.tier || (isDrawing ? 'tier_3' : 'tier_2'),
            color: evData.color || (isDrawing ? 'orange' : 'blue'),
            difficulty_score: evData.difficultyScore || (isDrawing ? 4 : 2),
            created_from: 'telegram_voice',
          });

          if (insertError) {
            console.error('[Webhook] Error inserting event:', insertError);
            await sendTelegramMessage(
              chatId,
              '❌ <i>Ocurrió un error al guardar el evento en la base de datos.</i>'
            );
            return NextResponse.json({ ok: false, error: insertError.message });
          }

          await sendTelegramMessage(
            chatId,
            `✅ <b>¡Compromiso Agendado Exitosamente!</b>\n\n📌 <b>${escapeHtml(
              evData.title
            )}</b>\n🗓 Fecha: <code>${targetDate}</code>\n⏰ Horario: <code>${startTime} - ${endTime}</code>\n🛡 Prioridad: <code>${
              evData.tier
            }</code>`
          );
        } else if (intentToApply.intent === 'LOG_NOTE') {
          const noteData = intentToApply.noteData || {
            title: 'Nota de Telegram',
            content: intentToApply.userConfirmationSummary,
            categoryTag: '#general',
          };

          const { error: noteError } = await supabase.from('notes').insert({
            title: noteData.title,
            content_markdown: noteData.content,
            category_tag: noteData.categoryTag || '#general',
            linked_date: format(new Date(), 'yyyy-MM-dd'),
            is_completed: false,
            synced_to_drive: false,
          });

          if (noteError) {
            console.error('[Webhook] Error inserting note:', noteError);
            await sendTelegramMessage(
              chatId,
              '❌ <i>Ocurrió un error al guardar la nota en Ritmo.</i>'
            );
            return NextResponse.json({ ok: false, error: noteError.message });
          }

          await sendTelegramMessage(
            chatId,
            `📝 <b>¡Nota Guardada en el Anotador!</b>\n\n📌 <b>${escapeHtml(
              noteData.title
            )}</b>\n🏷 Etiqueta: <code>${escapeHtml(
              noteData.categoryTag
            )}</code>\n\n${escapeHtml(noteData.content)}`
          );
        } else if (intentToApply.intent === 'QUERY_SCHEDULE') {
          const today = format(new Date(), 'yyyy-MM-dd');
          const { data: todayEvents } = await supabase
            .from('events')
            .select('*')
            .eq('event_date', today)
            .order('start_time', { ascending: true });

          let scheduleText = `📅 <b>Agenda de Hoy (${today}):</b>\n\n`;
          if (!todayEvents || todayEvents.length === 0) {
            scheduleText += '<i>No tienes compromisos agendados para hoy. ¡Día libre!</i>';
          } else {
            for (const ev of todayEvents) {
              const tierBadge =
                ev.tier === 'tier_1' ? '🛡 T1' : ev.tier === 'tier_2' ? '🔷 T2' : '🟠 T3';
              scheduleText += `• <b>${ev.start_time.slice(0, 5)} - ${ev.end_time.slice(
                0,
                5
              )}</b>: ${escapeHtml(ev.title)} (${tierBadge})\n`;
            }
          }
          await sendTelegramMessage(chatId, scheduleText);
        } else {
          await sendTelegramMessage(
            chatId,
            `✅ <b>Acción confirmada:</b> ${escapeHtml(
              intentToApply.userConfirmationSummary
            )}`
          );
        }

        // Record confirmation in telegram_conversations
        await supabase.from('telegram_conversations').insert({
          chat_id: chatId,
          message_id: callback.message?.message_id || Date.now(),
          role: 'user',
          content: `[Acción: Confirmar propuesta ${intentToApply.intent}]`,
        });

        return NextResponse.json({
          ok: true,
          action: 'callback_confirmed',
          chatId,
        });
      }

      return NextResponse.json({ ok: true, action: 'unhandled_callback' });
    }

    // 3. Handle Incoming Message
    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const chatId = message.chat.id;
    const authorizedChatId = process.env.TELEGRAM_AUTHORIZED_CHAT_ID;
    if (authorizedChatId && String(chatId) !== String(authorizedChatId)) {
      console.warn(`[Webhook] Blocked message from unauthorized chat ID: ${chatId}`);
      await sendTelegramMessage(
        chatId,
        '⛔ <b>Acceso Restringido:</b> Este bot opera como la extensión monousuario soberana de Ritmo.'
      );
      return NextResponse.json({ ok: true, ignored: true });
    }

    const text = message.text;
    const voice = message.voice;

    // A. Handle Bot Commands
    if (text === '/start') {
      await sendTelegramMessage(
        chatId,
        '👋 <b>¡Hola Lucas!</b> Soy <b>TobIAs</b>, tu asistente de calendario y enfoque personal con IA.\n\nPodés enviarme:\n🎙 <b>Notas de voz</b> con compromisos, láminas o ideas\n📷 <b>Fotos de pizarrones</b> con fechas y fórmulas\n💬 <b>Mensajes de texto</b> directos\n\nComandos rápidos:\n• /hoy — Tu agenda para hoy\n• /ayuda — Guía rápida de uso'
      );
      return NextResponse.json({ ok: true, command: '/start' });
    }

    if (text === '/hoy') {
      const supabase = getSupabaseServerClient();
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: todayEvents } = await supabase
        .from('events')
        .select('*')
        .eq('event_date', today)
        .order('start_time', { ascending: true });

      let scheduleText = `📅 <b>Agenda de Hoy (${today}):</b>\n\n`;
      if (!todayEvents || todayEvents.length === 0) {
        scheduleText += '<i>No tienes compromisos agendados para hoy.</i>';
      } else {
        for (const ev of todayEvents) {
          const tierBadge =
            ev.tier === 'tier_1' ? '🛡 T1' : ev.tier === 'tier_2' ? '🔷 T2' : '🟠 T3';
          scheduleText += `• <b>${ev.start_time.slice(0, 5)} - ${ev.end_time.slice(
            0,
            5
          )}</b>: ${escapeHtml(ev.title)} (${tierBadge})\n`;
        }
      }
      await sendTelegramMessage(chatId, scheduleText);
      return NextResponse.json({ ok: true, command: '/hoy' });
    }

    // B. Handle Voice Message
    if (voice) {
      const audioBuffer = await downloadTelegramFile(voice.file_id);
      const audioBase64 = audioBuffer.toString('base64');
      const mimeType = voice.mime_type || 'audio/ogg';

      const parsedIntent = await parseIntent({
        audioBase64,
        mimeType,
      });

      const supabase = getSupabaseServerClient();

      // Log user voice message
      await supabase.from('telegram_conversations').insert({
        chat_id: chatId,
        message_id: message.message_id,
        role: 'user',
        content: '[Nota de voz procesada]',
        media_url: voice.file_id,
      });

      // Send confirmation card with inline keyboard
      const sentCard = await sendConfirmationCard(chatId, parsedIntent);

      // Log assistant card with intent_detected
      await supabase.from('telegram_conversations').insert({
        chat_id: chatId,
        message_id: sentCard.result?.message_id || Date.now(),
        role: 'assistant',
        content: parsedIntent.userConfirmationSummary,
        intent_detected: JSON.stringify(parsedIntent),
      });

      return NextResponse.json({
        ok: true,
        handled: 'voice',
        intent: parsedIntent,
      });
    }

    // C. Handle Text Message
    if (text) {
      const parsedIntent = await parseIntent({
        text,
      });

      const supabase = getSupabaseServerClient();

      // Log user text
      await supabase.from('telegram_conversations').insert({
        chat_id: chatId,
        message_id: message.message_id,
        role: 'user',
        content: text,
      });

      // Send confirmation card with inline keyboard
      const sentCard = await sendConfirmationCard(chatId, parsedIntent);

      // Log assistant response
      await supabase.from('telegram_conversations').insert({
        chat_id: chatId,
        message_id: sentCard.result?.message_id || Date.now(),
        role: 'assistant',
        content: parsedIntent.userConfirmationSummary,
        intent_detected: JSON.stringify(parsedIntent),
      });

      return NextResponse.json({
        ok: true,
        handled: 'text',
        intent: parsedIntent,
      });
    }

    return NextResponse.json({ ok: true, ignored: true });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Error inesperado al procesar webhook';
    console.error('[TelegramWebhook] Unhandled error:', error);
    return createProblemResponse(
      500,
      'Error Interno del Servidor',
      detail,
      'telegram-webhook-failure',
      '/api/telegram/webhook'
    );
  }
}
