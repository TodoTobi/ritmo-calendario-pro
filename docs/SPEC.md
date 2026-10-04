# SPEC.md — Especificación Funcional & Técnica Detallada

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Versión:** 1.0.0-PROD  
> **Fecha:** Octubre 2026  
> **Estado:** Especificación Maestra de Ingeniería (SSOT)

---

## 1. Requisitos Funcionales (FR-01 a FR-25)

### 1.1. Gestión de Calendario & Interfaz Móvil
- **FR-01 (Vista Grilla Mensual):** La aplicación debe renderizar un mes completo con navegación rápida entre períodos, indicando visualmente los días con eventos mediante puntos coloreados por categoría y destacando la fecha actual.
- **FR-02 (Drilldown Diario):** Al pulsar sobre cualquier celda de la grilla mensual, la vista debe transicionar inmediatamente al desglose por horas de ese día sin recargar la página.
- **FR-03 (Cabecera Colapsable Estilo Google Calendar):** En dispositivos móviles, al deslizar verticalmente la agenda diaria, la cabecera del mes debe contraerse a una tira semanal horizontal compacta para maximizar el área de lectura.
- **FR-04 (Línea de Tiempo Táctil Drag-and-Drop):** El usuario debe poder presionar de forma prolongada (long-press de 250ms) cualquier bloque de Tier 2 o Tier 3 y desplazarlo verticalmente a un nuevo horario, con respuesta háptica y validación instantánea de colisiones.
- **FR-05 (Botón de Acción Flotante - FAB):** Debe proveer un botón accesible en la esquina inferior derecha para abrir el modal de captura rápida de eventos, notas o tareas.
- **FR-06 (Búsqueda Instantánea con Filtro):** Debe proveer un modal de búsqueda que filtre bloques por título, tipo de actividad o fecha en menos de 50ms.
- **FR-07 (Modo Foco):** Debe permitir alternar con un toque un filtro que oculte actividades recreativas y muestre exclusivamente bloques de máxima prioridad académica y laboral.

### 1.2. Interfaz Conversacional de Telegram & Multimodalidad
- **FR-08 (Recepción de Mensajes de Audio):** El bot de Telegram debe recibir notas de voz en formato OGG/Opus y procesarlas con Gemini 2.0 Flash sin requerir herramientas intermedias de conversión.
- **FR-09 (Recepción de Imágenes & OCR de UTN):** El bot debe recibir fotografías de pizarrones o cuadernos, extraer enunciados de ejercicios o fechas de entrega mediante visión multimodal y categorizarlas.
- **FR-10 (Tarjeta Interactiva de Confirmación):** Antes de persistir cualquier entidad extraída por IA, el bot debe presentar una tarjeta interactiva con botones inline (`Confirmar`, `Editar`, `Cancelar`).
- **FR-11 (Comandos Rápidos de Consulta):** El bot debe responder a `/hoy`, `/semana`, `/foco`, `/laminas` y `/sync_classroom` con resúmenes claros y directos.

### 1.3. Inteligencia Artificial & Clasificación Estructurada
- **FR-12 (Clasificación de Intenciones con Zod):** Toda entrada en lenguaje natural debe clasificarse en una de las intenciones válidas: `CREATE_EVENT`, `RESCHEDULE_TASK`, `LOG_NOTE`, `QUERY_SCHEDULE` o `ADD_DRAWING_PLATE`.
- **FR-13 (Puntaje de Dificultad Académica):** El motor debe evaluar la complejidad de tareas escolares o temas de UTN en una escala del 1 al 5 para dimensionar la duración mínima del bloque de estudio recomendado.
- **FR-14 (Estimador de Carga Cognitiva):** Si el total de horas de estudio complejo y láminas supera las 6 horas netas en un solo día, el sistema debe marcar el día en estado de sobrecarga (`OVERLOAD`).

### 1.4. Integraciones Escolares y de Archivos
- **FR-15 (Sincronización con Google Classroom):** Debe importar periódicamente trabajos de clase (`CourseWork`), fechas límites y materias activas utilizando OAuth2.
- **FR-16 (Normalización de Entregas):** Cada tarea importada de Classroom debe transformarse automáticamente en un evento de entrega con bloque de preparación previo sugerido.
- **FR-17 (Sincronización de Apuntes con Google Drive):** Toda nota o apunte generado con la etiqueta `#utn` debe guardarse como un archivo Markdown en la carpeta designada de Google Drive para alimentar NotebookLM.

