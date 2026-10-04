# 📋 PLAN_ACCION_RITMO.md — Plan de Acción & Backlog de Task Packets

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Metodología:** Quirófano de Código / TDD / BDD / Autonomous Agent Task Packets  
> **Estado:** 🟡 EN EJECUCIÓN AUTÓNOMA

---

## 📦 Backlog Maestro de Task Packets

### FASE 0: Scaffolding & Entorno Base
- [ ] **TASK-0.1: Inicialización del Proyecto Next.js 14 App Router**
  - *Archivos:* `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.mjs`, `postcss.config.mjs`.
  - *Dependencias:* `next@14`, `react@18`, `react-dom@18`, `tailwindcss`, `lucide-react`, `date-fns`, `zod`, `@supabase/supabase-js`, `@google/genai`.
  - *Verificación:* `npm run build` o `tsc --noEmit`.

- [ ] **TASK-0.2: Configuración de PWA y Metaetiquetas Mobile-First**
  - *Archivos:* `public/manifest.json`, `app/layout.tsx`, `app/globals.css`.
  - *Invariante:* Viewport configurado para evitar zoom accidental (`viewport-fit=cover`, `user-scalable=no`).

---

### FASE 1: Base de Datos & Capa de Acceso a Datos
- [ ] **TASK-1.1: Migraciones SQL Supabase (DDL Completo)**
  - *Archivos:* `supabase/migrations/20261004000000_init_schema.sql`.
  - *Tablas:* `events`, `tasks`, `notes`, `telegram_conversations`, `audit_logs`.
  - *Índices:* B-tree en `start_time`, `date`, `status`, `tier`.

- [ ] **TASK-1.2: Cliente Supabase y Tipos TypeScript de Base de Datos**
  - *Archivos:* `lib/supabase/client.ts`, `lib/supabase/server.ts`, `types/database.types.ts`.
  - *Invariante:* Tipado estricto sin `any`.

---

### FASE 2: Tokens de Diseño & Componentes Atómicos
- [ ] **TASK-2.1: Mapeo de Variables CSS y Tokens Originales**
  - *Tokens:* `--purple #6558f5`, `--red #ff5d63`, `--orange #f2a641`, `--blue #4c9af5`, `--green #46a978`, `--yellow #e7c94a`.
  - *Fuentes:* Manrope y DM Sans vía `next/font/google`.

- [ ] **TASK-2.2: Componentes Core de Interfaz**
  - *Archivos:* `components/ui/EventPill.tsx`, `components/ui/Badge.tsx`, `components/ui/FAB.tsx`, `components/ui/BottomNav.tsx`, `components/ui/TopHeader.tsx`.
  - *Ergonomía:* Tap targets mínimos de 44x44px.

---

### FASE 3: Vista Móvil Google Calendar & Feed Agenda
- [ ] **TASK-3.1: Cabecera Mensual Colapsable con Soporte Gestual**
  - *Archivos:* `components/calendar/MonthHeaderCollapsible.tsx`, `components/calendar/WeekStrip.tsx`.
  - *Comportamiento:* Scroll hacia abajo expande mes; scroll hacia arriba comprime a tira semanal.

- [ ] **TASK-3.2: Feed Vertical de Agenda con Separadores Semánticos**
  - *Archivos:* `components/calendar/AgendaFeed.tsx`, `components/calendar/DaySection.tsx`.
  - *Comportamiento:* Scroll continuo de días, resaltando "HOY" y agrupando eventos por bloques temáticos.

---

### FASE 4: Línea de Tiempo Táctil con Drag-and-Drop
- [ ] **TASK-4.1: Grilla Horaria Táctil y Bloques Arrastrables**
  - *Archivos:* `components/timeline/TactileTimeline.tsx`, `components/timeline/TimelineBlock.tsx`.
  - *Comportamiento:* Long-press de 250ms para activar arrastre, vibración háptica (`navigator.vibrate`), bloqueo estricto en zonas Tier 1.

- [ ] **TASK-4.2: Estado Optimista y Persistencia de Reordenamiento**
  - *Archivos:* `hooks/useTimelineState.ts`, `app/actions/timeline.ts`.
  - *Comportamiento:* Actualización visual instantánea con rollback automático en caso de fallo en BD.

---

### FASE 5: Anotador Personal Híbrido
- [ ] **TASK-5.1: Módulo de Anotaciones Contextuales y Backlog General**
  - *Archivos:* `components/notes/NotesContainer.tsx`, `components/notes/NoteCard.tsx`, `components/notes/NoteEditorModal.tsx`.
  - *Tabs:* "Notas del Día", "Ideas & Backlog", "Todas".
  - *Metadata:* Timestamp de creación, etiquetas (`#utn`, `#idea`, `#prioridad`).

---

### FASE 6: Motor de IA Gemini 2.0 Flash
- [ ] **TASK-6.1: Servicio de Clasificación de Intenciones con Esquemas Zod**
  - *Archivos:* `lib/ai/gemini.ts`, `lib/ai/intentParser.ts`.
  - *Salida:* JSON estructurado garantizado (`CREATE_EVENT`, `CREATE_TASK`, `ADD_NOTE`, `RESCHEDULE_PROPOSAL`).

- [ ] **TASK-6.2: Motor de Reprogramación y Análisis de Dificultad**
  - *Archivos:* `lib/ai/rescheduleEngine.ts`, `lib/ai/difficultyScorer.ts`.
  - *Algoritmo:* Generación de Escenarios A, B y C ante colapso de horas.

---

### FASE 7: Bot de Telegram & Smart Quiet Windows
- [ ] **TASK-7.1: Webhook de Telegram en App Router**
  - *Archivos:* `app/api/telegram/webhook/route.ts`, `lib/telegram/bot.ts`.
  - *Soporte:* Mensajes de texto, mensajes de voz (audio ogg/opus con Gemini Flash).

- [ ] **TASK-7.2: Despachador de Alertas y Smart Quiet Windows**
  - *Archivos:* `lib/scheduler/notificationDispatcher.ts`, `app/api/cron/notifications/route.ts`.
  - *Cadencia:* 7d, 3d, 2d, 24h, 2h. Supresión durante bloques Tier 1.

---

### FASE 8: Integración con Google Classroom API
- [ ] **TASK-8.1: Cliente de Sincronización y Delta Polling de Classroom**
  - *Archivos:* `lib/classroom/client.ts`, `app/api/cron/classroom-sync/route.ts`.
  - *Comportamiento:* Ingestión de consignas activas, cálculo de dificultad y almacenamiento en tabla `tasks`.

---

### FASE 9: Verificación de Calidad, Tests y Preparación para Vercel
- [ ] **TASK-9.1: Suite de Tests Unitarios y Validación de Compilación**
  - *Archivos:* `tests/tier-protection.test.ts`, `tests/smart-quiet-windows.test.ts`.
  - *Verificación:* `tsc --noEmit` y `npm run build` limpios.
