import { NextRequest, NextResponse } from 'next/server';
import { format, addDays } from 'date-fns';
import { parseIntent, ParsedIntent } from '@/lib/ai/intentParser';
import { generateContentWithFallback } from '@/lib/ai/gemini';
import {
  sendTelegramMessage,
  sendConfirmationCard,
  answerCallbackQuery,
  downloadTelegramFile,
} from '@/lib/telegram/bot';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { syncUtnNotesToDrive } from '@/lib/drive/sync';
import {
  timeStringToMinutes,
  minutesToTimeString,
  formatInArgentina,
  getArgentinaDateString,
  getArgentinaTimeString,
} from '@/lib/date-utils';
import { createProblemResponse } from '@/lib/rfc7807';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Detects upcoming calendar events and deadlines within next 36 hours from Classroom and Tasks
 * and constructs an unmissable, insistent alert banner.
 */
async function getUrgentDeadlineNotice(supabase: any): Promise<string | null> {
  try {
    const now = new Date();
    const todayStr = getArgentinaDateString(now);
    const currentTimeStr = getArgentinaTimeString(now);
    const currentHHMM = currentTimeStr.slice(0, 5);
    const limitDate = new Date(now.getTime() + 36 * 3600 * 1000);

    // 1. Query today's upcoming calendar events (start_time >= current time in Argentina)
    const { data: todayEvents } = await supabase
      .from('events')
      .select('*')
      .eq('event_date', todayStr)
      .order('start_time', { ascending: true });

    const upcomingEvents = (todayEvents || []).filter((ev: any) => {
      if (!ev.start_time) return false;
      const startHHMM = ev.start_time.slice(0, 5);
      return startHHMM >= currentHHMM;
    });

    // 2. Query classroom_sync for pending deliveries (excluding already turned in or graded)
    const { data: upcomingClassroom } = await supabase
      .from('classroom_sync')
      .select('*')
      .not('due_date', 'is', null)
      .neq('state', 'TURNED_IN')
      .neq('state', 'RETURNED')
      .gte('due_date', new Date(now.getTime() - 2 * 3600 * 1000).toISOString())
      .lte('due_date', limitDate.toISOString())
      .order('due_date', { ascending: true })
      .limit(4);

    // 3. Query pending tasks
    const { data: upcomingTasks } = await supabase
      .from('tasks')
      .select('*')
      .neq('status', 'completed')
      .gte('due_date', todayStr)
      .lte('due_date', format(limitDate, 'yyyy-MM-dd'))
      .order('due_date', { ascending: true })
      .limit(3);

    const hasEvents = upcomingEvents && upcomingEvents.length > 0;
    const hasClassroom = upcomingClassroom && upcomingClassroom.length > 0;
    const hasTasks = upcomingTasks && upcomingTasks.length > 0;

    if (!hasEvents && !hasClassroom && !hasTasks) {
      return null;
    }

    let banner = '🚨🚨 <b>¡AVISO INTEGRADO: COMPROMISOS Y ENTREGAS INMINENTES!</b> 🚨🚨\n';
    banner += '⚠️ <i>¡Atención! Tenés actividades y entregas por delante:</i>\n\n';

    if (hasEvents) {
      banner += '⏰ <b>Eventos de Hoy (a partir de ahora):</b>\n';
      for (const ev of upcomingEvents) {
        const tierBadge =
          ev.tier === 'tier_1'
            ? '🛡️🔴 Tier 1 (Inamovible)'
            : ev.tier === 'tier_2'
            ? '⚡🟡 Tier 2 (Movible)'
            : '🌱🟢 Tier 3 (Hábito)';
        banner += `• <b>${ev.start_time.slice(0, 5)} - ${ev.end_time.slice(
          0,
          5
        )} hs</b>: ${escapeHtml(ev.title)} [${tierBadge}]\n`;
      }
      banner += '\n';
    }

    if (hasClassroom) {
      banner += '📚 <b>Entregas Próximas de Google Classroom:</b>\n';
      for (const c of upcomingClassroom) {
        const dObj = c.due_date ? new Date(c.due_date) : null;
        const dStr = dObj ? `${formatInArgentina(dObj, 'datetime')} hs` : 'Sin hora fija';
        const dateStrBA = dObj ? getArgentinaDateString(dObj) : '';
        const isTomorrow = dateStrBA === getArgentinaDateString(addDays(now, 1));
        const isToday = dateStrBA === todayStr;
        const tag = isToday ? '🔴 <b>HOY</b>' : isTomorrow ? '⚠️ <b>MAÑANA</b>' : '🗓';

        banner += `${tag} <b>${dStr}</b> — <i>${escapeHtml(c.course_name)}</i>\n`;
        banner += `   📝 <b>${escapeHtml(c.title)}</b>\n`;
        if (c.alternate_link) {
          banner += `   🔗 <a href="${c.alternate_link}">Abrir en Google Classroom</a>\n`;
        }
        banner += '\n';
      }
    }

    if (hasTasks) {
      const filteredTasks = upcomingTasks.filter((t: any) => !t.classroom_coursework_id);
      if (filteredTasks.length > 0) {
        banner += '📌 <b>Tareas pendientes:</b>\n';
        for (const t of filteredTasks) {
          banner += `• <b>${escapeHtml(t.title)}</b> (Vence: ${t.due_date || 'Próximamente'})\n`;
        }
        banner += '\n';
      }
    }

    banner += '<i>¡Mantené el foco y avanzá sin postergar!</i>';
    return banner.trim();
  } catch (err) {
    console.warn('[Webhook] Error building urgent deadline notice:', err);
    return null;
  }
}

