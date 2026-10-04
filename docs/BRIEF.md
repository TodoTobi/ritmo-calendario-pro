# BRIEF.md — Relevamiento de Usuario, Propuesta de Valor y Análisis Competitivo

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Fecha:** Octubre 2026  
> **Documento:** Relevamiento Estratégico de Producto & Benchmarking

---

## 1. Arquetipo de Usuario (User Persona)

```
┌────────────────────────────────────────────────────────────────────────┐
│                          PERFIL: LUCAS (18 AÑOS)                       │
│  Ubicación: Gran Buenos Aires, Argentina (Zona Horaria GMT-3)          │
│  Rol: Estudiante del último año de Secundaria Técnica &                │
│       Aspirante a Ingeniería en Sistemas / Electromecánica en la UTN.  │
├────────────────────────────────────────────────────────────────────────┤
│ • Día a Día: Horarios escolares variables (salidas a las 18:00, 13:00, │
│   16:10), cursada de ingreso UTN los sábados de mañana, inglés         │
│   vespertino martes y jueves, 3 láminas técnicas complejas por semana, │
│   pasantías virtuales, entrenamiento físico y guitarra.                │
│ • Vida Espiritual & Comunidad: Miembro activo de su iglesia. Devocional│
│   diario matutino, grupo de jóvenes y servicio los fines de semana.    │
│ • Dispositivo Primario: Teléfono móvil (Android / iOS) usado en        │
│   viajes de transporte público, momentos de descanso y entre clases.   │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.1. Frustraciones y Puntos de Dolor Primarios (Pain Points)
1. **Fricción Extrema de Entrada:** Escribir títulos, seleccionar fechas y definir horarios manualmente en Google Calendar mientras camina o viaja en colectivo es tedioso. Como resultado, muchas tareas quedan sin anotar.
2. **El "Cementerio de Tareas" de los Calendarios Tradicionales:** Cuando un día se complica y una tarea de 2 horas no se realiza, Google Calendar la deja atrás como si ya hubiese ocurrido. No hay noción de arrastre ni de deuda de tiempo.
3. **Falta de Sentido de Prioridad Sagrada:** Otras aplicaciones no entienden que el devocional diario o el horario de iglesia no pueden postergarse para hacer una tarea escolar.
4. **Desconexión con Google Classroom:** Los profesores publican entregas en Classroom con fechas límite diversas; transcribirlas a mano al calendario introduce errores y olvidos.
5. **Anotadores Desconectados del Tiempo:** Las notas en Notion o Google Keep quedan desvinculadas del momento en que deben ejecutarse.

---

## 2. Propuesta de Valor de Ritmo

Ritmo transforma el concepto de agenda pasiva en un **compañero activo de disciplina personal**:
- **Captura Inmediata por Voz:** Con un audio de 10 segundos enviado al bot de Telegram (*"Che Ritmo, el profesor de Calitecno pidió el informe para el martes que viene a las 14"*), el sistema procesa el audio con Gemini 2.0 Flash, extrae la fecha, asigna la prioridad y devuelve una tarjeta interactiva para confirmarlo con un toque.
- **Sincronización Transparente con Classroom:** Escanea periódicamente las asignaciones pendientes de los cursos escolares y crea automáticamente los bloques de estudio requeridos.
- **Línea de Tiempo Táctil con Drag-and-Drop:** Permite redistribuir los bloques del día deslizando el dedo en una interfaz móvil fluida y limpia.
- **Blindaje de lo Sagrado:** Bloquea de raíz cualquier intento de agendar compromisos sobre las franjas de fe, cursada de UTN e inglés.

---

## 3. Indicadores Clave de Éxito (KPIs del Sistema)

| Indicador | Meta Cuantitativa | Medición |
| :--- | :--- | :--- |
| **Tiempo de Captura de Tarea** | **< 10 segundos** | Desde el envío del audio en Telegram hasta la confirmación en la tarjeta interactiva. |
| **Cumplimiento de Láminas de Dibujo** | **100% entregadas en fecha (3/semana)** | Bloques de 2 horas cumplidos en la agenda sin desborde hacia el fin de semana de estudio UTN. |
| **Inviolabilidad de Tier 1** | **0 colisiones registradas** | Cero alertas o eventos asignados sobre el devocional, iglesia o cursada de UTN. |
| **Preparación Preventiva UTN** | **14 días de estudio estructurado** | Inicio de sesiones de simulación dos semanas antes del Parcial 2 (24 Oct) y Recuperatorio (7 Nov). |
| **Costo Operativo Mensual** | **$0.00 USD exactos** | Verificación mensual de consumos dentro de las cuotas gratuitas de Vercel, Supabase y Google AI Studio. |

---

## 4. Análisis Competitivo y Benchmarking

| Dimensión | Google Calendar | Notion | Motion ($19/mo) | Reclaim.ai ($12/mo) | **Ritmo (Este Proyecto)** |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Costo** | Gratis | Gratis (básico) | Caro ($19 USD/mes) | De pago ($12 USD/mes) | **$0.00 USD / mes (100% Libre)** |
| **Captura por Voz (Telegram)** | No | No | No | No | **Sí (Gemini 2.0 Flash STT)** |
| **OCR de Pizarrón / Apuntes** | No | No | No | No | **Sí (Gemini Multimodal)** |
| **Sincronización Classroom** | Manual | No | No | Parcial | **Nativa Directa con OAuth2** |
| **Jerarquía Sagrada (Tiers)** | No existe | Config manual | No configurable | Solo laboral | **Nativa Inviolable (Tiers 1-3)** |
| **Reprogramación HITL** | Manual (tediosa) | No | Caja negra (opaca) | Algorítmica rígida | **3 Escenarios con confirmación** |
| **Smart Quiet Windows** | No | No | No | Horario laboral | **Suprime en Iglesia/Devocional** |
| **Pipeline con NotebookLM** | No | No | No | No | **Sí (vía Google Drive Markdown)** |
| **Drag & Drop Táctil Móvil** | Regular | Deficiente | Aceptable | Regular | **Nativo y Fluido en PWA** |

---

## 5. Conclusión del Relevamiento

El usuario no necesita otro gestor de tareas estático ni un calendario que requiera 20 minutos de mantenimiento diario. Necesita un **asistente en el bolsillo que hable su mismo idioma**, que lo espere en Telegram para recibir audios desordenados, que sincronice sus materias escolares y que le permita reacomodar su día con simples deslizamientos de dedo sobre la pantalla, garantizando que su ingreso a la UTN y su vida espiritual marchen en perfecta sincronía.
