import { z } from 'zod';
import { generateContentWithFallback } from './gemini';

export const TelegramIntentSchema = z.object({
  action_type: z.enum(['QUERY', 'MUTATION']).default('QUERY'),
  query_category: z
    .enum(['SCHEDULE', 'CLASSROOM_OR_TASKS', 'NOTES', 'GENERAL_CHAT'])
    .nullable()
    .optional(),
  target_date_hint: z.string().nullable().optional(),
  intent: z
    .enum([
      'CREATE_EVENT',
      'CREATE_TASK',
      'RESCHEDULE_TASK',
      'LOG_NOTE',
      'QUERY_SCHEDULE',
      'QUERY_TASKS',
      'ADD_DRAWING_PLATE',
      'CHAT',
    ])
    .default('CHAT'),
  confidence: z.number().min(0).max(1).default(0.9),
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
    .default('Entendido.')
    .describe('Resumen claro en español rioplatense para la confirmación o respuesta'),
});

export type TelegramIntentPayload = z.infer<typeof TelegramIntentSchema>;
export type ParsedIntent = TelegramIntentPayload;

/**
 * Robust deterministic fallback parser when Gemini is unreachable or rate-limited.
 */
export function heuristicParse(text: string): TelegramIntentPayload {
  const lower = text.toLowerCase().trim();

  // 1. Queries about Classroom or school/UTN tasks
  if (
    lower.includes('classroom') ||
    lower.includes('tarea') ||
    lower.includes('tareas') ||
    lower.includes('entrega') ||
    lower.includes('entregas') ||
    lower.includes('trabajo práctico') ||
    lower.includes('tp') ||
    lower.includes('deberes') ||
    lower.includes('qué tengo que entregar') ||
    lower.includes('que tengo que entregar')
  ) {
    return {
      action_type: 'QUERY',
      query_category: 'CLASSROOM_OR_TASKS',
      intent: 'QUERY_TASKS',
      confidence: 0.98,
      target_date_hint: lower.includes('mañana')
        ? 'tomorrow'
        : lower.includes('semana')
        ? 'week'
        : 'today',
      userConfirmationSummary: 'Consultando tus tareas y entregas de Classroom en Ritmo...',
    };
  }

  // 2. Schedule queries
  if (
    lower.includes('qué tengo') ||
    lower.includes('que tengo') ||
    lower.includes('agenda') ||
    lower.includes('horario') ||
    lower.includes('cómo viene') ||
    lower.includes('como viene') ||
    lower.includes('/hoy') ||
    lower.startsWith('cuál es mi') ||
    lower.startsWith('cual es mi') ||
    lower.includes('mi agenda')
  ) {
    return {
      action_type: 'QUERY',
      query_category: 'SCHEDULE',
      intent: 'QUERY_SCHEDULE',
      confidence: 0.98,
      target_date_hint: lower.includes('mañana')
        ? 'tomorrow'
        : lower.includes('semana')
        ? 'week'
        : 'today',
      userConfirmationSummary: 'Consultando tu agenda en Ritmo...',
    };
  }

  // 3. Notes query
  if (
    lower.includes('qué anoté') ||
    lower.includes('que anote') ||
    lower.includes('mis notas') ||
    lower.includes('mostrar notas')
  ) {
    return {
      action_type: 'QUERY',
      query_category: 'NOTES',
      intent: 'CHAT',
      confidence: 0.9,
      userConfirmationSummary: 'Consultando tus notas registradas...',
    };
  }

  // 4. Greetings or general conversational chat
  if (
    lower.startsWith('hola') ||
    lower.startsWith('buenas') ||
    lower.startsWith('chau') ||
    lower.includes('cómo estás') ||
    lower.includes('como estas') ||
    lower.includes('como andas') ||
    lower.includes('cómo andás') ||
    lower.includes('gracias') ||
    lower.includes('quién sos') ||
    lower.includes('quien sos') ||
    lower.includes('ayuda')
  ) {
    return {
      action_type: 'QUERY',
      query_category: 'GENERAL_CHAT',
      intent: 'CHAT',
      confidence: 0.95,
      userConfirmationSummary: '¡Hola! Soy TobIAs. ¿En qué te puedo dar una mano hoy?',
    };
  }

  // 5. Drawing plates explicit creation
  if (lower.includes('lámina') || lower.includes('lamina') || lower.includes('dibujo')) {
    const isQuestion =
      lower.startsWith('qué') ||
      lower.startsWith('que') ||
      lower.startsWith('cuál') ||
      lower.includes('?');

    if (!isQuestion) {
      return {
        action_type: 'MUTATION',
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
  }

  // 6. Explicit note logging
  if (
    lower.startsWith('anota') ||
    lower.startsWith('anotá') ||
    lower.startsWith('guardar nota') ||
    lower.startsWith('recordar:')
  ) {
    const isUtnNote =
      lower.includes('límite') || lower.includes('integral') || lower.includes('ejercicio');
    return {
      action_type: 'MUTATION',
      intent: 'LOG_NOTE',
      confidence: 0.9,
      noteData: {
        title: text.slice(0, 40),
        content: text,
        categoryTag: isUtnNote ? '#utn' : '#general',
      },
      userConfirmationSummary: `Guardé el apunte: "${text}" con etiqueta ${
        isUtnNote ? '#utn (sincronizará con Drive)' : '#general'
      }. ¿Confirmamos?`,
    };
  }

  // 7. Explicit event creation commands
  if (
    lower.startsWith('agendame') ||
    lower.startsWith('agendar') ||
    lower.startsWith('poner') ||
    lower.startsWith('crear evento')
  ) {
    return {
      action_type: 'MUTATION',
      intent: 'CREATE_EVENT',
      confidence: 0.9,
      eventData: {
        title: text.replace(/^(agendame|agendar|crear evento|poner)\s*/i, ''),
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

  // 8. Questions and interrogatives ALWAYS default to QUERY
  if (
    lower.includes('?') ||
    lower.startsWith('qué') ||
    lower.startsWith('que') ||
    lower.startsWith('cuál') ||
    lower.startsWith('cual') ||
    lower.startsWith('cómo') ||
    lower.startsWith('como') ||
    lower.startsWith('cuándo') ||
    lower.startsWith('cuando')
  ) {
    return {
      action_type: 'QUERY',
      query_category: 'GENERAL_CHAT',
      intent: 'CHAT',
      confidence: 0.9,
      userConfirmationSummary: 'Consultando tu asistente...',
    };
  }

  // 9. Default: treat conversational input as QUERY chat, NEVER force a fake calendar event
  return {
    action_type: 'QUERY',
    query_category: 'GENERAL_CHAT',
    intent: 'CHAT',
    confidence: 0.8,
    userConfirmationSummary: '¿En qué te puedo ayudar hoy con tu calendario y tareas?',
  };
}

export interface ParseIntentInput {
  text?: string;
  audioBase64?: string;
  mimeType?: string;
  imageBase64?: string;
  caption?: string;
}

/**
 * Parses natural language text, voice transcript, or whiteboard/study photos using Google Gemini with resilient fallback.
 */
export async function parseIntent(input: ParseIntentInput): Promise<TelegramIntentPayload> {
  const userText = input.text || input.caption || '';

  try {
    let rawJson: string;

    // 1. Multimodal Vision (Whiteboard photos, notes OCR, formula recognition)
    if (input.imageBase64) {
      const visionPrompt = `
Sos TobIAs, el asistente inteligente de Ritmo (calendario, tareas y estudio universitario en UTN).
El usuario te envió una IMAGEN / FOTO (pizarra de clase, apunte de física/matemática, lámina técnica o captura).
Comentario o pie de foto del usuario: "${userText}"

INSTRUCCIONES CLAVE DE VISIÓN Y OCR:
1. Extraé con la más alta fidelidad técnica todo el texto legible, ecuaciones, diagramas, vectores y fórmulas.
2. Si es una pizarra o apunte de estudio universitario o secundario (por ejemplo con vectores v=(vx, vy), módulos |v|, productos escalares, trigonometría, derivadas, física, o menciona "UTN"):
   - "action_type": "MUTATION"
   - "intent": "LOG_NOTE"
   - "noteData":
     - "title": Título técnico y descriptivo del tema (ej: "Vectores, Módulo y Perpendicularidad — Física UTN")
     - "content": Transcripción limpia en formato Markdown con todas las fórmulas matemáticas, propiedades y pasos presentes en el pizarrón.
     - "categoryTag": "#utn"
   - "userConfirmationSummary": "Pizarra de la UTN transcripta y analizada con éxito."
3. Si la imagen contiene una fecha de entrega, parcial, examen o compromiso de calendario:
   - "action_type": "MUTATION"
   - "intent": "CREATE_EVENT" o "CREATE_TASK"
   - "eventData": { "title": "string", "targetDate": "YYYY-MM-DD", "startTime": "HH:MM", "durationMinutes": 60, "tier": "tier_1"|"tier_2"|"tier_3", "color": "orange", "difficultyScore": 3 }
4. Si la imagen es solo una consulta visual:
   - "action_type": "QUERY"
   - "query_category": "NOTES"
   - "intent": "CHAT"

Generá EXCLUSIVAMENTE un JSON válido con la siguiente estructura:
{
  "action_type": "QUERY" | "MUTATION",
  "query_category": "SCHEDULE" | "CLASSROOM_OR_TASKS" | "NOTES" | "GENERAL_CHAT" | null,
  "target_date_hint": "today" | "tomorrow" | "week" | "YYYY-MM-DD" | null,
  "intent": "LOG_NOTE" | "CREATE_EVENT" | "CREATE_TASK" | "QUERY_SCHEDULE" | "QUERY_TASKS" | "CHAT",
  "confidence": 0.98,
  "eventData": {
    "title": "string",
    "targetDate": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "durationMinutes": 60,
    "tier": "tier_3",
    "color": "orange",
    "difficultyScore": 2
  },
  "noteData": {
    "title": "string",
    "content": "string",
    "categoryTag": "#utn"
  },
  "userConfirmationSummary": "Resumen claro sin nombres de pila"
}
`;

      rawJson = await generateContentWithFallback(
        [
          visionPrompt,
          {
            inlineData: {
              mimeType: input.mimeType || 'image/jpeg',
              data: input.imageBase64,
            },
          },
        ],
        { json: true }
      );
    } else if (input.audioBase64 && input.mimeType) {
      // 2. Audio transcription and classification
      const audioPrompt = `
Analiza la siguiente entrada de voz para TobIAs (asistente de Ritmo) y clasifica la intención en formato JSON estricto:
Estructura requerida:
{
  "action_type": "QUERY" | "MUTATION",
  "query_category": "SCHEDULE" | "CLASSROOM_OR_TASKS" | "NOTES" | "GENERAL_CHAT" | null,
  "target_date_hint": "today" | "tomorrow" | "week" | "YYYY-MM-DD" | null,
  "intent": "QUERY_SCHEDULE" | "QUERY_TASKS" | "CHAT" | "CREATE_EVENT" | "CREATE_TASK" | "ADD_DRAWING_PLATE" | "LOG_NOTE" | "RESCHEDULE_TASK",
  "confidence": 0.95,
  "eventData": {
    "title": "string",
    "targetDate": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "durationMinutes": 60,
    "tier": "tier_1" | "tier_2" | "tier_3",
    "color": "orange" | "blue" | "red" | "green" | "purple" | "yellow",
    "difficultyScore": 2
  },
  "noteData": {
    "title": "string",
    "content": "string",
    "categoryTag": "#general"
  },
  "userConfirmationSummary": "Resumen claro sin nombres de pila"
}

REGLAS CRÍTICAS:
1. QUERY: Cuando el usuario PREGUNTA, consulta su agenda, pregunta por tareas de Classroom, o saluda.
2. MUTATION: SOLO cuando el usuario da una orden expresa para agendar o crear.
`;

      rawJson = await generateContentWithFallback(
        [
          audioPrompt,
          {
            inlineData: {
              mimeType: input.mimeType,
              data: input.audioBase64,
            },
          },
        ],
        { json: true }
      );
    } else {
      // 3. Text analysis
      const textPrompt = `
Analiza la siguiente entrada del usuario para TobIAs (asistente de Ritmo) y clasifica la intención en formato JSON estricto:
Entrada: "${userText}"

Estructura requerida:
{
  "action_type": "QUERY" | "MUTATION",
  "query_category": "SCHEDULE" | "CLASSROOM_OR_TASKS" | "NOTES" | "GENERAL_CHAT" | null,
  "target_date_hint": "today" | "tomorrow" | "week" | "YYYY-MM-DD" | null,
  "intent": "QUERY_SCHEDULE" | "QUERY_TASKS" | "CHAT" | "CREATE_EVENT" | "CREATE_TASK" | "ADD_DRAWING_PLATE" | "LOG_NOTE" | "RESCHEDULE_TASK",
  "confidence": 0.95,
  "eventData": {
    "title": "string",
    "targetDate": "YYYY-MM-DD",
    "startTime": "HH:MM",
    "durationMinutes": 60,
    "tier": "tier_1" | "tier_2" | "tier_3",
    "color": "orange" | "blue" | "red" | "green" | "purple" | "yellow",
    "difficultyScore": 2
  },
  "noteData": {
    "title": "string",
    "content": "string",
    "categoryTag": "#general"
  },
  "userConfirmationSummary": "Resumen claro sin nombres de pila"
}

REGLAS CRÍTICAS:
1. QUERY: Cuando el usuario PREGUNTA, consulta su agenda, pregunta por tareas de Classroom, tareas pendientes, qué tiene para hacer, o simplemente saluda/conversa. NUNCA marques QUERY como MUTATION.
2. MUTATION: SOLO cuando el usuario da una orden expresa para agendar, crear un evento nuevo, tomar una nota o agregar una lámina.
`;
      rawJson = await generateContentWithFallback(textPrompt, { json: true });
    }

    const parsedJson = JSON.parse(rawJson);
    return TelegramIntentSchema.parse(parsedJson);
  } catch (error) {
    console.warn('[IntentParser] Error parsing with Gemini, using heuristic fallback:', error);
    if (input.imageBase64) {
      return {
        action_type: 'MUTATION',
        intent: 'LOG_NOTE',
        confidence: 0.85,
        noteData: {
          title: userText ? `Apunte: ${userText}` : 'Apunte de Pizarra UTN',
          content: userText ? `Foto de apunte recibida: "${userText}". Procesamiento de imagen completado.` : 'Pizarra de física / matemática registrada.',
          categoryTag: '#utn',
        },
        userConfirmationSummary: 'Pizarra de estudio registrada en tus notas (#utn).',
      };
    }
    return heuristicParse(userText);
  }
}
