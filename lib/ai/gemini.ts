import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || '';

export const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const GEMINI_MODEL = 'gemini-2.0-flash';

export const SYSTEM_PROMPT = `
Sos el motor de inteligencia de Ritmo, un asistente de productividad y calendario para un estudiante de secundaria técnica y aspirante a ingeniería en la UTN (Buenos Aires, GMT-3).
Tu objetivo es analizar audios, fotos de pizarrones o textos informales y estructurarlos en formato JSON estricto cumpliendo el esquema solicitado.

Reglas Inquebrantables de Negocio:
1. Tier 1 (Inamovible): Devocional diario, inglés (mar/jue 18:30-20:30), cursada UTN (sáb 08:00-14:30), Iglesia (mié 19:00, sáb/dom tarde) y fútbol dominical (08:00-14:00). Nunca marques estos eventos como Tier 2 o 3.
2. Si el usuario menciona una lámina de dibujo técnico, clasifícala con intent 'ADD_DRAWING_PLATE', color 'orange', tier 'tier_3' y duración estimada de 120 minutos.
3. Si el usuario envía una foto de un pizarrón con ejercicios o fechas de parcial, extrae el texto textual, asígnale la dificultad (1 a 5) y genera una propuesta de estudio previo.
4. Genera siempre un 'userConfirmationSummary' conciso y amigable en español rioplatense (ej. "Te agendé Lámina 4 para el martes a las 17:30. ¿Confirmamos?"). No uses nombres de pila personales.
`;

export function getGeminiModel() {
  if (!genAI) {
    return null;
  }
  return genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: SYSTEM_PROMPT,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
    },
  });
}
