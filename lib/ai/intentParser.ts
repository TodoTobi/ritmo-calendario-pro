import { z } from 'zod';
import { getGeminiModel } from './gemini';

export const TelegramIntentSchema = z.object({
  intent: z.enum([
    'CREATE_EVENT',
    'RESCHEDULE_TASK',
    'LOG_NOTE',
    'QUERY_SCHEDULE',
    'ADD_DRAWING_PLATE',
  ]),
  confidence: z.number().min(0).max(1),
  eventData: z
    .object({
      title: z.string(),
      targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      durationMinutes: z.number().int().positive().default(60),
      tier: z.enum(['tier_1', 'tier_2', 'tier_3']).default('tier_3'),
      color: z.enum(['red', 'orange', 'blue', 'green', 'yellow', 'purple']).default('orange'),
      difficultyScore: z.number().int().min(1).max(5).default(2),
    })
    .optional(),
  noteData: z
    .object({
      title: z.string(),
      content: z.string(),
      categoryTag: z.string().regex(/^#[a-zA-Z0-9_-]+$/).default('#general'),
    })
    .optional(),
  userConfirmationSummary: z
    .string()
    .describe('Resumen claro en español neutro o rioplatense para la confirmación'),
});

export type TelegramIntentPayload = z.infer<typeof TelegramIntentSchema>;

/**
 * Fallback deterministic parser when Gemini API key is not provided in local dev
 */
function heuristicParse(text: string): TelegramIntentPayload {
  const lower = text.toLowerCase();

  // 1. Drawing plates rule
  if (lower.includes('lámina') || lower.includes('lamina') || lower.includes('dibujo')) {
    return {
      intent: 'ADD_DRAWING_PLATE',
      confidence: 0.95,
      eventData: {
        title: text.length > 50 ? 'Lámina de Dibujo Técnico' : text,
        targetDate: '2026-10-04',
        startTime: '17:00',
        durationMinutes: 120,
        tier: 'tier_3',
        color: 'orange',
        difficultyScore: 4,
      },
      userConfirmationSummary: `Detecté una lámina de dibujo técnico ("${text}"). Duración estimada: 120 min en color naranja (Tier 3). ¿Confirmamos?`,
    };
  }

  // 2. Sacred Tier 1 keywords
  if (
    lower.includes('utn') ||
    lower.includes('parcial') ||
    lower.includes('iglesia') ||
    lower.includes('devocional') ||
    lower.includes('inglés') ||
    lower.includes('ingles')
  ) {
    const isUtn = lower.includes('utn') || lower.includes('parcial');
    return {
      intent: 'CREATE_EVENT',
      confidence: 0.95,
      eventData: {
        title: text,
        targetDate: '2026-10-04',
        startTime: '18:00',
        durationMinutes: 90,
        tier: 'tier_1',
        color: isUtn ? 'red' : 'green',
        difficultyScore: 5,
      },
      userConfirmationSummary: `Agendado bloque inamovible Tier 1: "${text}". Quedará protegido contra colisiones. ¿Confirmamos?`,
    };
  }

  // 3. Notes logging
  if (lower.startsWith('anota') || lower.startsWith('nota') || lower.startsWith('recordar')) {
    const isUtnNote = lower.includes('límite') || lower.includes('integral') || lower.includes('ejercicio');
    return {
      intent: 'LOG_NOTE',
      confidence: 0.9,
      noteData: {
        title: text.slice(0, 40),
        content: text,
        categoryTag: isUtnNote ? '#utn' : '#general',
      },
      userConfirmationSummary: `Guardé el apunte: "${text}" con etiqueta ${isUtnNote ? '#utn (sincronizará con Drive)' : '#general'}.`,
    };
  }

  // 4. Schedule query
  if (lower.includes('qué tengo') || lower.includes('que tengo') || lower.includes('agenda') || lower.includes('/hoy')) {
    return {
      intent: 'QUERY_SCHEDULE',
      confidence: 0.98,
      userConfirmationSummary: 'Consultando tu agenda del día en Ritmo...',
    };
  }

  // Default event creation
  return {
    intent: 'CREATE_EVENT',
    confidence: 0.85,
    eventData: {
      title: text,
      targetDate: '2026-10-04',
      startTime: '16:00',
      durationMinutes: 60,
      tier: 'tier_2',
      color: 'blue',
      difficultyScore: 2,
    },
    userConfirmationSummary: `Crear compromiso: "${text}" a las 16:00. ¿Confirmamos?`,
  };
}

/**
 * Parses natural language text or voice transcript using Google Gemini 2.0 Flash
 */
export async function parseIntent(input: {
  text?: string;
  audioBase64?: string;
  mimeType?: string;
}): Promise<TelegramIntentPayload> {
  const model = getGeminiModel();

  if (!model) {
    return heuristicParse(input.text || 'Sin texto proporcionado');
  }

  try {
    const prompt = `Analiza la siguiente entrada del usuario y clasifica la intención según las reglas de negocio:\n"${input.text || ''}"`;

    let result;
    if (input.audioBase64 && input.mimeType) {
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: input.mimeType,
            data: input.audioBase64,
          },
        },
      ]);
    } else {
      result = await model.generateContent(prompt);
    }

    const responseText = result.response.text();
    const parsedJson = JSON.parse(responseText);
    return TelegramIntentSchema.parse(parsedJson);
  } catch (error) {
    console.error('Gemini parse error, falling back to heuristic parser:', error);
    return heuristicParse(input.text || '');
  }
}
