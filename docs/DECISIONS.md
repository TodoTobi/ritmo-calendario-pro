# DECISIONS.md — Registro de Decisiones Arquitectónicas (ADR-001 a ADR-015)

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Estándar:** Architecture Decision Records (ADR) según formato Michael Nygard  
> **Estado:** Todos los ADRs se encuentran en estado **ACEPTADO (ACCEPTED)**

---

## Índice de Decisiones
- [ADR-001: Aplicación Web Progresiva (PWA) Mobile-First sobre App Nativa](#adr-001-aplicación-web-progresiva-pwa-mobile-first-sobre-app-nativa)
- [ADR-002: Next.js 14 App Router y Vercel Hobby Free Tier](#adr-002-nextjs-14-app-router-y-vercel-hobby-free-tier)
- [ADR-003: Supabase PostgreSQL 16 sobre SQLite Local o Firebase](#adr-003-supabase-postgresql-16-sobre-sqlite-local-o-firebase)
- [ADR-004: Arquitectura Monousuario con Token Maestro sobre NextAuth/Clerk](#adr-004-arquitectura-monousuario-con-token-maestro-sobre-nextauthclerk)
- [ADR-005: Google Gemini 2.0 Flash (AI Studio) sobre OpenAI GPT-4o-mini](#adr-005-google-gemini-20-flash-ai-studio-sobre-openai-gpt-4o-mini)
- [ADR-006: Validación Estricta de Salida Estructurada con Zod en IA](#adr-006-validación-estricta-de-salida-estructurada-con-zod-en-ia)
- [ADR-007: Telegram Bot API como Interfaz Conversacional Primaria](#adr-007-telegram-bot-api-como-interfaz-conversacional-primaria)
- [ADR-008: Reprogramación Human-in-the-Loop con 3 Propuestas sobre Auto-Reprogramación Opaca](#adr-008-reprogramación-human-in-the-loop-con-3-propuestas-sobre-auto-reprogramación-opaca)
- [ADR-009: Cadencia Preventiva y Smart Quiet Windows sobre Notificaciones Push Constantes](#adr-009-cadencia-preventiva-y-smart-quiet-windows-sobre-notificaciones-push-constantes)
- [ADR-010: Integración Directa con Google Classroom API mediante Delta Polling](#adr-010-integración-directa-con-google-classroom-api-mediante-delta-polling)
- [ADR-011: Sincronización en Google Drive para Alimentación de NotebookLM](#adr-011-sincronización-en-google-drive-para-alimentación-de-notebooklm)
- [ADR-012: Modelo Híbrido de Notas (Contextuales Diarias + Backlog de Ideas)](#adr-012-modelo-híbrido-de-notas-contextuales-diarias--backlog-de-ideas)
- [ADR-013: Línea de Tiempo Táctil con Drag-and-Drop y Actualizaciones Optimistas](#adr-013-línea-de-tiempo-táctil-con-drag-and-drop-y-actualizaciones-optimistas)
- [ADR-014: Serialización de Errores bajo Estándar RFC 7807 (Problem Details)](#adr-014-serialización-de-errores-bajo-estándar-rfc-7807-problem-details)
- [ADR-015: Estrategia de Infraestructura de Costo Cero ($0.00 USD/mes)](#adr-015-estrategia-de-infraestructura-de-costo-cero-000-usdmes)

---

### ADR-001: Aplicación Web Progresiva (PWA) Mobile-First sobre App Nativa
- **Contexto:** El usuario interactúa intensamente desde su smartphone durante traslados diarios y recreos escolares. Desarrollar apps nativas independientes (iOS Swift + Android Kotlin/Flutter) requeriría pagar cuotas de desarrollador de Apple ($99/año) y Google Play ($25), duplicar la base de código y demorar semanas en compilación y publicación.
- **Decisión:** Implementar Ritmo como una Web App Progresiva (PWA) Mobile-First desarrollada en HTML5/React/Tailwind, instalable en la pantalla de inicio del teléfono y con soporte completo de gestos táctiles.
- **Consecuencias:**
  - *Positivas:* Despliegue continuo instantáneo en Vercel, costo de distribución $0, una única base de código, acceso fluido a APIs de pantalla táctil y vibración (`navigator.vibrate`).
  - *Negativas:* Acceso limitado a ciertas APIs nativas profundas en iOS (mitigado al usar Telegram para notificaciones y audio).

---

### ADR-002: Next.js 14 App Router y Vercel Hobby Free Tier
- **Contexto:** Se requiere renderizado rápido en servidor (SSR) para velocidad en móvil, Server Actions para mutaciones limpias y rutas de API serverless para procesar webhooks de Telegram y Classroom.
- **Decisión:** Adoptar Next.js 14+ con App Router alojado en el plan Hobby gratuito de Vercel.
- **Consecuencias:**
  - *Positivas:* Excelente experiencia de desarrollo con TypeScript, edge caching global, costo $0, despliegues automáticos desde Git.
  - *Negativas:* Límite de ejecución de 10 segundos por Serverless Function. Mitigado delegando tareas pesadas a colas asíncronas.

---

### ADR-003: Supabase PostgreSQL 16 sobre SQLite Local o Firebase
- **Contexto:** La persistencia requiere integridad relacional estricta (claves foráneas, restricciones de solapamiento horario), consultas complejas por fecha y soporte de políticas de acceso. SQLite local no permite acceso concurrente desde el bot de Telegram y la web sin un servidor dedicado.
- **Decisión:** Utilizar Supabase (PostgreSQL 16) bajo el Free Tier.
- **Consecuencias:**
  - *Positivas:* Motor relacional de clase mundial, soporte para funciones en base de datos (RPC), triggers, JSONB para escenarios y Row Level Security.
  - *Negativas:* Pausa automática tras 7 días de inactividad en el plan gratis. Mitigado configurando un healthcheck ping diario vía cron.

---

### ADR-004: Arquitectura Monousuario con Token Maestro sobre NextAuth/Clerk
- **Contexto:** Ritmo es un sistema estrictamente personal. Añadir sistemas multi-usuario comerciales como NextAuth, Clerk o Supabase Auth introduce tablas innecesarias, cookies pesadas, pantallas de inicio de sesión recurrentes y riesgo de agotar límites de usuarios activos gratuitos.
- **Decisión:** Implementar un esquema monousuario soberano con autenticación mediante una clave maestra secreta (`RITMO_MASTER_TOKEN`) validada a través de un Middleware en Next.js.
- **Consecuencias:**
  - *Positivas:* Cero fricción de inicio de sesión, arranque instantáneo en el navegador del usuario, máxima simplicidad y mínima superficie de ataque.
  - *Negativas:* No admite de forma nativa que múltiples usuarios compartan la misma instancia (alineado con la visión de software personal).

---

### ADR-005: Google Gemini 2.0 Flash (AI Studio) sobre OpenAI GPT-4o-mini
- **Contexto:** Se requiere procesamiento multimodal de alta velocidad (transcripción directa de notas de voz en Telegram, lectura visual de pizarrones con ejercicios de UTN y extracción de entidades) dentro del presupuesto de $0.00 USD.
- **Decisión:** Seleccionar Google Gemini 2.0 Flash a través de la API gratuita de Google AI Studio (15 peticiones por minuto, 1,500 solicitudes diarias).
- **Consecuencias:**
  - *Positivas:* Inferencia multimodal nativa extremadamente veloz (<1.5s), soporte de audio directo sin necesidad de Whisper intermedio, cuota gratuita generosa.
  - *Negativas:* Techo estricto de 15 RPM. Mitigado implementando cola con semáforo y control de concurrencia en Next.js.

---

### ADR-006: Validación Estricta de Salida Estructurada con Zod en IA
- **Contexto:** Los modelos de lenguaje pueden generar texto libre ambiguo o JSON malformado que rompería la inserción en la base de datos o el motor de calendario.
- **Decisión:** Forzar el uso de Structured Outputs (`responseMimeType: "application/json"`) en Gemini 2.0 Flash y validar cada respuesta con esquemas Zod rigurosos antes de cualquier operación.
- **Consecuencias:**
  - *Positivas:* Eliminación del 99.9% de errores por alucinación estructural; tipado TypeScript estricto garantizado en tiempo de compilación.
  - *Negativas:* Si Gemini omite un campo requerido, Zod rechaza la carga útil. Se implementan valores por defecto seguros y modo de degradación a nota de texto.

---

### ADR-007: Telegram Bot API como Interfaz Conversacional Primaria
- **Contexto:** Mientras el usuario camina o viaja en transporte público, abrir un sitio web y rellenar un formulario con teclado resulta incómodo. Telegram es una aplicación ya instalada, rápida y con excelente soporte de audio y botones.
- **Decisión:** Establecer un bot de Telegram como canal principal de captura y alertas del sistema Ritmo, conectado vía Webhook seguro con Next.js.
- **Consecuencias:**
  - *Positivas:* Entrada de datos en 5 segundos, soporte de teclado en línea para confirmaciones con un toque, notificaciones push fiables en móvil.
  - *Negativas:* Dependencia de la infraestructura de Telegram para la entrega de mensajes.

---

### ADR-008: Reprogramación Human-in-the-Loop con 3 Propuestas sobre Auto-Reprogramación Opaca
- **Contexto:** Los sistemas como Motion mueven tareas de forma autónoma. Esto genera frustración en el usuario al sentir que pierde el control de su propia vida o cuando el algoritmo coloca una tarea escolar en un horario de devocional o iglesia.
- **Decisión:** Adoptar el patrón Human-in-the-Loop (HITL). Cuando Ritmo detecta una sobrecarga, calcula 3 escenarios transparentes (A: Compresión diaria, B: Buffer de fin de semana, C: Prioridad UTN) y exige la aprobación explícita del usuario vía botón en Telegram o la Web.
- **Consecuencias:**
  - *Positivas:* Confianza total del usuario en el sistema; respeto inviolable de compromisos personales; sensación de control.
  - *Negativas:* Requiere un paso de confirmación manual adicional por parte del usuario.

---

### ADR-009: Cadencia Preventiva y Smart Quiet Windows sobre Notificaciones Push Constantes
- **Contexto:** Las notificaciones push continuas generan ceguera de alertas y desobedecen los momentos de solemnidad espiritual (cultos de iglesia, oración) o concentración académica (clases de UTN e inglés).
- **Decisión:** Definir una cadencia de alertas fija (7 días, 3 días, 2 días, 24 horas y 2 horas) combinada con el algoritmo de **Smart Quiet Windows**, que suprime alertas sonoras durante bloques de Tier 1 y las reprograma para los 15-30 minutos posteriores.
- **Consecuencias:**
  - *Positivas:* Cero interrupciones en la iglesia o devocionales; máxima efectividad psicológica en las alertas emitidas en momentos oportunos.
  - *Negativas:* Lógica adicional de cálculo horario al momento de despachar alertas.

---

### ADR-010: Integración Directa con Google Classroom API mediante Delta Polling
- **Contexto:** Las tareas y fechas límites de la escuela técnica se publican en Google Classroom. El ingreso manual genera errores y omisiones.
- **Decisión:** Integrar directamente la Google Classroom API mediante flujo OAuth2, ejecutando sincronizaciones incrementales (delta sync) periódicas.
- **Consecuencias:**
  - *Positivas:* Entregas escolares reflejadas automáticamente en el calendario; cálculo inmediato de horas de estudio necesarias.
  - *Negativas:* Necesidad de gestionar y refrescar tokens OAuth2 de Google periódicamente.

---

### ADR-011: Sincronización en Google Drive para Alimentación de NotebookLM
- **Contexto:** Google NotebookLM es una herramienta clave para preparar el ingreso a la UTN, pero requiere fuentes de texto organizadas en Google Drive.
- **Decisión:** Toda nota o apunte generado en Ritmo con la etiqueta `#utn` se exporta automáticamente como un documento Markdown en una carpeta sincronizada de Google Drive (`/Ritmo_UTN_Notes/`).
- **Consecuencias:**
  - *Positivas:* Integración fluida con NotebookLM para generar guías de estudio y simulacros de parciales sin intervención manual.
  - *Negativas:* Requiere permisos de escritura en la Google Drive API (`drive.file`).

---

### ADR-012: Modelo Híbrido de Notas (Contextuales Diarias + Backlog de Ideas)
- **Contexto:** Existen anotaciones asociadas a un momento temporal preciso (ej. "Llevar escuadra y compás para el bloque de dibujo de hoy") y pensamientos abstractos sin fecha fija (ej. "Idea para proyecto de visión artificial").
- **Decisión:** Diseñar un modelo de datos híbrido con dos vertientes: notas contextuales vinculadas a un `event_id` o fecha, y un backlog general categorizado por etiquetas (#utn, #dibujo, #devocional, #proyectos, #ideas).
- **Consecuencias:**
  - *Positivas:* El usuario no pierde ideas al vuelo y puede consultar rápidamente lo necesario para su día activo.
  - *Negativas:* La interfaz de notas debe incluir un conmutador de pestañas claro para evitar confusiones de visualización.

---

### ADR-013: Línea de Tiempo Táctil con Drag-and-Drop y Actualizaciones Optimistas
- **Contexto:** En dispositivos móviles, reorganizar la agenda con selectores de hora tradicionales es incómodo y lento.
- **Decisión:** Implementar una vista de Línea de Tiempo Táctil interactiva con soporte de arrastre por toque (*touch drag-and-drop*), retroalimentación háptica y mutaciones optimistas en cliente con reversión en caso de colisión.
- **Consecuencias:**
  - *Positivas:* Sensación táctil de control absoluto; velocidad instantánea percibida (0ms de latencia aparente); diseño ergonómico para una sola mano.
  - *Negativas:* Requiere gestión matemática precisa de coordenadas de toque y prevención de eventos de scroll nativo no deseados.

---

### ADR-014: Serialización de Errores bajo Estándar RFC 7807 (Problem Details)
- **Contexto:** Mensajes de error dispersos o formatos heterogéneos dificultan la depuración tanto por desarrolladores humanos como por agentes de IA.
- **Decisión:** Estandarizar todas las respuestas de error en las APIs de Ritmo bajo el formato RFC 7807 (`application/problem+json`).
- **Consecuencias:**
  - *Positivas:* Diagnóstico inmediato, trazabilidad mediante `code` y `instance`, consistencia total en frontend y bot.
  - *Negativas:* Requiere que todo bloque `catch` pase por un serializador tipado.

---

### ADR-015: Estrategia de Infraestructura de Costo Cero ($0.00 USD/mes)
- **Contexto:** El usuario no dispone de presupuesto mensual para pagar servidores, bases de datos o servicios de suscripción de software.
- **Decisión:** Diseñar la arquitectura con estricto acoplamiento a las ofertas gratuitas (Free Tiers) permanentes: Vercel Hobby, Supabase Free Tier, Google AI Studio Free Tier y Telegram Bot API.
- **Consecuencias:**
  - *Positivas:* Sostenibilidad perpetua del proyecto sin costos operativos para el creador.
  - *Negativas:* Obligación de diseñar defensivamente contra cuotas de rate limit (15 RPM en IA, 500 MB en BD) y caídas por inactividad.
