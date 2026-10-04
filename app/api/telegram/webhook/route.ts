import { NextRequest, NextResponse } from 'next/server';
import { parseIntent } from '@/lib/ai/intentParser';

const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// RFC 7807 Problem Details Response Helper
function errorResponse(status: number, title: string, detail: string, type: string) {
  return new NextResponse(
    JSON.stringify({
      type: `https://ritmo.app/errors/${type}`,
      title,
      status,
      detail,
      instance: '/api/telegram/webhook',
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  try {
    // 1. Validate Secret Token Header if configured
    if (TELEGRAM_WEBHOOK_SECRET) {
      const receivedSecret = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (receivedSecret !== TELEGRAM_WEBHOOK_SECRET) {
        return errorResponse(
          403,
          'Acceso no autorizado',
          'El encabezado X-Telegram-Bot-Api-Secret-Token no es válido.',
          'forbidden-webhook-secret'
        );
      }
    }

    const update = await req.json();

    // 2. Handle Callback Queries (Inline Button Clicks)
    if (update.callback_query) {
      const callback = update.callback_query;
      const data = callback.data || '';
      const chatId = callback.message?.chat?.id;

      // Handle confirmation or cancellation
      const replyText = data.startsWith('confirm_')
        ? '✅ ¡Acción confirmada y guardada en tu calendario Ritmo!'
        : '❌ Operación cancelada.';

      return NextResponse.json({
        ok: true,
        action: 'callback_handled',
        chatId,
        replyText,
      });
    }

    // 3. Handle Message
    const message = update.message;
    if (!message) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const chatId = message.chat.id;
    const text = message.text;
    const voice = message.voice;

    let userPrompt = text || '';

    // If voice note received
    if (voice && !userPrompt) {
      userPrompt = 'Nota de voz recibida para procesar en Ritmo';
    }

    if (!userPrompt) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    // 4. Quick Command Checks
    if (userPrompt === '/start') {
      return NextResponse.json({
        ok: true,
        reply: '👋 ¡Hola Lucas! Soy Ritmo, tu asistente de calendario y anotador inteligente. Mandame audios, fotos de pizarrones o mensajes de texto para organizar tu día.',
      });
    }

    if (userPrompt === '/hoy') {
      return NextResponse.json({
        ok: true,
        reply: '📅 Resumen para hoy: Devocional (06:45), UTN Matemática (08:00), Lámina 3 (16:00), Gimnasio (19:00).',
      });
    }

    // 5. AI Extraction with Gemini 2.0 Flash / Heuristics
    const parsedIntent = await parseIntent({
      text: userPrompt,
    });

    // 6. Interactive Inline Card Response Structure
    const confirmationCard = {
      chat_id: chatId,
      text: `🤖 *Ritmo AI — Detección:*\n\n${parsedIntent.userConfirmationSummary}`,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '✅ Confirmar',
              callback_data: `confirm_${parsedIntent.intent}`,
            },
            {
              text: '✏️ Editar',
              callback_data: `edit_${parsedIntent.intent}`,
            },
            {
              text: '❌ Cancelar',
              callback_data: `cancel_${parsedIntent.intent}`,
            },
          ],
        ],
      },
    };

    return NextResponse.json({
      ok: true,
      intent: parsedIntent,
      confirmationCard,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error interno al procesar webhook';
    console.error('Telegram Webhook error:', error);
    return errorResponse(500, 'Error Interno del Servidor', message, 'telegram-webhook-failure');
  }
}
