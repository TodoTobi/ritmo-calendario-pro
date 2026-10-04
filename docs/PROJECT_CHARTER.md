# PROJECT_CHARTER.md — Acta de Constitución del Proyecto Ritmo

> **Nombre del Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Patrocinador / Propietario:** Usuario (Estudiante Técnico / Aspirante a Ingeniería UTN)  
> **Líder Técnico:** AI Tech Lead  
> **Fecha de Emisión:** Octubre 2026  
> **Estado:** Aprobado para Construcción de Producción

---

## 1. Justificación del Negocio & Visión Estratégica

### 1.1. Contexto y Oportunidad
El usuario se encuentra transitando una de las etapas académicas y personales de mayor demanda cognitiva de su vida: el último tramo de la escuela secundaria técnica (con entrega de láminas de dibujo técnico y pasantías laborales virtuales), la preparación simultánea para el examen de ingreso a la **Universidad Tecnológica Nacional (UTN)** en las carreras de ingeniería, la formación continua en idioma inglés y proyectos de inteligencia artificial, manteniendo intactos sus compromisos espirituales en su congregación, su devocional diario con Dios y el deporte de fin de semana.

Las soluciones del mercado de consumo masivo (Google Calendar, Notion, Apple Reminders) fracasan sistemáticamente:
- Exigen entrada de datos manual y tediosa desde el teclado.
- Tratan un parcial de física o matemáticas de la UTN con la misma indiferencia que un evento recreativo.
- Carecen de mecanismos para reprogramar automáticamente una semana colapsada.

### 1.2. Declaración de Visión
Construir **Ritmo**, un sistema operativo personal proactivo, inteligente y de costo cero ($0.00 USD/mes), que centralice la captura de compromisos mediante audio y fotos en Telegram, sincronice automáticamente las entregas académicas de Google Classroom, proteja con rigor absoluto los tiempos sagrados e inamovibles, y ofrezca una experiencia táctil móvil de reordenamiento de bloques para garantizar que el usuario ingrese a la universidad sin sufrir sobrecarga ni claudicar en sus convicciones.

---

## 2. Objetivos del Proyecto (SMART)

1. **Eficiencia en Captura (S-1):** Reducir el tiempo promedio para registrar una tarea, nota o examen de 45 segundos (en Google Calendar tradicional) a **menos de 7 segundos** mediante notas de voz o fotos analizadas por Gemini 2.0 Flash en Telegram.
2. **Protección de Prioridades Sagradas (S-2):** Alcanzar un **100% de inviolabilidad de los compromisos de Tier 1** (Devocional diario, cursadas de inglés, ingreso de UTN, reuniones de iglesia y torneo de fútbol dominical), impidiendo que el motor de reprogramación asigne tareas en dichas franjas.
3. **Cero Entregas Fuera de Término (S-3):** Garantizar la finalización y entrega del 100% de las 3 láminas técnicas semanales y las asignaciones de Google Classroom gracias a la cadencia de alertas preventivas (7d, 3d, 2d, 24h, 2h).
4. **Resiliencia Operativa & Costo Cero (S-4):** Operar el sistema de manera ininterrumpida manteniendo un presupuesto exacto de **$0.00 USD mensuales**, optimizando el uso de los tiers gratuitos de Vercel, Supabase, Telegram y Google AI Studio.

---

## 3. Alcance del Proyecto

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ALCANCE INCLUIDO (IN-SCOPE)                     │
├────────────────────────────────────────────────────────────────────────┤
│ • Aplicación Web Progresiva (PWA) Mobile-first optimizada para tacto.  │
│ • Grilla mensual colapsable con vista agenda vertical (estilo GCal).   │
│ • Vista interactiva de Línea de Tiempo con Drag-and-Drop táctil diario.│
│ • Bot de Telegram con soporte de voz (Gemini STT) y visión (OCR UTN).  │
│ • Tarjetas de confirmación interactivas con inline keyboards antes de BD│
│ • Sincronización bidireccional / delta sync con Google Classroom API.   │
│ • Pipeline de sincronización de notas hacia Google Drive & NotebookLM. │
│ • Motor de reprogramación Human-in-the-Loop con 3 propuestas viables.  │
│ • Cadencia de alertas a 7d, 3d, 2d, 24h y 2h con Smart Quiet Windows.  │
│ • Base de datos relacional Supabase PostgreSQL 16 con RLS monousuario. │
├────────────────────────────────────────────────────────────────────────┤
│                     ALCANCE EXCLUIDO (OUT-OF-SCOPE)                    │
├────────────────────────────────────────────────────────────────────────┤
│ • Soporte multi-inquilino (multi-tenant) comercial o pasarelas de pago.│
│ • Publicación de apps nativas en Apple App Store o Google Play Store.  │
│ • Modelos de IA autoalojados pesados que requieran GPUs dedicadas.     │
│ • Reprogramación automática desatendida sin confirmación del usuario.  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Partes Interesadas (Stakeholders)

