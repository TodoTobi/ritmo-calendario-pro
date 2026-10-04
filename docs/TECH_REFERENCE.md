# TECH_REFERENCE.md — Referencia Técnica de APIs, Contratos Zod & Prompts

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Versión:** 1.0.0-PROD  
> **Estándar:** OpenAPI 3.1 & TypeScript Zod Schemas

---

## 1. Contratos de Datos Zod (SSOT de Esquemas)

### 1.1. Esquema de Creación de Eventos (`EventCreateSchema`)
```typescript
import { z } from 'zod';

export const EventCreateSchema = z.object({
  title: z.string().min(2, "El título debe tener al menos 2 caracteres").max(120),
  description: z.string().max(500).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  tier: z.enum(['tier_1', 'tier_2', 'tier_3']).default('tier_3'),
  color: z.enum(['red', 'orange', 'blue', 'green', 'yellow', 'purple']).default('orange'),
  difficultyScore: z.number().int().min(1).max(5).optional(),
  createdFrom: z.enum(['web', 'telegram_voice', 'telegram_ocr', 'classroom_sync', 'template']).default('web')
}).refine((data) => data.endTime > data.startTime, {
  message: "La hora de fin debe ser posterior a la de inicio",
  path: ["endTime"]
});

export type EventCreateInput = z.infer<typeof EventCreateSchema>;
```

### 1.2. Esquema de Clasificación de Intenciones de IA (`TelegramIntentSchema`)
```typescript
export const TelegramIntentSchema = z.object({
  intent: z.enum([
    'CREATE_EVENT',
    'RESCHEDULE_TASK',
    'LOG_NOTE',
    'QUERY_SCHEDULE',
    'ADD_DRAWING_PLATE'
  ]),
  confidence: z.number().min(0).max(1),
  eventData: z.object({
    title: z.string(),
    targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    durationMinutes: z.number().int().positive().default(60),
    tier: z.enum(['tier_1', 'tier_2', 'tier_3']).default('tier_3'),
    color: z.enum(['red', 'orange', 'blue', 'green', 'yellow', 'purple']).default('orange'),
    difficultyScore: z.number().int().min(1).max(5).default(2)
  }).optional(),
  noteData: z.object({
    title: z.string(),
    content: z.string(),
    categoryTag: z.string().regex(/^#[a-zA-Z0-9_-]+$/).default('#general')
  }).optional(),
  userConfirmationSummary: z.string().describe("Resumen claro en español neutro para la tarjeta de confirmación")
});

export type TelegramIntentPayload = z.infer<typeof TelegramIntentSchema>;
```

---

## 2. Documentación Detallada de Endpoints REST

### 2.1. POST `/api/telegram/webhook`
Procesa actualizaciones emitidas por los servidores de Telegram.
- **Headers Requeridos:**
  - `X-Telegram-Bot-Api-Secret-Token`: Debe coincidir con `TELEGRAM_WEBHOOK_SECRET`.
  - `Content-Type: application/json`
- **Respuestas:**
  - `200 OK`: Notificación procesada exitosamente o ignorada por idempotencia.
  - `403 Forbidden`: Secreto de webhook inválido.
  - `500 Internal Server Error`: Retorna error bajo estándar RFC 7807.

### 2.2. PATCH `/api/events/reorder`
Reordena un bloque horario desde la Línea de Tiempo Táctil.
- **Headers Requeridos:**
  - `x-ritmo-token`: Master token de autenticación.
- **Cuerpo de Solicitud (JSON):**
  ```json
  {
    "eventId": "b2c019a8-e1f4-41b2-9d33-1498c89b7fae",
    "newEventDate": "2026-10-04",
    "newStartTime": "17:30",
    "newEndTime": "19:30"
  }
  ```
- **Respuestas:**
  - `200 OK`: Bloque actualizado exitosamente.
  - `409 Conflict`: El bloque colisiona con una franja inamovible de Tier 1. Retorna RFC 7807.

---

## 3. Funciones RPC en PostgreSQL (Supabase)

```sql
-- Función transaccional para aplicar un escenario de reprogramación de forma atómica
CREATE OR REPLACE FUNCTION apply_reschedule_scenario(
    p_proposal_id UUID,
    p_scenario_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_proposal RECORD;
    v_events_to_update JSONB;
    v_item JSONB;
BEGIN
    -- 1. Obtener la propuesta
    SELECT * INTO v_proposal 
    FROM reschedule_proposals 
    WHERE id = p_proposal_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Propuesta no encontrada o ya resuelta' USING ERRCODE = 'P0002';
    END IF;

    -- 2. Extraer los eventos del escenario elegido ('A', 'B' o 'C')
    v_events_to_update := v_proposal.scenarios_json->p_scenario_key->'updates';

    -- 3. Iterar y actualizar cada bloque
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_events_to_update)
    LOOP
        UPDATE events
        SET event_date = (v_item->>'newDate')::DATE,
            start_time = (v_item->>'newStartTime')::TIME,
            end_time = (v_item->>'newEndTime')::TIME,
            updated_at = now()
        WHERE id = (v_item->>'eventId')::UUID;
    END LOOP;

    -- 4. Marcar propuesta como aplicada
    UPDATE reschedule_proposals
    SET status = 'applied',
        selected_scenario = p_scenario_key,
        resolved_at = now()
    WHERE id = p_proposal_id;

    RETURN jsonb_build_object('success', true, 'applied_scenario', p_scenario_key);
END;
$$;
```

---

## 4. Ingeniería de Prompts para Gemini 2.0 Flash

### Prompt de Sistema (System Instructions) para Extracción Multimodal:
```text
Sos el motor de inteligencia de Ritmo, el asistente de productividad de Lucas, un estudiante de secundaria técnica y aspirante a ingeniería en la UTN (Buenos Aires, GMT-3).
Tu objetivo es analizar audios, fotos de pizarrones o textos informales y estructurarlos en formato JSON estricto cumpliendo el siguiente esquema.

Reglas Inquebrantables de Negocio:
1. Tier 1 (Inamovible): Devocional diario, inglés (mar/jue 18:30-20:30), cursada UTN (sáb 08:00-14:30), Iglesia (mié 19:00, sáb/dom tarde) y fútbol dominical (08:00-14:00). Nunca marques estos eventos como Tier 2 o 3.
2. Si el usuario menciona una lámina de dibujo técnico, clasifícala con intent 'ADD_DRAWING_PLATE', color 'orange', tier 'tier_3' y duración estimada de 120 minutos.
3. Si el usuario envía una foto de un pizarrón con ejercicios o fechas de parcial, extrae el texto textual, asígnale la dificultad (1 a 5) y genera una propuesta de estudio previo.
4. Genera siempre un 'userConfirmationSummary' conciso y amigable en español rioplatense (ej. "Te agendé Lámina 4 para el martes a las 17:30. ¿Confirmamos?").
```
