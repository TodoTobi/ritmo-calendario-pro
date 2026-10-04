import type { ParsedIntent } from '../ai/intentParser';

export interface TelegramApiResponse<T = unknown> {
  ok: boolean;
  result?: T;
  description?: string;
  error_code?: number;
}

export interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    type: string;
    first_name?: string;
    username?: string;
  };
  date: number;
  text?: string;
  voice?: {
    file_id: string;
    file_unique_id: string;
    duration: number;
    mime_type?: string;
    file_size?: number;
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Sends a text message to a specific Telegram chat.
 */
export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: object
): Promise<TelegramApiResponse<TelegramMessage>> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn('[TelegramBot] TELEGRAM_BOT_TOKEN is not configured. Simulating delivery.');
    return {
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 1000000),
        chat: { id: Number(chatId), type: 'private' },
        date: Math.floor(Date.now() / 1000),
        text,
      },
    };
  }

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  };

  if (replyMarkup) {
    payload.reply_markup = replyMarkup;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data: TelegramApiResponse<TelegramMessage> = await response.json();
    if (!response.ok || !data.ok) {
      console.error('[TelegramBot] sendMessage failed:', data);
    }
    return data;
  } catch (error) {
    console.error('[TelegramBot] Network error in sendMessage:', error);
    return {
      ok: false,
      description: error instanceof Error ? error.message : 'Unknown network error',
    };
  }
}

/**
 * Sends an interactive confirmation card with inline keyboard buttons [✅ Confirmar y Guardar] and [❌ Descartar].
 */
export async function sendConfirmationCard(
  chatId: number | string,
  intent: ParsedIntent
): Promise<TelegramApiResponse<TelegramMessage>> {
  const cardText = `🤖 <b>Ritmo AI — Detección:</b>\n\n${escapeHtml(
    intent.userConfirmationSummary
  )}\n\n<i>¿Deseas confirmar e impactar en tu calendario?</i>`;

  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: '✅ Confirmar y Guardar',
          callback_data: `confirm:${intent.intent}`,
        },
        {
          text: '❌ Descartar',
          callback_data: `discard:${intent.intent}`,
        },
      ],
    ],
  };

  return sendTelegramMessage(chatId, cardText, replyMarkup);
}

/**
 * Answers a Telegram callback query to stop the loading spinner on the user's client.
 */
export async function answerCallbackQuery(
  callbackQueryId: string,
  text?: string
): Promise<TelegramApiResponse<boolean>> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: true, result: true };
  }

  const payload: Record<string, unknown> = {
    callback_query_id: callbackQueryId,
  };
  if (text) {
    payload.text = text;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return await response.json();
  } catch (error) {
    console.error('[TelegramBot] Network error in answerCallbackQuery:', error);
    return {
      ok: false,
      description: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Downloads a binary file (such as a voice message or photo) from the Telegram Bot API.
 */
export async function downloadTelegramFile(fileId: string): Promise<Buffer> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN is not configured');
  }

  // 1. Query Telegram getFile API to resolve relative file_path
  const getFileRes = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`
  );
  const getFileData: TelegramApiResponse<{ file_path: string }> = await getFileRes.json();

  if (!getFileRes.ok || !getFileData.ok || !getFileData.result?.file_path) {
    throw new Error(
      `Failed to retrieve file metadata from Telegram for fileId "${fileId}": ${
        getFileData.description || 'Unknown error'
      }`
    );
  }

  const filePath = getFileData.result.file_path;

  // 2. Fetch binary stream from download endpoint
  const downloadUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const fileRes = await fetch(downloadUrl);

  if (!fileRes.ok) {
    throw new Error(`Failed to download binary file from Telegram: ${fileRes.status} ${fileRes.statusText}`);
  }

  const arrayBuffer = await fileRes.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