### 1.5. Motor de Alertas & Smart Quiet Windows
- **FR-18 (Cadencia Preventiva):** Las alertas de entregas deben programarse a 7 días, 3 días, 2 días, 24 horas y 2 horas antes de la fecha límite.
- **FR-19 (Smart Quiet Windows):** El despachador debe suprimir el envío sonoro o diferir la notificación si coincide con una franja inamovible de Tier 1.
- **FR-20 (Despacho en Ventanas de Transición):** Las alertas diferidas deben despacharse durante los 15 a 30 minutos posteriores a la salida de la iglesia, clase de inglés o cursada de UTN.

### 1.6. Motor de Reprogramación Human-in-the-Loop (HITL)
- **FR-21 (Detección de Desborde):** Debe detectar si un bloque de tarea no completado empuja la jornada más allá de las 22:30 o colisiona con un bloque sagrado.
- **FR-22 (Generación de 3 Escenarios):** Debe calcular 3 alternativas viables:
  1. *Escenario A (Compresión diaria):* Reduce hábitos elásticos para no atrasar la semana.
  2. *Escenario B (Buffer de Fin de Semana):* Traslada carga a la tarde del domingo posterior al fútbol.
  3. *Escenario C (Prioridad UTN):* Pausa temporalmente proyectos personales para blindar el estudio de examen.
- **FR-23 (Aplicación Atómica en BD):** Al seleccionar un escenario en Telegram o Web, la base de datos debe aplicar las nuevas marcas temporales en una única transacción segura.

### 1.7. Anotador Híbrido
- **FR-24 (Notas Contextuales):** Permitir asociar texto y listas de verificación directamente a un bloque horario o fecha específica.
- **FR-25 (Backlog General de Ideas):** Permitir almacenar notas libres categorizadas mediante etiquetas (`#utn`, `#dibujo`, `#devocional`, `#proyectos`, `#ideas`).

---

## 2. Requisitos No Funcionales (NFR-01 a NFR-15)

- **NFR-01 (Presupuesto Financiero Cero):** El sistema debe operar con costo recurrente mensual de $0.00 USD, manteniéndose en los tiers gratuitos de Vercel, Supabase y Google AI Studio.
- **NFR-02 (Rendimiento LCP):** El Largest Contentful Paint (LCP) en dispositivos móviles debe ser inferior a 1.2 segundos sobre conexiones 4G estándar.
- **NFR-03 (Latencia de Interacción INP):** La respuesta al arrastre y soltado táctil (Interaction to Next Paint) debe ser inferior a 100ms.
- **NFR-04 (Seguridad Monousuario):** Todas las rutas de API deben validar el secreto maestro `RITMO_MASTER_TOKEN` en el encabezado `x-ritmo-token`.
- **NFR-05 (Cumplimiento de Cuota Gemini):** El sistema nunca debe exceder 15 peticiones por minuto (RPM) hacia Google AI Studio, empleando una cola con semáforo de concurrencia.
- **NFR-06 (Formato de Errores RFC 7807):** Todo error devuelto por la API debe respetar la especificación RFC 7807 (`application/problem+json`).
- **NFR-07 (Zona Horaria Estricta):** Toda operación de fecha debe forzar la zona horaria `America/Argentina/Buenos_Aires` (UTC-3), previniendo desfasajes por servidores UTC.
- **NFR-08 (Accesibilidad WCAG AA):** La interfaz debe alcanzar una relación de contraste mínima de 4.5:1 para texto normal y soportar navegación por teclado (`1`, `2`, `3`, `+`, `Esc`).
- **NFR-09 (Optimistic UI & Rollback):** Los reordenamientos en la vista de línea de tiempo deben actualizar visualmente el DOM de forma inmediata y revertir limpiamente si la mutación falla en Supabase.
- **NFR-10 (Resiliencia de Webhook de Telegram):** El endpoint del webhook debe responder HTTP 200 en menos de 2.5 segundos para evitar reintentos duplicados de Telegram.
- **NFR-11 (Almacenamiento Liviano en Supabase):** El volumen total de datos no debe superar los 500 MB del plan gratuito de Supabase; las imágenes analizadas por OCR no se guardan en BD, sino solo el texto extraído.
- **NFR-12 (Mantenimiento Keep-Alive de BD):** Un cron job debe ejecutar un ping cada 24 horas para evitar la suspensión por inactividad de Supabase Free Tier.
- **NFR-13 (Código Type-Safe):** 100% de la base de código debe compilar en TypeScript con modo estricto (`strict: true`), prohibiendo el uso de `any`.
- **NFR-14 (Atomicidad de Transacciones):** La reprogramación de múltiples bloques debe ejecutarse mediante funciones RPC en PostgreSQL para garantizar que no queden estados inconsistentes a medio aplicar.
- **NFR-15 (PWA Instalable):** La aplicación web debe incluir un Web App Manifest y Service Worker que permitan su instalación como app en la pantalla de inicio del teléfono.