/**
 * Handles conversational queries, questions about Classroom, agenda, notes or general chat.
 * Responds directly without confirmation cards or buttons.
 */
async function handleChatbotQuery(
  chatId: number | string,
  userText: string,
  parsedIntent: ParsedIntent
): Promise<string> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const today = getArgentinaDateString(now);
  const lower = userText.toLowerCase().trim();

  // 1. Check if user is querying schedule / daily brief ("qué tengo hoy", "qué tengo que hacer", "recordame", "agenda", "tengo algo")
  const isTomorrow =
    parsedIntent.target_date_hint === 'tomorrow' ||
    lower.includes('mañana') ||
    lower.includes('manana');

  const isDailyBriefQuery =
    !isTomorrow &&
    (lower.includes('qué tengo hoy') ||
      lower.includes('que tengo hoy') ||
      lower.includes('qué tengo que hacer') ||
      lower.includes('que tengo que hacer') ||
      lower.includes('recordame') ||
      lower.includes('recuérdame') ||
      lower.includes('recuerdame') ||
      lower.includes('agenda') ||
      lower.includes('tengo algo') ||
      lower.includes('qué tengo') ||
      lower.includes('que tengo') ||
      parsedIntent.query_category === 'SCHEDULE' ||
      parsedIntent.intent === 'QUERY_SCHEDULE');

  if (isDailyBriefQuery) {
    // 1) Query today's commitments with times and Tiers
    const { data: dayEvents } = await supabase
      .from('events')
      .select('*')
      .eq('event_date', today)
      .order('start_time', { ascending: true });

    // 2) Query Classroom pending tasks
    const { data: upcomingClassroom } = await supabase
      .from('classroom_sync')
      .select('*')
      .not('due_date', 'is', null)
      .neq('state', 'TURNED_IN')
      .neq('state', 'RETURNED')
      .gte('due_date', new Date(now.getTime() - 2 * 3600 * 1000).toISOString())
      .lte('due_date', new Date(now.getTime() + 72 * 3600 * 1000).toISOString())
      .order('due_date', { ascending: true });

    const { data: noDueClassroom } = await supabase
      .from('classroom_sync')
      .select('*')
      .is('due_date', null)
      .neq('state', 'TURNED_IN')
      .neq('state', 'RETURNED')
      .or('course_name.ilike.%2026%,course_name.ilike.%seguridad%,course_name.ilike.%régimen%,course_name.ilike.%educación física%')
      .order('title', { ascending: true })
      .limit(3);

    let brief = `📅 <b>Resumen Diario Integrado de Hoy (${today})</b>\n\n`;

    // Section 1: Compromisos del día con horarios y Tiers (devocional, iglesia, inglés, UTN, pasantías, etc.)
    brief += `📌 <b>1. Compromisos y Clases de Hoy:</b>\n`;
    if (!dayEvents || dayEvents.length === 0) {
      brief += `<i>No tenés compromisos específicos registrados para hoy en el calendario.</i>\n`;
    } else {
      for (const ev of dayEvents) {
        const tierBadge =
          ev.tier === 'tier_1'
            ? '🛡️ Tier 1 (Inamovible)'
            : ev.tier === 'tier_2'
            ? '⚡ Tier 2 (Movible)'
            : '🌱 Tier 3 (Hábito/Carga)';
        brief += `• <b>${ev.start_time.slice(0, 5)} - ${ev.end_time.slice(0, 5)} hs</b>: ${escapeHtml(
          ev.title
        )} [${tierBadge}]\n`;
      }
    }
    brief += '\n';

    // Section 2: Tareas de Classroom pendientes
    brief += `📚 <b>2. Tareas de Classroom Pendientes:</b>\n`;
    const hasClassroomDue = upcomingClassroom && upcomingClassroom.length > 0;
    const hasClassroomNoDue = noDueClassroom && noDueClassroom.length > 0;

    if (!hasClassroomDue && !hasClassroomNoDue) {
      brief += `<i>¡Al día! No tenés entregas urgentes de Classroom registradas por ahora.</i>\n`;
    } else {
      if (hasClassroomDue) {
        for (const item of upcomingClassroom) {
          const dObj = item.due_date ? new Date(item.due_date) : null;
          const dueStr = dObj ? `${formatInArgentina(dObj, 'datetime')} hs` : 'Sin fecha fija';
          const isToday = dObj && getArgentinaDateString(dObj) === today;
          const tag = isToday ? '🔴 <b>HOY</b>' : '⚠️';
          brief += `• ${tag} <b>${dueStr}</b>: <i>${escapeHtml(item.course_name)}</i> — <b>${escapeHtml(
            item.title
          )}</b>\n`;
          if (item.alternate_link) {
            brief += `   🔗 <a href="${item.alternate_link}">Abrir tarea en Classroom</a>\n`;
          }
        }
      }
      if (hasClassroomNoDue) {
        for (const item of noDueClassroom) {
          brief += `• 📋 <i>${escapeHtml(item.course_name)}</i>: ${escapeHtml(item.title)}\n`;
        }
      }
    }
    brief += '\n';

    // Section 3: Hábitos recomendados para hoy (láminas, gym, guitarra)
    brief += `💪 <b>3. Hábitos Recomendados para Hoy:</b>\n`;
    brief += `• 📐 <b>Dibujo Técnico (Láminas):</b> Avanzar bloque de láminas pendientes (~2h).\n`;
    brief += `• 🏋️ <b>Gimnasio / Entrenamiento Físico:</b> Rutina de pesas y movilidad (1-2h).\n`;
    brief += `• 🎸 <b>Guitarra & Práctica de Inglés:</b> Enfoque de instrumento y fluidez oral (45-60 min).\n\n`;

    brief += `💡 <i>Recordá: Los bloques de Tier 1 son inamovibles; los hábitos de Tier 3 se ajustan si el día se sobrecarga. ¿Querés agendar o registrar algo ahora?</i>`;

    await sendTelegramMessage(chatId, brief);
    return brief;
  }

  // 2. CLASSROOM OR TASKS QUERY ONLY
  if (
    parsedIntent.query_category === 'CLASSROOM_OR_TASKS' ||
    lower.includes('classroom') ||
    lower.includes('tarea') ||
    lower.includes('entrega') ||
    lower.includes('tp') ||
    lower.includes('deberes')
  ) {
    // 1. Query upcoming items with due_date (excluding turned in or graded)
    const { data: upcomingClassroom } = await supabase
      .from('classroom_sync')
      .select('*')
      .not('due_date', 'is', null)
      .neq('state', 'TURNED_IN')
      .neq('state', 'RETURNED')
      .gte('due_date', new Date(now.getTime() - 24 * 3600 * 1000).toISOString())
      .order('due_date', { ascending: true })
      .limit(6);

    // 2. Query active 2026 items without due_date (excluding turned in or graded)
    const { data: noDueClassroom } = await supabase
      .from('classroom_sync')
      .select('*')
      .is('due_date', null)
      .neq('state', 'TURNED_IN')
      .neq('state', 'RETURNED')
      .or('course_name.ilike.%2026%,course_name.ilike.%seguridad%,course_name.ilike.%régimen%,course_name.ilike.%educación física%')
      .limit(6);

    const hasUpcoming = upcomingClassroom && upcomingClassroom.length > 0;
    const hasNoDue = noDueClassroom && noDueClassroom.length > 0;

    if (!hasUpcoming && !hasNoDue) {
      const msg =
        '🎉 <b>No tenés entregas pendientes ni tareas de Classroom</b> registradas para tus cursos activos en Ritmo.';
      await sendTelegramMessage(chatId, msg);
      return msg;
    }

    let response = '📚 <b>Tareas y Entregas de Google Classroom:</b>\n\n';

    if (hasUpcoming) {
      response += '🗓 <b>Entregas con fecha límite:</b>\n';
      for (const item of upcomingClassroom) {
        const dueDateObj = item.due_date ? new Date(item.due_date) : null;
        const dueStr = dueDateObj ? `${formatInArgentina(dueDateObj, 'datetime')} hs` : 'Sin fecha';
        const dateStrBA = dueDateObj ? getArgentinaDateString(dueDateObj) : '';
        const isTargetTomorrow = dateStrBA === getArgentinaDateString(addDays(now, 1));
        const isTargetToday = dateStrBA === today;

        const tag = isTargetToday ? '🔴 <b>HOY</b>' : isTargetTomorrow ? '⚠️ <b>MAÑANA</b>' : '📌';

        response += `${tag} <b>${dueStr}</b> — <i>${escapeHtml(item.course_name)}</i>\n`;
        response += `   📝 <b>${escapeHtml(item.title)}</b>\n`;
        if (item.alternate_link) {
          response += `   🔗 <a href="${item.alternate_link}">Abrir en Google Classroom</a>\n`;
        }
        response += '\n';
      }
    }

    if (hasNoDue) {
      response += '📋 <b>Tareas activas sin fecha límite (Cursos 2026):</b>\n';
      for (const item of noDueClassroom) {
        response += `• <b>[${escapeHtml(item.course_name)}]</b> <i>${escapeHtml(item.title)}</i>\n`;
        if (item.alternate_link) {
          response += `   🔗 <a href="${item.alternate_link}">Abrir</a>\n`;
        }
      }
      response += '\n<i>(Podés ver las tareas completas en la app web de Ritmo en tu agenda y notas).</i>\n\n';
    }

    response += '<i>¿Querés que te reserve un bloque hoy para avanzar con estas tareas?</i>';

    await sendTelegramMessage(chatId, response);
    return response;
  }

  // 3. SCHEDULE QUERY FOR TOMORROW
  if (isTomorrow) {
    const targetDate = getArgentinaDateString(addDays(now, 1));
    const dateLabel = `Mañana (${targetDate})`;

    const { data: dayEvents } = await supabase
      .from('events')
      .select('*')
      .eq('event_date', targetDate)
      .order('start_time', { ascending: true });

    const { data: dayClassroom } = await supabase
      .from('classroom_sync')
      .select('*')
      .neq('state', 'TURNED_IN')
      .neq('state', 'RETURNED')
      .gte('due_date', `${targetDate}T00:00:00.000Z`)
      .lte('due_date', `${targetDate}T23:59:59.999Z`);

    let response = `📅 <b>Agenda de ${dateLabel}:</b>\n\n`;

    if (!dayEvents || dayEvents.length === 0) {
      response += '<i>No tenés compromisos agendados para este día.</i>\n\n';
    } else {
      for (const ev of dayEvents) {
        const tierBadge =
          ev.tier === 'tier_1' ? '🛡️ Tier 1' : ev.tier === 'tier_2' ? '⚡ Tier 2' : '🌱 Tier 3';
        response += `• <b>${ev.start_time.slice(0, 5)} - ${ev.end_time.slice(
          0,
          5
        )} hs</b>: ${escapeHtml(ev.title)} [${tierBadge}]\n`;
      }
      response += '\n';
    }

    if (dayClassroom && dayClassroom.length > 0) {
      response += '⚠️ <b>Entregas de Classroom para ese día:</b>\n';
      for (const item of dayClassroom) {
        const timeStr = item.due_date ? formatInArgentina(item.due_date, 'time') : '';
        response += `• <b>${timeStr} hs</b>: ${escapeHtml(item.course_name)} — <i>${escapeHtml(
          item.title
        )}</i>\n`;
      }
    }

    await sendTelegramMessage(chatId, response);
    return response;
  }

  // 3. GENERAL CHAT OR NOTES QUERY
  try {
    const urgentNotice = await getUrgentDeadlineNotice(supabase);

    const chatPrompt = `
Sos TobIAs, el asistente inteligente de Ritmo (calendario, tareas y enfoque personal para un estudiante técnico de secundaria y aspirante a ingeniería en la UTN).
El usuario te escribió en Telegram: "${userText}"

Contexto actual del sistema:
- Fecha de hoy: ${today} (Buenos Aires, GMT-3).
- Responde de forma cordial, concisa y empática en español rioplatense (voseo suave).
- NO uses nombres de pila personales.
- Podés explicarle tus capacidades si pregunta: gestionás su agenda, alertás entregas de Google Classroom y guardás notas de voz o texto.
`;
    let aiResponse = await generateContentWithFallback(chatPrompt);

    if (urgentNotice) {
      aiResponse = `${urgentNotice}\n\n----------------------------------------\n\n${aiResponse}`;
    }

    await sendTelegramMessage(chatId, aiResponse);
    return aiResponse;
  } catch (err) {
    console.error('[Webhook] Error generating general AI response:', err);
    let fallbackMsg =
      '¡Hola! Soy TobIAs. Podés consultarme tu agenda (/hoy), tus tareas de Classroom o enviarme notas y compromisos para agendar.';
    const urgentNotice = await getUrgentDeadlineNotice(supabase);
    if (urgentNotice) {
      fallbackMsg = `${urgentNotice}\n\n----------------------------------------\n\n${fallbackMsg}`;
    }
    await sendTelegramMessage(chatId, fallbackMsg);
    return fallbackMsg;
  }
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
      if (data.startsWith('discard:')) {
        await answerCallbackQuery(callbackId, 'Operación descartada');
        await sendTelegramMessage(
          chatId,
          '❌ <b>Operación descartada.</b> No se modificó tu calendario.'
        );

        const supabase = getSupabaseServerClient();
        await supabase.from('telegram_conversations').insert({
          chat_id: chatId,
          message_id: callback.message?.message_id || Date.now(),
          role: 'user',
          content: '[Acción: Descartar propuesta]',
        });

        return NextResponse.json({ ok: true, action: 'discarded' });
      }

      // B. Confirm and Save Action
      if (data.startsWith('confirm:')) {
        await answerCallbackQuery(callbackId, 'Procesando confirmación...');

        const supabase = getSupabaseServerClient();

        // Retrieve last proposed intent for this chat
        const { data: lastConversations } = await supabase
          .from('telegram_conversations')
          .select('*')
          .eq('chat_id', chatId)
          .eq('role', 'assistant')
          .not('intent_detected', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        let intentToApply: ParsedIntent | null = null;
        if (lastConversations && lastConversations.length > 0) {
          try {
            intentToApply = JSON.parse(
              lastConversations[0].intent_detected as string
            ) as ParsedIntent;
          } catch (e) {
            console.warn('[Webhook] Failed to parse cached intent_detected:', e);
          }
        }

        if (!intentToApply) {
          const rawIntent = data.replace('confirm:', '');
          intentToApply = {
            action_type: 'MUTATION',
            intent: rawIntent as ParsedIntent['intent'],
            confidence: 0.9,
            eventData: {
              title: 'Compromiso Agendado',
              targetDate: format(new Date(), 'yyyy-MM-dd'),
              startTime: '16:00',
              durationMinutes: 60,
              tier: 'tier_2',
              color: 'blue',
              difficultyScore: 2,
            },
            userConfirmationSummary: 'Compromiso confirmado',
          };
        }

        // Apply intent based on type
        if (
          intentToApply.intent === 'CREATE_EVENT' ||
          intentToApply.intent === 'ADD_DRAWING_PLATE'
        ) {
          const evData = intentToApply.eventData || {
            title: 'Compromiso sin título',
            targetDate: format(new Date(), 'yyyy-MM-dd'),
            startTime: '16:00',
            durationMinutes: 60,
            tier: 'tier_2' as const,
            color: 'blue' as const,
            difficultyScore: 2,
          };

          const targetDate = evData.targetDate || format(new Date(), 'yyyy-MM-dd');
          const startTime = evData.startTime || '16:00';
          const duration = evData.durationMinutes || 60;
          const startMin = timeStringToMinutes(startTime);
          const endMin = startMin + duration;
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
    const photo = message.photo;
    const caption = message.caption;

    const supabase = getSupabaseServerClient();
    const urgentNotice = await getUrgentDeadlineNotice(supabase);

    // A. Handle Bot Commands
    if (text === '/start' || text === '/ayuda') {
      let welcomeMsg =
        '👋 <b>¡Hola!</b> Soy <b>TobIAs</b>, tu asistente de calendario y enfoque personal con IA.\n\nPodés enviarme:\n🎙 <b>Notas de voz</b> con compromisos, láminas o ideas\n📷 <b>Fotos de pizarrones</b> con fechas y fórmulas\n💬 <b>Mensajes de texto</b> directos\n\nComandos rápidos:\n• /hoy — Tu agenda para hoy\n• /notebooklm — Sincronizar y estudiar con NotebookLM\n• /ayuda — Guía rápida de uso';
      if (urgentNotice) {
        welcomeMsg = `${urgentNotice}\n\n----------------------------------------\n\n${welcomeMsg}`;
      }
      await sendTelegramMessage(chatId, welcomeMsg);
      return NextResponse.json({ ok: true, command: text });
    }

    if (text === '/notebooklm') {
      try {
        const driveResult = await syncUtnNotesToDrive();
        let nlmMsg = '🧠 <b>Google NotebookLM & Apuntes UTN en Ritmo:</b>\n\n';
        nlmMsg += `📂 <b>Carpeta en Google Drive:</b> <i>Ritmo - UTN Apuntes</i>\n`;
        nlmMsg += `📝 <b>Notas sincronizadas:</b> ${driveResult.syncedCount}\n\n`;
        nlmMsg += '🎯 <b>Cómo vincularlo para preparar tus parciales de la UTN:</b>\n';
        nlmMsg += '1. Entrá a <a href="https://notebooklm.google.com/">Google NotebookLM</a>.\n';
        nlmMsg += '2. Creá o abrí tu cuaderno de estudio de UTN.\n';
        nlmMsg += '3. Seleccioná <b>Google Drive</b> y elegí la carpeta <b>Ritmo - UTN Apuntes</b>.\n';
        nlmMsg += '4. ¡Listo! Vas a tener resúmenes en audio, cuestionarios y guías con tus propias fórmulas y fotos de clase.\n\n';
        nlmMsg += '💡 <i>Tip: Cada foto de pizarrón que me mandes se transcribe y sube automáticamente a esta carpeta.</i>';

        await sendTelegramMessage(chatId, nlmMsg);
        return NextResponse.json({ ok: true, command: '/notebooklm', driveResult });
      } catch (err: any) {
        await sendTelegramMessage(
          chatId,
          '⚠️ Error al sincronizar con Google Drive para NotebookLM. Verificá tu conexión o credenciales en la app.'
        );
        return NextResponse.json({ ok: false, error: err.message });
      }
    }

    if (text === '/hoy') {
      const now = new Date();
      const today = getArgentinaDateString(now);
      const lookahead = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();

      const { data: todayEvents } = await supabase
        .from('events')
        .select('*')
        .eq('event_date', today)
        .order('start_time', { ascending: true });

      const { data: upcomingTasks } = await supabase
        .from('classroom_sync')
        .select('*')
        .not('due_date', 'is', null)
        .neq('state', 'TURNED_IN')
        .neq('state', 'RETURNED')
        .gte('due_date', new Date(now.getTime() - 2 * 3600 * 1000).toISOString())
        .lte('due_date', lookahead)
        .order('due_date', { ascending: true });

      const { data: noDueTasks } = await supabase
        .from('classroom_sync')
        .select('*')
        .is('due_date', null)
        .neq('state', 'TURNED_IN')
        .neq('state', 'RETURNED')
        .or('course_name.ilike.%2026%,course_name.ilike.%seguridad%,course_name.ilike.%régimen%,course_name.ilike.%educación física%')
        .order('title', { ascending: true })
        .limit(3);

      let scheduleText = '';
      if (urgentNotice) {
        scheduleText += `${urgentNotice}\n\n----------------------------------------\n\n`;
      }

      scheduleText += `📅 <b>Resumen Diario Integrado de Hoy (${today})</b>\n\n`;

      // 1. Compromisos del día con horarios y Tiers
      scheduleText += `📌 <b>1. Compromisos y Clases del Día:</b>\n`;
      if (!todayEvents || todayEvents.length === 0) {
        scheduleText += '<i>No tenés compromisos específicos registrados para hoy en el calendario.</i>\n\n';
      } else {
        for (const ev of todayEvents) {
          const tierBadge =
            ev.tier === 'tier_1'
              ? '🛡️ Tier 1 (Inamovible)'
              : ev.tier === 'tier_2'
              ? '⚡ Tier 2 (Movible)'
              : '🌱 Tier 3 (Hábito/Carga)';
          scheduleText += `• <b>${ev.start_time.slice(0, 5)} - ${ev.end_time.slice(
            0,
            5
          )} hs</b>: ${escapeHtml(ev.title)} [${tierBadge}]\n`;
        }
        scheduleText += '\n';
      }

      // 2. Tareas de Classroom pendientes
      scheduleText += `📚 <b>2. Tareas de Classroom Pendientes:</b>\n`;
      const hasClassroomDue = upcomingTasks && upcomingTasks.length > 0;
      const hasClassroomNoDue = noDueTasks && noDueTasks.length > 0;

      if (!hasClassroomDue && !hasClassroomNoDue) {
        scheduleText += '<i>¡Al día! No tenés entregas pendientes de Classroom por ahora.</i>\n\n';
      } else {
        if (hasClassroomDue) {
          for (const t of upcomingTasks) {
            const dObj = t.due_date ? new Date(t.due_date) : null;
            const dStr = dObj ? `${formatInArgentina(dObj, 'datetime')} hs` : '';
            const isToday = dObj && getArgentinaDateString(dObj) === today;
            const tag = isToday ? '🔴 <b>HOY</b>' : '⚠️';
            scheduleText += `• ${tag} <b>${dStr}</b>: <i>${escapeHtml(t.course_name)}</i> — <b>${escapeHtml(
              t.title
            )}</b>\n`;
            if (t.alternate_link) {
              scheduleText += `   🔗 <a href="${t.alternate_link}">Abrir tarea</a>\n`;
            }
          }
        }
        if (hasClassroomNoDue) {
          for (const t of noDueTasks) {
            scheduleText += `• 📋 <i>${escapeHtml(t.course_name)}</i>: ${escapeHtml(t.title)}\n`;
          }
        }
        scheduleText += '\n';
      }

      // 3. Hábitos recomendados para hoy (láminas, gym, guitarra)
      scheduleText += `💪 <b>3. Hábitos Recomendados para Hoy:</b>\n`;
      scheduleText += `• 📐 <b>Dibujo Técnico (Láminas):</b> Avanzar bloque de láminas pendientes (~2h).\n`;
      scheduleText += `• 🏋️ <b>Gimnasio / Entrenamiento Físico:</b> Rutina de pesas y movilidad (1-2h).\n`;
      scheduleText += `• 🎸 <b>Guitarra & Práctica de Inglés:</b> Enfoque de instrumento y fluidez oral (45-60 min).\n\n`;

      scheduleText += `💡 <i>Recordá: Los bloques de Tier 1 son inamovibles. ¿Querés agendar o registrar algo ahora?</i>`;

      await sendTelegramMessage(chatId, scheduleText);
      return NextResponse.json({ ok: true, command: '/hoy' });
    }

    // B. Handle Photo / Whiteboard Image
    if (photo && photo.length > 0) {
      const largestPhoto = photo[photo.length - 1];
      const photoBuffer = await downloadTelegramFile(largestPhoto.file_id);
      const imageBase64 = photoBuffer.toString('base64');
      const userCaption = caption || '';

      // Log user incoming photo
      await supabase.from('telegram_conversations').insert({
        chat_id: chatId,
        message_id: message.message_id,
        role: 'user',
        content: userCaption ? `[Foto recibida]: ${userCaption}` : '[Foto/Pizarra recibida]',
        media_url: largestPhoto.file_id,
      });

      // Multimodal OCR analysis with Gemini
      const parsedIntent = await parseIntent({
        imageBase64,
        mimeType: 'image/jpeg',
        caption: userCaption,
        text: userCaption,
      });

      // 1. If note or study whiteboard -> save to Supabase and trigger Drive sync for #utn
      if (parsedIntent.intent === 'LOG_NOTE' && parsedIntent.noteData) {
        const { title, content, categoryTag } = parsedIntent.noteData;
        const finalTag =
          categoryTag ||
          (userCaption.toLowerCase().includes('utn') ? '#utn' : '#general');

        const { data: insertedNote, error: insertErr } = await supabase
          .from('notes')
          .insert({
            title,
            content_markdown: content,
            category_tag: finalTag,
            is_completed: false,
            synced_to_drive: false,
          })
          .select()
          .single();

        if (insertErr) {
          console.error('[Webhook] Error inserting note from photo:', insertErr);
        }

        // Trigger Google Drive sync for UTN study materials
        if (finalTag === '#utn' || userCaption.toLowerCase().includes('utn')) {
          try {
            await syncUtnNotesToDrive();
          } catch (driveErr) {
            console.warn('[Webhook] Background Drive sync warning:', driveErr);
          }
        }

        let replyMsg = `📸 <b>¡Pizarra / Apunte analizado por TobIAs!</b>\n\n`;
        replyMsg += `📝 <b>${escapeHtml(title)}</b>\n`;
        replyMsg += `🏷 <code>${escapeHtml(finalTag)}</code>\n\n`;
        replyMsg += `<b>Transcripción y fórmulas detectadas:</b>\n${escapeHtml(content)}\n\n`;
        replyMsg += `✅ <i>Guardado en tus notas de Ritmo y sincronizado con tu carpeta de Google Drive para NotebookLM.</i>`;

        if (urgentNotice) {
          replyMsg = `${urgentNotice}\n\n----------------------------------------\n\n${replyMsg}`;
        }

        await sendTelegramMessage(chatId, replyMsg);

        await supabase.from('telegram_conversations').insert({
          chat_id: chatId,
          message_id: Date.now(),
          role: 'assistant',
          content: replyMsg,
          intent_detected: JSON.stringify(parsedIntent),
        });

        return NextResponse.json({
          ok: true,
          handled: 'photo_note',
          note: insertedNote,
          intent: parsedIntent,
        });
      }

      // 2. If calendar event or task detected from photo
      if (
        parsedIntent.intent === 'CREATE_EVENT' ||
        parsedIntent.intent === 'CREATE_TASK'
      ) {
        if (urgentNotice) {
          await sendTelegramMessage(chatId, urgentNotice);
        }
        const sentCard = await sendConfirmationCard(chatId, parsedIntent);

        await supabase.from('telegram_conversations').insert({
          chat_id: chatId,
          message_id: sentCard.result?.message_id || Date.now(),
          role: 'assistant',
          content: parsedIntent.userConfirmationSummary,
          intent_detected: JSON.stringify(parsedIntent),
        });

        return NextResponse.json({
          ok: true,
          handled: 'photo_mutation',
          intent: parsedIntent,
        });
      }

      // 3. Fallback: Query or general visual discussion
      const queryResponse = await handleChatbotQuery(
        chatId,
        userCaption || parsedIntent.userConfirmationSummary,
        parsedIntent
      );

      await supabase.from('telegram_conversations').insert({
        chat_id: chatId,
        message_id: Date.now(),
        role: 'assistant',
        content: queryResponse,
        intent_detected: JSON.stringify(parsedIntent),
      });

      return NextResponse.json({
        ok: true,
        handled: 'photo_query',
        intent: parsedIntent,
      });
    }

    // C. Handle Voice Message
    if (voice) {
      const audioBuffer = await downloadTelegramFile(voice.file_id);
      const audioBase64 = audioBuffer.toString('base64');
      const mimeType = voice.mime_type || 'audio/ogg';

      const parsedIntent = await parseIntent({
        audioBase64,
        mimeType,
      });

      // Log user voice message
      await supabase.from('telegram_conversations').insert({
        chat_id: chatId,
        message_id: message.message_id,
        role: 'user',
        content: '[Nota de voz procesada]',
        media_url: voice.file_id,
      });

      // If user is just asking a question via voice, respond conversationally
      if (parsedIntent.action_type === 'QUERY') {
        const queryText = parsedIntent.userConfirmationSummary || 'Consulta por voz';
        const responseText = await handleChatbotQuery(chatId, queryText, parsedIntent);

        await supabase.from('telegram_conversations').insert({
          chat_id: chatId,
          message_id: Date.now(),
          role: 'assistant',
          content: responseText,
          intent_detected: JSON.stringify(parsedIntent),
        });

        return NextResponse.json({
          ok: true,
          handled: 'voice_query',
          intent: parsedIntent,
        });
      }

      // Mutation: Send confirmation card with inline keyboard
      if (urgentNotice) {
        await sendTelegramMessage(chatId, urgentNotice);
      }
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
        handled: 'voice_mutation',
        intent: parsedIntent,
      });
    }

    // D. Handle Text Message
    if (text) {
      const parsedIntent = await parseIntent({
        text,
      });

      // Log user text
      await supabase.from('telegram_conversations').insert({
        chat_id: chatId,
        message_id: message.message_id,
        role: 'user',
        content: text,
      });

      // 1. Natural Language Query / Chat -> Direct intelligent response
      if (parsedIntent.action_type === 'QUERY') {
        const responseText = await handleChatbotQuery(chatId, text, parsedIntent);

        await supabase.from('telegram_conversations').insert({
          chat_id: chatId,
          message_id: Date.now(),
          role: 'assistant',
          content: responseText,
          intent_detected: JSON.stringify(parsedIntent),
        });

        return NextResponse.json({
          ok: true,
          handled: 'text_query',
          intent: parsedIntent,
        });
      }

      // 2. Action / Mutation -> Send confirmation card with inline keyboard
      if (urgentNotice) {
        await sendTelegramMessage(chatId, urgentNotice);
      }
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
        handled: 'text_mutation',
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
