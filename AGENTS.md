# AGENTS.md — Reglas y Guía de Operación para Agentes de Inteligencia Artificial

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Ubicación:** `c:\Users\usuario\Documents\Calendario Pro`  
> **Versión del Sistema:** 1.0.0-PROD-SPEC  
> **Metodología:** VetConnect AI-First Engineering / Clean Architecture  
> **Audiencia:** Agentes LLM autónomos (Claude, GPT-4, Gemini, Cursor, Copilot) y Desarrolladores

---

## 1. Misión del Agente en este Repositorio

Tu rol en **Ritmo** es actuar como un **Tech Lead y Senior Software Engineer de nivel FAANG**. No eres un mero generador de snippets; eres el custodio de la arquitectura, la integridad de los datos, la experiencia de usuario y la estabilidad del sistema.

Ritmo no es un clon genérico de Google Calendar: es un **sistema de enfoque personal, hábitos y gestión de tiempo activo, opinado y automatizado**, con sincronización con Telegram, Google Classroom y Google Drive. Cada cambio de código que propongas o implementes debe respetar los invariantes arquitectónicos, no romper el presupuesto operativo de costo cero ($0.00/mes) y mantener la experiencia móvil ultrarrápida.

---

## 2. Invariantes Arquitectónicos Inquebrantables (Ground Rules)

Cualquier agente que modifique este código debe cumplir estrictamente las siguientes reglas:

1. **Monousuario Soberano (Zero-Auth Overhead):**  
   Ritmo está diseñado para un único usuario propietario. No implementes flujos complejos de registro multi-tenant, NextAuth, Clerk o Auth0 a menos que sea explícitamente solicitado. La autenticación se basa en una clave secreta maestra (`RITMO_MASTER_TOKEN`) validada vía Middleware en Next.js y Row Level Security (RLS) simplificado en Supabase.
2. **Presupuesto $0.00 USD / Mes (Free Tier Guardrails):**  
   - **Google Gemini 2.0 Flash:** Límite estricto de 15 peticiones por minuto (RPM). Toda llamada al LLM debe contar con control de concurrencia, debounce y caché en memoria/PostgreSQL.
   - **Vercel Hobby:** Respetar los límites de serverless functions (máximo 10 segundos de ejecución por invocación en free tier). Procesos largos de sincronización deben trocearse o despacharse asíncronamente vía webhook.
   - **Supabase Free Tier:** Límite de 500 MB de base de datos. Mantener schemas normalizados y podar logs históricos mediante políticas de retención.
3. **Jerarquía Sagrada de Tiers de Tiempo:**  
   - **Tier 1 (Inamovibles):** Devocional con Dios, Iglesia, Instituto de Inglés, UTN Ingreso (Sábados y parciales 24 Oct / 7 Nov), Torneo de Fútbol de Domingos. **Jamás** deben ser reprogramados ni solapados de manera automática.
   - **Tier 2 (Movibles):** Pasantías virtuales, horarios variables de salida escolar.
   - **Tier 3 (Hábitos / Carga):** 3 láminas de dibujo técnico semanales (~2h c/u), preparación de parciales, guitarra, gimnasio, proyectos de IA.
4. **Patrón Human-in-the-Loop en Reprogramaciones:**  
   El motor de reprogramación jamás muta el calendario de forma silenciosa. Detecta sobrecarga, envía una notificación estructurada a Telegram con 2 o 3 escenarios viables y espera la confirmación explícita del usuario mediante botones inline.
5. **Preservación del Sistema de Diseño y Tokens:**  
   Los colores semánticos (`--purple #6558f5`, `--red #ff5d63`, `--orange #f2a641`, `--blue #4c9af5`, `--green #46a978`, `--yellow #e7c94a`) y las tipografías (`Manrope` para títulos y métricas, `DM Sans` para interfaces y cuerpo) están congelados. Está prohibido introducir librerías de estilos pesadas o alterar estos tokens.

---

## 3. Definition of Ready (DoR) y Definition of Done (DoD)

### 3.1. Definition of Ready (DoR)
Antes de escribir una sola línea de código para una nueva feature, el agente debe verificar:
- [ ] La necesidad funcional está mapeada a un Tier específico (Tier 1, Tier 2 o Tier 3).
- [ ] Se cuenta con el contrato de datos Zod definido para requests/responses.
- [ ] No impacta negativamente los límites de cuota de Gemini (15 RPM) o Supabase.
- [ ] Si involucra UI, existe el wireframe conceptual o ASCII wireframe correspondiente.
- [ ] Si involucra API externa (Telegram / Classroom / Drive), se contemplan los fallos de red y rate limits.

### 3.2. Definition of Done (DoD)
Una tarea solo se considera completa cuando:
- [ ] TypeScript compila sin errores (`tsc --noEmit` con `strict: true`).
- [ ] Los esquemas de validación Zod coinciden exactamente con los DDL de Supabase.
- [ ] Los errores se serializan bajo el estándar **RFC 7807 (Problem Details)**.
- [ ] El diseño responde fluidamente en viewports móviles (375px a 430px) y mantiene soporte desktop.
- [ ] Los commits siguen la especificación de **Conventional Commits**.
- [ ] La documentación en `/docs` se actualiza si hubo cambios en endpoints, schemas o ADRs.

