# Ritmo — Calendario & Anotador Personal Inteligente

> Un sistema operativo personal activo, opinado y asistido por Inteligencia Artificial que supera a Google Calendar mediante automatización conversacional en Telegram, sincronización académica con Google Classroom y reordenamiento táctil interactivo.

[![Stack](https://img.shields.io/badge/Stack-Next.js%2014%20%7C%20TypeScript%20%7C%20TailwindCSS-blue.svg)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL%2016-green.svg)](https://supabase.com/)
[![AI Engine](https://img.shields.io/badge/AI-Google%20Gemini%202.0%20Flash-orange.svg)](https://aistudio.google.com/)
[![Bot](https://img.shields.io/badge/Interface-Telegram%20Bot%20API-blue.svg)](https://core.telegram.org/bots)
[![Cost](https://img.shields.io/badge/Infrastructure-0.00%20USD%20%2F%20mes-brightgreen.svg)](#presupuesto-y-costo-cero)

---

## 1. Visión General & Propuesta de Valor

Los calendarios convencionales sufren de **ceguera de contexto**: tratan por igual una cita médica que un parcial definitorio de ingreso a la universidad, no protestan cuando la jornada colapsa y exigen decenas de clics para acomodar la rutina.

**Ritmo** nace para acompañar el ritmo de vida de un estudiante técnico de alto rendimiento en Buenos Aires. Combina:
- **Captura sin fricción:** Agendá notas o compromisos enviando audios de Telegram desde la calle o sacando fotos a pizarrones de la UTN.
- **Jerarquía Sagrada de Tiers:** Tus compromisos inamovibles (fe, familia, iglesia, cursadas fijas) quedan blindados. La Inteligencia Artificial solo reprograma la carga flexible.
- **Sincronización Académica:** Importa entregas y tareas vivas desde Google Classroom y exporta tus notas estructuradas a Google Drive para alimentarlas en Google NotebookLM.
- **Experiencia Móvil Táctil:** Grilla mensual y agenda vertical inspiradas en Google Calendar Mobile, combinadas con una **Línea de Tiempo Táctil Drag-and-Drop** para acomodar tus bloques del día con un dedo.

---

## 2. Características Principales

| Módulo | Descripción Funcional |
| :--- | :--- |
| **UX Móvil Google Calendar** | Cabecera mensual colapsable con indicador de fase, agenda vertical infinita y perforación (drill-down) del mes hacia el detalle diario. |
| **Timeline Táctil Drag-and-Drop** | Reordenamiento de bloques horarios mediante gestos táctiles directos, detección de solapamientos y respuesta háptica. |
| **Bot Bidireccional de Telegram** | Transcripción de mensajes de voz, OCR de pizarrones, tarjetas interactivas de confirmación antes de guardar y alertas proactivas. |
| **Motor de IA Gemini 2.0 Flash** | Clasificación de intenciones en lenguaje natural con esquemas estrictos de Zod y estimación de puntaje de dificultad académica. |
| **Alertas con Smart Quiet Windows** | Notificaciones a 7 días, 3 días, 2 días, 24 horas y 2 horas. Silencia alertas durante bloques inamovibles y las despacha en transiciones. |
| **Reprogramación Human-in-the-Loop** | Detecta desbordes horarios y propone 3 escenarios viables de reajuste para que el usuario elija con un solo toque en Telegram o la Web. |
| **Anotador Híbrido & NotebookLM** | Notas contextuales por bloque y backlog general etiquetado. Sincronización continua de apuntes UTN en Google Drive para síntesis en NotebookLM. |

---

## 3. Matriz de Rutina y Jerarquía de Bloques

Ritmo clasifica cada actividad en una jerarquía estricta para resolver colisiones automáticamente:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   TIER 1: INAMOVIBLES (Soberanos)                      │
│  • Devocional con Dios (Diario)          • UTN Ingreso (Sáb 08:00-14:30)│
│  • Instituto de Inglés (Mar/Jue 18:30)   • Parcial UTN (24 Oct / 7 Nov) │
│  • Iglesia (Mié 19:00, Sáb/Dom tardes)   • Torneo de Fútbol (Dom mañanas│
├────────────────────────────────────────────────────────────────────────┤
│                   TIER 2: MOVIBLES ESTRUCTURADOS                       │
│  • Horarios de salida escolar (Lun 18:00, Mié 13:00/17:00, Vie 13:20) │
│  • Pasantías virtuales (Horarios flexibles con meta semanal)          │
├────────────────────────────────────────────────────────────────────────┤
│                   TIER 3: HÁBITOS Y CARGA COGNITIVA                    │
│  • Dibujo Técnico (3 láminas/sem, ~2h c/u) • Proyectos & Estudio IA     │
│  • Estudio anticipado exámenes (1-2d prev) • Nuevas Habilidades (1-2h) │
│  • Guitarra & Práctica de Inglés (1h/día)  • Gimnasio con pesas (1-2h)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Estructura del Repositorio

```
Calendario Pro/
├── AGENTS.md                                    # Reglas y directivas para agentes LLM
├── AI_TECHLEAD_BRIEF.md                         # Briefing arquitectónico y operativo del sistema
├── README.md                                    # Este documento (visión general y guía de inicio)
├── PROTOCOLO_IMPLEMENTACION_NUEVAS_FEATURES.md  # Ciclo de vida y estándares para features
├── PROTOCOLO_DEBUGGING.md                       # Guía de triaje y catálogo de fallos RFC 7807
├── index.html                                   # Prototipo legacy original de referencia
│
├── docs/                                        # Documentación de ingeniería FAANG
│   ├── PROJECT_CHARTER.md                       # Acta fundacional del proyecto
│   ├── BRIEF.md                                 # Relevamiento de usuario y análisis competitivo
│   ├── SPEC.md                                  # Especificación técnica y funcional detallada
│   ├── ARCHITECTURE.md                          # Arquitectura global, C4 y DDL de Supabase
│   ├── FRONTEND_ARCHITECTURE.md                 # Arquitectura de UI, Drag-and-Drop y estado
│   ├── DECISIONS.md                             # Registros de Decisiones Arquitectónicas (ADR 001-015)
│   ├── DEPLOY.md                                # Guía de despliegue $0 USD y DevOps
│   ├── ESTILO_Y_PALETA_DE_COLORES.md            # Tokens, paleta de colores y accesibilidad
│   ├── SISTEMA_DE_DISENO.md                     # Sistema de diseño UI atómico y componentes
│   ├── TECH_REFERENCE.md                        # Referencia de API, contratos Zod y prompts
│   ├── ANOTACIONES.md                           # Sistema híbrido de notas y pipeline NotebookLM
│   ├── COMPLIANCE_LEGAL_Y_ACCESIBILIDAD.md      # Privacidad de datos, OAuth2 y WCAG AA
│   ├── GUIA_OFICIAL_BUENAS_PRACTICAS_Y_SISTEMA.md# Manual de hábitos operativos para el usuario
│   ├── PLAN_DE_PROYECTO_Y_GESTION.md            # Plan de hitos y ruta crítica hacia exámenes
│   ├── PRESENTACION_EJECUTIVA.md                # Pitch y presentación estratégica de impacto
│   └── RECONCILIACION_ARQUITECTURA_Y_DISCREPANCIAS.md # Auditoría de transición legacy -> Next.js
│
└── docs/web/                                    # Especificaciones profundas de interfaz web
    ├── 00_AUDITORIA_INTEGRAL_ESTADO_REAL.md     # Auditoría técnica línea por línea de index.html
    ├── 01_ESTRATEGIA_Y_RELEVAMIENTO.md          # Estrategia móvil, ergonomía y breakpoints
    ├── 04_ARQUITECTURA_DE_INFORMACION_Y_NAVEGACION.md # Flujos de usuario y mapas de navegación
    ├── 05_WIREFRAMING_Y_PROTOTIPADO_BAJA_FIDELIDAD.md # Wireframes completos en arte ASCII
    ├── 06_SISTEMA_DE_DISENO_UI_KIT.md           # Tokens Tailwind, componentes base y CSS
    └── README.md                                # Índice y guía de navegación de la suite web
```

---

## 5. Guía de Instalación y Desarrollo Local

### 5.1. Requisitos Previos
- Node.js 20.x LTS o superior.
- Gestor de paquetes `pnpm` o `npm`.
- Cuenta en Supabase (Free Tier).
- Google AI Studio API Key (Gemini 2.0 Flash).
- Bot de Telegram registrado mediante `@BotFather`.
- Proyecto en Google Cloud Console con APIs de Classroom y Drive habilitadas.

### 5.2. Variables de Entorno (`.env.local`)
Crear el archivo `.env.local` en la raíz del proyecto basándose en la siguiente plantilla:

```env
# Ritmo Master Secret Token (Monousuario)
RITMO_MASTER_TOKEN="rtm_sec_a8f9c2d1e04b789123456789abcdef"

# Supabase PostgreSQL & API
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Google Gemini 2.0 Flash
GEMINI_API_KEY="AIzaSyAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Telegram Bot API
TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
TELEGRAM_WEBHOOK_SECRET="whsec_telegram_master_verification_9918"
TELEGRAM_AUTHORIZED_CHAT_ID="987654321"

# Google Workspace (Classroom & Drive)
GOOGLE_CLIENT_ID="xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/google/callback"
GOOGLE_REFRESH_TOKEN="1//0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 5.3. Inicialización de Base de Datos (Supabase)
Ejecutar el script SQL contenido en [`docs/ARCHITECTURE.md`](file:///c:/Users/usuario/Documents/Calendario%20Pro/docs/ARCHITECTURE.md) dentro del **SQL Editor** de Supabase para generar las tablas, índices, enums y funciones necesarias.

### 5.4. Ejecución del Servidor Local
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo en puerto 3000
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

### 5.5. Configuración del Webhook de Telegram para Desarrollo
Para recibir audios y mensajes en desarrollo local, exponer el puerto con una herramienta de túnel como `ngrok` o `cloudflared`:

```bash
ngrok http 3000

# Registrar el webhook en Telegram
curl -F "url=https://tu-tunel.ngrok.app/api/telegram/webhook" \
     -F "secret_token=whsec_telegram_master_verification_9918" \
     https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook
```

---

## 6. Presupuesto y Costo Cero ($0.00 USD / mes)

Ritmo opera 100% dentro de los límites gratuitos permanentes:
- **Vercel Hobby:** Aloja el frontend y las rutas de API serverless.
- **Supabase Free:** 500 MB de base de datos relacional y storage para imágenes OCR.
- **Google AI Studio (Gemini 2.0 Flash):** 15 peticiones por minuto gratuitas.
- **Telegram Bot API:** Infraestructura de mensajería gratuita ilimitada para uso personal.
- **Google Classroom & Drive API:** Cuotas gratuitas para desarrollador personal.

---

## 7. Referencias y Documentación Clave

- [Arquitectura Global del Sistema](file:///c:/Users/usuario/Documents/Calendario%20Pro/docs/ARCHITECTURE.md)
- [Especificación Técnica de Requerimientos](file:///c:/Users/usuario/Documents/Calendario%20Pro/docs/SPEC.md)
- [Registros de Decisiones Arquitectónicas (ADRs)](file:///c:/Users/usuario/Documents/Calendario%20Pro/docs/DECISIONS.md)
- [Sistema de Diseño & Wireframes ASCII](file:///c:/Users/usuario/Documents/Calendario%20Pro/docs/web/05_WIREFRAMING_Y_PROTOTIPADO_BAJA_FIDELIDAD.md)
- [Protocolo de Implementación para Agentes](file:///c:/Users/usuario/Documents/Calendario%20Pro/PROTOCOLO_IMPLEMENTACION_NUEVAS_FEATURES.md)