---

## 3. Modelado Matemático de la Rutina y Restricciones de Tiempo

Cada bloque horario $B_i$ se define por la tupla:
$$B_i = \langle t^{start}_i, t^{end}_i, T_i, C_i \rangle$$
donde:
- $t^{start}_i, t^{end}_i \in \mathbb{R}$ representan las horas del día en minutos transcurridos desde las 00:00.
- $T_i \in \{1, 2, 3\}$ es el Tier de precedencia.
- $C_i \in \{\text{red, orange, blue, green, yellow, purple}\}$ es la categoría cromática.

### Restricciones Inviolables:
1. **Inamovilidad de Tier 1:** Para todo bloque $B_j$ con $T_j = 1$, sus límites temporales están fijos:
   $$\forall B_k \text{ tal que } k \neq j, \quad [t^{start}_k, t^{end}_k] \cap [t^{start}_j, t^{end}_j] = \emptyset$$
2. **Capacidad Máxima Diaria:**
   $$\sum_{i=1}^{n} (t^{end}_i - t^{start}_i) \leq 960 \text{ minutos (16 horas despierto)}$$
3. **Pausa Nocturna Obligatoria:**
   $$t^{end}_i \leq 23:00 \quad \text{y} \quad t^{start}_i \geq 06:30$$

---

## 4. Matriz de Alertas & Algoritmo de Smart Quiet Windows

```mermaid
flowchart TD
    A[Generación de Evento / Deadline D] --> B[Calcular Hitos: D-7d, D-3d, D-2d, D-24h, D-2h]
    B --> C{Llegó el momento del Hito H}
    C --> D{¿La hora actual cae en un Bloque Tier 1?}
    D -- Sí (En Devocional / Iglesia / UTN / Inglés) --> E[Retener Alerta en alerts_queue con flag QUIET_PENDING]
    E --> F[Esperar finalización de Bloque Tier 1]
    F --> G[Despachar Alerta en Ventana de Transición (+15 min)]
    D -- No (Ventana Libre o Tier 2/3) --> H[Despachar Notificación Telegram Inmediata]
```

### Tabla de Ventanas de Silencio (Smart Quiet Windows):
| Bloque Tier 1 | Días | Horario de Silencio (GMT-3) | Ventana de Despacho Permitida |
| :--- | :--- | :---: | :---: |
| **Devocional Matutino** | Lunes a Domingo | 06:45 – 07:30 | 07:35 – 08:00 |
| **Instituto de Inglés** | Martes y Jueves | 18:30 – 20:30 | 20:35 – 21:00 |
| **UTN Ingreso** | Sábados | 08:00 – 14:30 | 14:40 – 15:30 |
| **Célula de Iglesia** | Miércoles | 19:00 – 21:30 | 21:35 – 22:00 |
| **Servicio de Jóvenes** | Sábados | 17:00 – 23:00 | Domingo 08:00 |
| **Reunión General Iglesia** | Domingos | 18:00 – 23:00 | Lunes 07:30 |
| **Torneo de Fútbol** | Domingos | 08:00 – 14:00 | 14:15 – 15:00 |
