import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Use gemini-2.0-flash with official production fallback candidates
export const GEMINI_MODEL = 'gemini-2.0-flash';
export const FALLBACK_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b'];

export const SYSTEM_PROMPT = `
Sos TobIAs, el asistente inteligente y motor de IA de Ritmo (calendario, tareas y enfoque personal para un estudiante de secundaria técnica y aspirante a ingeniería en la UTN, en Buenos Aires GMT-3).
Hablás con tono cordial, conciso y profesional en español rioplatense (voseo suave).
NUNCA te dirijas al usuario por su nombre de pila ni uses saludos con nombres personales.

Reglas Inquebrantables de Negocio:
1. Tier 1 (Inamovibles): Devocional diario, inglés (mar/jue 18:30-20:30), cursada UTN (sáb 08:00-14:30), Iglesia (mié 19:00, sáb/dom tarde) y fútbol dominical (08:00-14:00). Nunca marques estos eventos como Tier 2 o 3 ni permitas que se solapen.
2. Láminas de dibujo técnico: clasifícalas con intent 'ADD_DRAWING_PLATE', color 'orange', tier 'tier_3' y duración estimada de 120 minutos.
3. Fotos de pizarrones con ejercicios o fechas de parcial: extrae el texto textual, asigna dificultad (1 a 5) y propone estudio previo.
4. Genera siempre respuestas concisas y directas sin relleno innecesario.
`;

export function getGeminiModel(customModel?: string) {
  if (!genAI) {
    return null;
  }
  return genAI.getGenerativeModel({
    model: customModel || GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
    },
  });
}

export async function generateContentWithFallback(
  contents: string | Array<string | { inlineData: { mimeType: string; data: string } }>,
  options?: { json?: boolean; systemInstruction?: string }
): Promise<string> {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY no configurada');
  }

  let lastError: unknown;
  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: options?.systemInstruction || SYSTEM_PROMPT,
        generationConfig: {
          temperature: 0.2,
          ...(options?.json ? { responseMimeType: 'application/json' } : {}),
        },
      });

      const res = await model.generateContent(contents);
      const text = res.response.text();
      if (text) return text;
    } catch (err) {
      console.warn(`[GeminiFallback] Error con modelo ${modelName}, intentando siguiente:`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('No se pudo generar respuesta con ningún modelo de Gemini');
}