| Rol | Persona / Entidad | Interés / Responsabilidad |
| :--- | :--- | :--- |
| **Usuario Propietario** | Estudiante Técnico / Creador | Máxima adopción, facilidad de uso desde el móvil, cero estrés ante entregas y preparación óptima para UTN. |
| **AI Tech Lead** | Agente de Arquitectura | Garantizar la excelencia técnica, estabilidad de APIs, type safety, cumplimiento de cuotas de IA y entrega de documentación. |
| **Entorno Académico** | Profesores Escuela Técnica & UTN | Receptores indirectos de láminas y exámenes entregados en tiempo y forma. |
| **Comunidad Espiritual** | Iglesia / Grupo de Jóvenes | Beneficiarios de la presencia puntual y sin distracciones del usuario. |

---

## 5. Supuestos y Restricciones

### Supuestos Clave:
- El usuario cuenta con conectividad a Internet móvil periódica en su dispositivo para recibir notificaciones y enviar audios a Telegram.
- La API de Google AI Studio mantendrá el modelo Gemini 2.0 Flash accesible bajo el esquema free tier de 15 RPM.
- La escuela y la UTN mantienen la publicación de novedades en Google Classroom y pizarrones físicos.

### Restricciones Técnicas:
- **Presupuesto Financiero:** Estrictamente $0.00 USD/mes. Queda prohibido el aprovisionamiento de recursos de pago.
- **Límites de Ejecución Serverless:** Máximo 10 segundos por solicitud en Vercel Hobby Tier.
- **Zona Horaria Inamovible:** Toda la lógica de negocio debe ejecutarse bajo `America/Argentina/Buenos_Aires` (UTC-3).

---

## 6. Matriz de Riesgos y Planes de Mitigación

| ID | Riesgo Identificado | Prob. | Impacto | Estrategia de Mitigación |
| :---: | :--- | :---: | :---: | :--- |
| **R-1** | Saturación de la cuota de 15 RPM en Gemini 2.0 Flash por ráfagas de audio. | Media | Alto | Implementar semáforo con cola en memoria, reintentos exponenciales y almacenamiento en crudo de notas como fallback. |
| **R-2** | Supensión de la base de datos Supabase tras 7 días de baja actividad. | Baja | Crítico | Configurar un cron job automatizado de healthcheck que ejecute una consulta ligera cada 24 horas. |
| **R-3** | Solapamiento de alertas sonoras durante reuniones de iglesia o devocionales. | Media | Alto | Implementar el algoritmo de **Smart Quiet Windows** que retiene alertas durante bloques de Tier 1 y las libera al finalizar. |
| **R-4** | Desconfiguración o expiración de tokens OAuth2 de Google Classroom. | Media | Medio | Capturar el evento en Next.js y enviar un botón de refresco rápido a Telegram para reautenticación en 1 clic. |

---

## 7. Criterios de Aceptación y Hitos Principales

```
[Hito 1: Fundaciones & Persistencia] ─────> [Hito 2: UX Móvil & Drag-Drop]
       (DDL Supabase, Auth Token)                (Grilla Google Cal, Timeline)
                    │                                          │
                    ▼                                          ▼
[Hito 3: Telegram Bot & Gemini] ─────────> [Hito 4: Classroom & Drive Sync]
   (Voz, OCR, Tarjetas Confirmación)            (OAuth2, NotebookLM Source)
                    │                                          │
                    ▼                                          ▼
[Hito 5: Motor de Reprogramación HITL] ──> [Hito 6: Simulación Parcial UTN]
      (Detección sobrecarga, 3 opciones)          (Validación con Parcial 24 Oct)
```
