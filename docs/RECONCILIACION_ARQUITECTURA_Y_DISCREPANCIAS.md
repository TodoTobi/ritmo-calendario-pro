# RECONCILIACION_ARQUITECTURA_Y_DISCREPANCIAS.md — Informe de Reconciliación & Brechas

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Objeto de Comparación:** Prototipo Estático Legacy (`index.html`) vs. Arquitectura de Producción (`Next.js + Supabase + Telegram + Gemini`)  
> **Objetivo:** Documentar exhaustivamente las 12 discrepancias estructurales y definir el plan de migración para garantizar compatibilidad retroactiva total de la identidad visual.

---

## 1. Resumen Ejecutivo del Estado del Código

El repositorio contenía un prototipo estático inicial implementado en un único archivo HTML (`index.html`, 483 líneas) desarrollado en agosto de 2026. Si bien dicho prototipo definió con acierto la paleta de colores semánticos, las fuentes tipográficas y la premisa estética, posee limitaciones de arquitectura que hacen inviable su uso en producción para las necesidades de Lucas (estudio de ingreso UTN, audios de Telegram, sincronización de Google Classroom y uso táctil en teléfonos móviles).

---

## 2. Matriz de las 12 Discrepancias Críticas

| ID | Área / Dimensión | Estado en Prototipo Legacy (`index.html`) | Estado en Arquitectura de Producción (Ritmo) | Estrategia de Reconciliación / Migración |
| :---: | :--- | :--- | :--- | :--- |
| **D-01** | **Enfoque de Dispositivo (Layout)** | Diseñado para monitores desktop (grid fija `248px + 1fr`, sidebar fija, media queries adaptadas a posteriori). | **Mobile-First Nativo (PWA):** Diseñado primariamente para anchos de 375px a 430px con barra inferior táctil y drawers. | Migrar a componentes Tailwind responsivos donde la vista móvil es la predeterminada y el layout desktop es una extensión progresiva. |
| **D-02** | **Persistencia de Datos** | `localStorage` del navegador. Si el usuario borra la caché del teléfono o cambia de dispositivo, pierde todos sus eventos. | **Supabase PostgreSQL 16:** Base de datos relacional en la nube con copias de seguridad automáticas y Row Level Security. | Migrar el array `baseEvents` a una semilla SQL (`seed.sql`) e implementar endpoints REST/Server Actions. |
| **D-03** | **Gestión Temporal y Fechas** | Fechas congeladas a fines de agosto de 2026 (`new Date(2026, 7, 27)`); cálculos manuales con `addDays()`. | **Manejo Dinámico con Timezone GMT-3:** `date-fns` forzando `America/Argentina/Buenos_Aires` y fechas reales de octubre/noviembre 2026. | Sustituir las funciones aritméticas manuales de JavaScript por envoltorios tipados en `@/lib/date-utils.ts`. |
| **D-04** | **Canal de Captura** | Formulario modal con teclado (`<input id="eventTitle">`, date picker estándar). | **Canal Conversacional en Telegram:** Transcripción de audios y OCR de fotos con Gemini 2.0 Flash. | Construir el webhook `/api/telegram/webhook` manteniendo el formulario web como vía de captura alternativa. |
| **D-05** | **Integración Académica** | Ninguna. Las materias y tareas se cargaban a mano en un array de JavaScript. | **Google Classroom API Directa:** Descarga automática de cursos, tareas asignadas y fechas límites de entrega. | Implementar el servicio de sincronización delta sync autenticado por OAuth2. |
| **D-06** | **Pipeline de Estudio UTN** | Ausente. Solo un texto estático de "UTN examen de ingreso". | **Pipeline Google Drive -> NotebookLM:** Exportación automática de apuntes en Markdown para generar simulacros de parciales. | Crear la tabla `notes` con el campo `synced_to_drive` y el worker de exportación hacia `/Ritmo_UTN_Notes/`. |
| **D-07** | **Interactividad en Línea de Tiempo** | Lista vertical estática renderizada con divs; no permite interactuar ni mover bloques con los dedos. | **Timeline Táctil Drag-and-Drop:** Arrastre táctil magnético por intervalos de 15 min, con retroalimentación háptica. | Implementar el componente `TactileTimelineView` con soporte para gestos táctiles directos y validación de colisiones. |
| **D-08** | **Motor de Reprogramación** | Inexistente. Si una tarea no se hace, queda estancada en el día pasado. | **Motor Human-in-the-Loop (HITL):** Detección de sobrecarga y propuesta de 3 escenarios mediante botones interactivos. | Desarrollar la función transaccional PostgreSQL `apply_reschedule_scenario` y las tarjetas inline de Telegram. |
| **D-09** | **Sistema de Alertas** | Ninguno. No hay notificaciones ni avisos push. | **Cadencia Preventiva (7d, 3d, 2d, 24h, 2h) con Smart Quiet Windows:** Silencia en iglesia y cursada de UTN. | Crear la tabla `alerts_queue` y el despachador inteligente vinculado al bot de Telegram. |
| **D-10** | **Jerarquía de Rutina (Tiers)** | Clasificación cromática visual simple (`red`, `orange`, `blue`, `green`, `yellow`, `purple`) sin reglas de negocio. | **Modelo Semántico de Tres Tiers:** Tier 1 (Inamovibles inviolables), Tier 2 (Movibles), Tier 3 (Hábitos). | Asociar cada categoría cromática a su respectivo Tier en la base de datos para impedir mutaciones no autorizadas. |
| **D-11** | **Gestión de Errores** | Alertas genéricas por `toast()` de texto plano; excepciones no tipadas. | **Estándar RFC 7807 (Problem Details):** Serialización uniforme con códigos de error (`ERR_TIER1_CONFLICT`, etc.). | Implementar middleware de captura de errores que retorne `application/problem+json`. |
| **D-12** | **Anotador** | Inexistente en el prototipo estático (solo existía visualización de eventos de calendario). | **Anotador Híbrido Completo:** Notas contextuales vinculadas a días/bloques + Backlog global con etiquetas. | Crear la vista `/notes` con editor liviano y conmutador de pestañas. |