---

## 4. Estándar de Commits (Conventional Commits)

Los agentes deben estructurar sus mensajes de commit respetando la siguiente convención estricta:

```
<tipo>(<ámbito>): <descripción corta en imperativo minúscula>

[cuerpo explicativo opcional detallando el porqué y las decisiones técnicas]

[referencias a issues o documentos]
```

### Tipos Permitidos:
- `feat`: Nueva funcionalidad de usuario o sistema.
- `fix`: Corrección de un bug.
- `refactor`: Cambio de código que no altera comportamiento ni añade features.
- `perf`: Mejora de rendimiento o reducción de latencia.
- `docs`: Modificaciones exclusivas en documentación técnica.
- `style`: Formateo, espacios en blanco, sin cambio lógico.
- `test`: Incorporación o corrección de pruebas unitarias/integración.
- `chore`: Mantenimiento, dependencias o configuración de build.

### Ámbitos (`scope`) Comunes en Ritmo:
- `calendar`: Motor de calendario, grilla mensual, agenda vertical.
- `timeline`: Vista de línea de tiempo táctil drag-and-drop.
- `telegram`: Bot de Telegram, webhooks, tarjetas interactivas.
- `ai`: Integración con Gemini 2.0 Flash, OCR, clasificación de intenciones.
- `classroom`: Sincronización con Google Classroom API.
- `notes`: Módulo híbrido de notas y backlog de ideas.
- `db`: Migraciones de Supabase, funciones RPC, índices.

*Ejemplo:*
```bash
feat(telegram): implement audio transcription webhook with gemini 2.0 flash
fix(timeline): resolve touch drag boundary collision on ios safari
docs(adr): document adr-013 for tactile drag-and-drop optimistic state
```

---

## 5. Estándar de Gestión de Errores: RFC 7807 (Problem Details)

Toda API desarrollada en Next.js App Router (`/app/api/...`) debe responder con errores tipados bajo el estándar **RFC 7807** con `Content-Type: application/problem+json`.

### Estructura TypeScript:
```typescript
export interface ProblemDetails {
  type: string;        // URI de referencia del error (ej. "https://ritmo.local/errors/gemini-rate-limit")
  title: string;       // Resumen legible en español del problema
  status: number;      // Código HTTP correspondiente (ej. 429, 400, 500)
  detail: string;      // Explicación detallada del contexto específico del fallo
  instance?: string;   // Endpoint o recurso específico afectado
  invalidParams?: Array<{
    name: string;
    reason: string;
  }>;
  code?: string;       // Código interno de Ritmo (ej. "ERR_TIER1_CONFLICT")
  timestamp: string;   // ISO-8601 UTC
}
```

---

## 6. Stack Tecnológico & Reglas de Estilo de Código

### 6.1. Stack Base
- **Runtime:** Node.js 20+ LTS
- **Framework:** Next.js 14+ (App Router con Server Components y Server Actions)
- **Lenguaje:** TypeScript 5.4+ con `strict: true` y `noImplicitAny: true`
- **Estilos:** Tailwind CSS v3 con tokens mapeados a variables CSS nativas
- **Base de Datos:** Supabase PostgreSQL 16
- **IA:** `@google/genai` (SDK oficial para Gemini 2.0 Flash)
- **Gestión de Fecha:** `date-fns` v3 con timezone configurado en `America/Argentina/Buenos_Aires`

### 6.2. Reglas de Estilo
- **Imports:** Absolutos usando `@/components/...`, `@/lib/...`, `@/types/...`.
- **Componentes:** Funcionales con tipado explícito de `props`. Evitar `any` bajo cualquier circunstancia.
- **Server Actions:** Siempre validar inputs con `zod.parse()` antes de interactuar con Supabase.
- **Client Components:** Marcados con `'use client'` únicamente cuando requieran estado táctil, drag-and-drop o interactividad de navegador.

---

## 7. Instrucciones de Context Loading para Agentes

Cuando un agente inicia una sesión de trabajo en este repositorio, debe seguir este orden de lectura para cargar contexto antes de proponer soluciones:

1. `AI_TECHLEAD_BRIEF.md`: Comprensión holística del problema, rutinas y limitaciones de cuota.
2. `docs/ARCHITECTURE.md`: Modelo C4, DDL de base de datos y flujos de integración.
3. `docs/FRONTEND_ARCHITECTURE.md`: Estructura de vistas, drag-and-drop táctil y optimismo de UI.
4. `docs/DECISIONS.md`: Los 15 ADRs fundacionales que justifican cada decisión tecnológica.
5. `docs/SPEC.md`: Especificación funcional y reglas matemáticas de los Tiers de tiempo.

> [!IMPORTANT]
> Nunca modifiques el archivo estático legacy `index.html` salvo que la instrucción indique explícitamente auditarlo o reconciliarlo con el nuevo código Next.js. El desarrollo activo reside bajo los estándares documentados en `/docs`.
