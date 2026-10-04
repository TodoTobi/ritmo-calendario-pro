# PROTOCOLO_IMPLEMENTACION_NUEVAS_FEATURES.md — Ciclo de Vida y Protocolo de Ingeniería

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Estándar:** VetConnect AI-First Engineering Lifecycle  
> **Ámbito de Aplicación:** Todos los cambios funcionales, integraciones de IA y componentes de interfaz.

---

## 1. Visión General del Ciclo de Vida

Toda nueva funcionalidad que se agregue a Ritmo debe atravesar rigurosamente las **cinco fases del ciclo de vida de ingeniería**, independientemente de si es implementada por un desarrollador humano o por un agente de Inteligencia Artificial (Claude, GPT, Gemini).

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  FASE 1: DoR     │ ──> │  FASE 2: SPEC    │ ──> │  FASE 3: ZOD &   │
│  Relevamiento &  │     │  Arquitectura &  │     │  Type-Driven     │
│  Validación Tier │     │  Impacto Cuota   │     │  Design          │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                                           │
                                                           ▼
┌──────────────────┐                              ┌──────────────────┐
│  FASE 5: DoD     │ <─────────────────────────── │  FASE 4: BUILD   │
│  Verificación QA │                              │  Implementación  │
│  & Commits       │                              │  UI & Backend    │
└──────────────────┘                              └──────────────────┘
```

---

## 2. Las 5 Fases de Implementación

### Fase 1: Relevamiento y Validación de Definición de Preparación (DoR)
Antes de modificar archivos o escribir código:
1. **Clasificación de Tier:** Identificar a qué categoría pertenece la feature:
   - ¿Afecta a eventos de **Tier 1** (Inamovibles: Dios, Iglesia, UTN, Inglés)? Si la respuesta es afirmativa, está **terminantemente prohibido** incorporar mecanismos que permitan su reprogramación automática desatendida.
   - ¿Afecta a **Tier 2** (Movibles: Pasantías, Horarios Escolares) o **Tier 3** (Carga: Dibujo, Hábitos, Estudio)?
2. **Auditoría de Cuotas ($0.00 USD Budget Check):**
   - Si la feature invoca al LLM, verificar que respete el techo de **15 RPM de Gemini 2.0 Flash**.
   - Si la feature consulta Google Classroom o Drive, verificar que use `delta sync` o polling con TTL en lugar de polling en bucle.
   - Si la feature escribe en Supabase, verificar que el tamaño del payload no degrade el espacio libre de 500 MB.

### Fase 2: Especificación y Revisión de Esquema (Schema Review)
1. **Impacto en Base de Datos:**
   - ¿Requiere nuevas columnas o tablas en Supabase PostgreSQL? Si es así, formular el script de migración SQL DDL con índices correspondientes y restricciones de clave foránea.
   - Ninguna tabla debe crearse sin habilitar **Row Level Security (RLS)** y las políticas de acceso con el `RITMO_MASTER_TOKEN`.
2. **Definición de Errores RFC 7807:**
   - Prever qué fallos de negocio o red pueden ocurrir y asignarles códigos de error (ej. `ERR_TIER1_BLOCKED`, `ERR_GEMINI_QUOTA_EXCEEDED`, `ERR_CLASSROOM_UNAUTHORIZED`).

### Fase 3: Diseño Dirigido por Tipos (Type-Driven Design con Zod)
En Ritmo, **la fuente de la verdad (SSOT) de las estructuras de datos es Zod y TypeScript**:
1. Escribir el esquema Zod en `@/lib/validations/` antes de crear la ruta de API.
2. Inferir los tipos estáticos de TypeScript:
   ```typescript
   export const EventCreateSchema = z.object({
     title: z.string().min(2).max(120),
     date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
     time: z.string().regex(/^\d{2}:\d{2}$/),
     durationMinutes: z.number().int().positive().default(60),
     tier: z.enum(['tier_1', 'tier_2', 'tier_3']),
     type: z.enum(['red', 'orange', 'blue', 'green', 'yellow', 'purple']),
     notes: z.string().optional()
   });
   
   export type EventCreateInput = z.infer<typeof EventCreateSchema>;
   ```
3. Cualquier payload recibido por webhook de Telegram o frontend debe validarse con `.safeParse()`. Si falla, rechazar inmediatamente con un Problem Details 400.

### Fase 4: Construcción, Optimistic UI y Patrón Telegram
1. **Frontend / Drag-and-Drop Invariants:**
   - Toda interacción de reordenamiento en la **Línea de Tiempo Táctil** debe aplicar **Optimistic Updates**: el bloque se mueve visualmente al instante; en segundo plano se envía el `PATCH` a Supabase.
   - En caso de error de red o rechazo de servidor (ej. colisión con Tier 1), la UI debe ejecutar un **Rollback suave** a la posición original y mostrar un Toast de advertencia con vibración (`navigator.vibrate([40, 60, 40])`).
2. **Interacciones en Telegram (Human-in-the-Loop):**
   - El bot de Telegram nunca guarda un evento extraído por IA directamente en la base de datos sin antes presentar una **Tarjeta de Confirmación** (`InlineKeyboardMarkup`).
   - El usuario debe pulsar `[✓ Confirmar]` o `[✎ Modificar]` para persistir el dato.

### Fase 5: Verificación de Definición de Hecho (DoD) y Cierre
La feature se considera terminada únicamente tras cumplir la lista de verificación:
- [ ] Compilación estricta de TypeScript: `npx tsc --noEmit` sin errores.
- [ ] No hay llamadas directas a variables de entorno sin validación previa.
- [ ] La UI móvil se probó mentalmente o en emulador en anchos de 375px y 412px.
- [ ] Se incluyeron los estados de carga (`Skeleton loader`), estado vacío (`Empty state`) y error RFC 7807.
- [ ] Se redactó el commit bajo el estándar Conventional Commits.

---

## 3. Protocolo para Integraciones con IA (Gemini 2.0 Flash)

Para evitar saturar la cuota gratuita (15 RPM):

1. **Structured Outputs Obligatorio:**  
   Siempre usar el parámetro `responseMimeType: "application/json"` junto con `responseSchema` en el SDK de Gemini. Prohibido pedirle al modelo que responda en texto libre si se espera extraer una entidad.
2. **Semáforo de Concurrencia:**  
   Implementar una cola en memoria con un retraso mínimo de 4 segundos entre solicitudes sucesivas si el usuario dispara múltiples notas de voz seguidas.
3. **Caché de Clasificaciones Frecuentes:**  
   Consultas recurrentes como *"¿Qué tengo hoy?"* o *"Ver láminas pendientes"* deben resolverse directamente por lógica local de SQL sin pasar por el LLM. Solo los textos libres o audios complejos van a Gemini.

---

## 4. Estrategia de Ramas y Convención de Commits

### Estructura de Ramas:
- `main`: Código en producción, estable y desplegado en Vercel.
- `feat/<nombre-feature>`: Desarrollo de nuevas capacidades (ej. `feat/drag-and-drop-timeline`, `feat/telegram-ocr-utn`).
- `fix/<nombre-bug>`: Correcciones urgentes de estabilidad.

### Plantilla de Commit:
```
feat(telegram): add confirmation card for audio task parsing

- Integrate Gemini 2.0 Flash structured audio extraction.
- Validate incoming payload against EventCreateSchema.
- Dispatch interactive inline keyboard before committing to Supabase.

Refs: ADR-006, ADR-007
```