---

## 3. Matriz de Verificación de Compatibilidad de Tokens de Diseño

Para asegurar que la esencia estética creada en `index.html` permanezca intacta en la nueva aplicación Next.js, se auditaron los tokens visuales:

```typescript
// Archivo de Reconciliación: tailwind.config.ts / color-tokens.ts
export const ritmoColorTokens = {
  // Tokens Semánticos Fundacionales (Preservados al 100%)
  purple: {
    DEFAULT: '#6558f5', // Identidad Ritmo / Fases del plan
    soft: '#eeedff'
  },
  red: {
    DEFAULT: '#ff5d63', // Prioridad Absoluta / UTN Parciales
    soft: '#fff0f1'
  },
  orange: {
    DEFAULT: '#f2a641', // Sprint de Láminas de Dibujo Técnico
    soft: '#fff5e6'
  },
  blue: {
    DEFAULT: '#4c9af5', // Formación Técnica / Colegio
    soft: '#edf6ff'
  },
  green: {
    DEFAULT: '#46a978', // Vida, Fe & Comunidad (Devocional / Iglesia)
    soft: '#edf9f3'
  },
  yellow: {
    DEFAULT: '#e7c94a', // Pasantías & Nuevas Habilidades
    soft: '#fffbea'
  },
  // Neutros de Superficie
  ink: '#151719',
  muted: '#7b8188',
  line: '#e9ebef',
  bg: '#f5f6f8',
  panel: '#ffffff'
};
```

**Conclusión:** La transición de la maqueta `index.html` hacia la suite productiva en Next.js respeta íntegramente la paleta, la tipografía (`Manrope` + `DM Sans`) y las micro-transiciones elásticas, elevando la solución a un estándar de ingeniería de software robusto, resiliente y adaptado al uso real del usuario.
