# DEPLOY.md — Guía de Despliegue, Infraestructura DevOps & Recuperación

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Presupuesto Objetivo:** $0.00 USD / mes (100% Free Tiers)  
> **Plataformas:** Vercel Hobby, Supabase Free Tier, Google Cloud Console, Telegram Bot API

---

## 1. Visión General del Despliegue de Costo Cero

La infraestructura productiva de Ritmo se compone de cuatro servicios en la nube enlazados de manera segura mediante variables de entorno y certificados SSL automáticos:

```
┌──────────────────────┐          ┌──────────────────────┐
│   TELEGRAM CLOUD     │          │    GOOGLE CLOUD      │
│  (Bot API Webhook)   │          │ (Classroom & Drive)  │
└──────────┬───────────┘          └──────────┬───────────┘
           │ HTTPS                           │ OAuth2 REST
           ▼                                 ▼
┌────────────────────────────────────────────────────────┐
│               VERCEL EDGE & SERVERLESS (Hobby)         │
│             Next.js 14 App Router (Región: gru1 / iad1) │
└──────────────────────────┬─────────────────────────────┘
                           │ TLS / Postgres Wire
                           ▼
┌────────────────────────────────────────────────────────┐
│             SUPABASE CLOUD (Free Tier PostgreSQL 16)   │
│             500 MB DB + Realtime Broadcast + RLS       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Configuración de Servicios Paso a Paso

### 2.1. Supabase (Base de Datos PostgreSQL 16)
1. Iniciar sesión en [Supabase](https://supabase.com/) y crear un nuevo proyecto:
   - Nombre: `ritmo-production`
   - Región: `sa-east-1` (São Paulo, Brasil) para mínima latencia con Buenos Aires (<40ms).
   - Generar y guardar la contraseña segura de la base de datos.
2. Acceder al **SQL Editor** de Supabase y pegar el script DDL completo definido en [`docs/ARCHITECTURE.md`](file:///c:/Users/usuario/Documents/Calendario%20Pro/docs/ARCHITECTURE.md).
3. Copiar desde **Project Settings -> API**:
   - `Project URL` (ej. `https://xxxx.supabase.co`)
   - `anon public key`
   - `service_role secret key`

### 2.2. Google Cloud Console (Classroom, Drive & AI Studio)
1. **Google AI Studio:**
   - Ingresar a [Google AI Studio](https://aistudio.google.com/) con la cuenta de Google.
   - Generar una **API Key** para `Gemini 2.0 Flash` y guardarla como `GEMINI_API_KEY`.
2. **Google Cloud Console:**
   - Crear un proyecto: `Ritmo-Personal-Calendar`.
   - Habilitar las APIs: **Google Classroom API** y **Google Drive API**.
   - Configurar la **Pantalla de Consentimiento OAuth** (Tipo: *Externo*, Estado: *En pruebas*, agregar tu propio correo en *Usuarios de prueba*).
   - Crear credenciales: **ID de cliente de OAuth 2.0** (Aplicación web).
   - URI de redireccionamiento autorizados: `https://tu-proyecto.vercel.app/api/auth/google/callback` y `http://localhost:3000/api/auth/google/callback`.
   - Obtener `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.

### 2.3. Telegram Bot API
1. En Telegram, abrir chat con `@BotFather`.
2. Ejecutar `/newbot`, asignar nombre (`Ritmo Personal`) y usuario (ej. `@lucas_ritmo_bot`).
3. Guardar el token HTTP API (`TELEGRAM_BOT_TOKEN`).
4. Configurar comandos del bot enviando a BotFather:
   ```
   hoy - Ver agenda del día
   semana - Ver resumen semanal
   foco - Activar o desactivar modo foco
   laminas - Estado de las láminas de dibujo
   reprogramar - Proponer reajuste de tareas
   sync_classroom - Forzar sincronización con Classroom
   ```

### 2.4. Vercel (Hospedaje Web & Serverless)
1. Conectar el repositorio de GitHub a Vercel.
2. Crear el archivo `vercel.json` en la raíz del proyecto para optimizar la región de las funciones:
   ```json
   {
     "framework": "nextjs",
     "regions": ["iad1"]
   }
   ```
3. Cargar las Variables de Entorno en **Vercel Settings -> Environment Variables**:
   - `RITMO_MASTER_TOKEN`: Token secreto generado (mínimo 32 caracteres alfanuméricos).
   - `NEXT_PUBLIC_SUPABASE_URL`: URL del proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Llave pública anon.
   - `SUPABASE_SERVICE_ROLE_KEY`: Llave privada service role.
   - `GEMINI_API_KEY`: Clave de AI Studio.
   - `TELEGRAM_BOT_TOKEN`: Token entregado por BotFather.
   - `TELEGRAM_WEBHOOK_SECRET`: Clave alfanumérica aleatoria para verificar firmas.
   - `TELEGRAM_AUTHORIZED_CHAT_ID`: Tu ID numérico de Telegram (para evitar que otros interactúen).
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`.

---

## 3. Registro y Activación del Webhook de Telegram

Una vez desplegada la aplicación en Vercel, activar el webhook ejecutando el siguiente comando cURL desde la terminal local:

```bash
curl -X POST "https://api.telegram.org/bot<TU_TELEGRAM_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://tu-proyecto.vercel.app/api/telegram/webhook",
       "secret_token": "<TU_TELEGRAM_WEBHOOK_SECRET>",
       "allowed_updates": ["message", "callback_query"]
     }'
```

Para verificar que el webhook está activo y sin errores:
```bash
curl "https://api.telegram.org/bot<TU_TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

---

## 4. Pipeline de CI/CD (GitHub Actions)

Crear el flujo automatizado en `.github/workflows/ci.yml`:

```yaml
name: Ritmo CI / Quality Gate

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Instalar dependencias
        run: npm ci

      - name: Verificación estricta de TypeScript
        run: npx tsc --noEmit

      - name: Linting
        run: npm run lint
```

---

## 5. Prevención de Inactividad de Supabase (Keep-Alive Cron)

Para evitar que Supabase congele el proyecto tras 7 días de baja actividad, configurar un workflow de GitHub Actions que ejecute una consulta ligera cada 24 horas:

```yaml
name: Supabase Keep-Alive Ping

on:
  schedule:
    - cron: '0 10 * * *' # Todos los días a las 07:00 AM Argentina (10:00 UTC)

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping al endpoint de salud
        run: |
          curl -H "x-ritmo-token: ${{ secrets.RITMO_MASTER_TOKEN }}" \
               https://tu-proyecto.vercel.app/api/health
```

---

## 6. Procedimiento de Respaldo y Recuperación ante Desastres (Disaster Recovery)

1. **Frecuencia de Copia:** Semanal (cada domingo a las 23:30).
2. **Procedimiento:**
   - Supabase permite generar volcados mediante `pg_dump` conectado a la cadena de conexión de pooling:
     ```bash
     pg_dump -h db.xxxx.supabase.co -U postgres -d postgres -F c -b -v -f "ritmo_backup_$(date +%Y%m%d).dump"
     ```
   - El archivo resultante se sube cifrado a la carpeta personal de Google Drive.
3. **Plan de Restauración:** En caso de corrupción o pérdida accidental de datos:
   - Restaurar en una nueva base de datos limpia de Supabase mediante:
     ```bash
     pg_restore -h db.nueva-instancia.supabase.co -U postgres -d postgres -v "ritmo_backup_fecha.dump"
     ```
