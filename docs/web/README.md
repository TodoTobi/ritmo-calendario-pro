# README.md — Suite de Especificaciones Web & Experiencia de Usuario

> **Directorio:** `c:\Users\usuario\Documents\Calendario Pro\docs\web`  
> **Propósito:** Colección exhaustiva de documentos de ingeniería web, auditorías de interfaz, ergonomía móvil, arquitectura de información y sistemas de diseño para la aplicación **Ritmo**.

---

## 1. Índice de Documentos en este Directorio

| Archivo | Título del Documento | Descripción / Contenido Clave |
| :--- | :--- | :--- |
| **`00_AUDITORIA_INTEGRAL_ESTADO_REAL.md`** | Auditoría Técnica del Prototipo Existente | Análisis línea por línea de `index.html` (483 líneas), CSS nativo, variables `:root`, lógica JS global y limitaciones de escalabilidad. |
| **`01_ESTRATEGIA_Y_RELEVAMIENTO.md`** | Estrategia Móvil & Ergonomía Táctil | Definición de experiencia Mobile-First, alcance del pulgar (*thumb zone*), breakpoints y resiliencia offline PWA. |
| **`04_ARQUITECTURA_DE_INFORMACION_Y_NAVEGACION.md`** | Arquitectura de Información & Flujos | Sitemap completo, Bottom Bar móvil vs Sidebar desktop, taxonomía de modales y transiciones de pantalla. |
| **`05_WIREFRAMING_Y_PROTOTIPADO_BAJA_FIDELIDAD.md`** | Wireframing en Arte ASCII | Prototipos visuales de la vista Google Calendar Mobile, Línea de Tiempo Táctil Drag-and-Drop, Anotador Híbrido, Bot de Telegram y Modal de Reprogramación. |
| **`06_SISTEMA_DE_DISENO_UI_KIT.md`** | UI Kit & Implementación Tailwind CSS | Configuración de `tailwind.config.ts`, planos de componentes React (EventPill, FAB, etc.) e iconografía oficial Lucide. |

---

## 2. Relación con la Arquitectura Global de Ritmo

Los documentos de este subdirectorio detallan la capa de **Presentación y Experiencia de Usuario (Frontend / UI / UX)**, y se complementan con los documentos rectores de la raíz y de `/docs`:
- Para la arquitectura del backend, modelos C4 y DDL de Supabase, consultar [`docs/ARCHITECTURE.md`](file:///c:/Users/usuario/Documents/Calendario%20Pro/docs/ARCHITECTURE.md).
- Para los contratos de API y esquemas Zod, consultar [`docs/TECH_REFERENCE.md`](file:///c:/Users/usuario/Documents/Calendario%20Pro/docs/TECH_REFERENCE.md).
- Para las decisiones de diseño arquitectónico fundamentales, consultar [`docs/DECISIONS.md`](file:///c:/Users/usuario/Documents/Calendario%20Pro/docs/DECISIONS.md).
- Para las directivas operativas de agentes de IA, consultar [`AGENTS.md`](file:///c:/Users/usuario/Documents/Calendario%20Pro/AGENTS.md).
