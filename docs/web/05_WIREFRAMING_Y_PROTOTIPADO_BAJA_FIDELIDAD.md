# 05_WIREFRAMING_Y_PROTOTIPADO_BAJA_FIDELIDAD.md — Wireframes Completos en Arte ASCII

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Formato:** Wireframes de Baja Fidelidad en Arte ASCII de Alta Densidad  
> **Vistas Prototipadas:** Mobile Google Calendar View, Línea de Tiempo Táctil Drag-and-Drop, Anotador Híbrido, Tarjeta Interactiva de Telegram y Modal de Reprogramación.

---

## 1. Vista Móvil Principal: Google Calendar Inspired (Mes Colapsable + Agenda)

```
┌────────────────────────────────────────────────────────┐
│ [≡] Ritmo                        [Hoy]  [⌕]  [Foco]    │
├────────────────────────────────────────────────────────┤
│ <               SEPTIEMBRE 2026                      > │
│ D     L     M     M     J     V     S                  │
│       31    1     2     3     4     5                  │
│             ●     ●     ●     ●     ●                  │
│ 6     7     8     9     10    11    12                 │
│ ●     ●     ●     ●     ●     ●                        │
│ 13    14    15    16    17    18    19                 │
│ ●     ●                 ●                              │
│ 20    21    22    23    24    25    26                 │
│ ●     ●     ●           ●                              │
│ 27    28    29    30    1     2     3                  │
│             ●     ●                                    │
├────────────────────────────────────────────────────────┤
│ ▼ Deslizar hacia arriba comprime el mes a tira semanal │
├────────────────────────────────────────────────────────┤
│ HOY · JUEVES 27 DE AGOSTO                              │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 07:00 | [Verde] Devocional con Dios       (Tier 1) │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 17:00 | [Rojo] UTN · Repaso final         (Tier 1) │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 19:30 | [Naranja] Dibujo · Lámina 2       (Tier 3) │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ MAÑANA · VIERNES 28 DE AGOSTO                          │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 15:00 | [Rojo] UTN · Bloque fuerte        (Tier 1) │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 19:00 | [Verde] Guitarra e Inglés         (Tier 3) │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│                                                ┌─────┐ │
│                                                │ (+) │ │
│                                                │ FAB │ │
│                                                └─────┘ │
├────────────────────────────────────────────────────────┤
│ [▦ Calendario]   [◷ Línea Táctil]   [✎ Notas]  [⚙ Ajustes]│
└────────────────────────────────────────────────────────┘
```

---

## 2. Vista 2: Línea de Tiempo Táctil Drag-and-Drop (Timeline Táctil)

```
┌────────────────────────────────────────────────────────┐
│ <  JUEVES 27 AGOSTO 2026  >          [Restablecer] [✓] │
├────────────────────────────────────────────────────────┤
│ Escala Horaria | Bloques Táctiles Reordenables         │
├────────────────────────────────────────────────────────┤
│ 07:00 ──────── │ 🔒 [Tier 1] Devocional con Dios       │
│ 07:30 ──────── │ (Zona blindada contra arrastre)       │
│ 08:00 ──────── │                                       │
│ 09:00 ──────── │                                       │
│ 10:00 ──────── │                                       │
│ 11:00 ──────── │                                       │
│ 12:00 ──────── │                                       │
│ 13:00 ──────── │                                       │
│ 14:00 ──────── │                                       │
│ 15:00 ──────── │                                       │
│ 16:00 ──────── │                                       │
│ 17:00 ──────── │ 🔒 [Tier 1] UTN · Repaso final        │
│ 18:00 ──────── │                                       │
│ 18:30 ──────── │ ── Ranura libre para soltar ──        │
│ 19:00 ──────── │ ┌───────────────────────────────────┐ │
│ 19:30 ──────── │ │ ↕ [Tier 3] Dibujo · Lámina 2 (2h) │ │
│ 20:00 ──────── │ │ [Arrastrando con el dedo...]      │ │
│ 20:30 ──────── │ │ Sombra elevada + vibración táctil │ │
│ 21:00 ──────── │ └───────────────────────────────────┘ │
│ 21:30 ──────── │                                       │
│ 22:00 ──────── │                                       │
│ 22:30 ──────── │ ──────────────── Limite de descanso ──│
├────────────────────────────────────────────────────────┤
│ Consejo: Mantené presionado 250ms para mover un bloque.│
│ Los bloques sagrados de Tier 1 no se pueden desplazar. │
├────────────────────────────────────────────────────────┤
│ [▦ Calendario]   [◷ Línea Táctil]   [✎ Notas]  [⚙ Ajustes]│
└────────────────────────────────────────────────────────┘
```

---

## 3. Vista 3: Anotador Híbrido (Notas del Día vs. Backlog de Ideas)

```
┌────────────────────────────────────────────────────────┐
│ Anotador Personal                      [+ Nueva Nota]  │
├────────────────────────────────────────────────────────┤
│   ┌────────────────────────┬────────────────────────┐  │
│   │   Notas del Día (3)    │  ★ Backlog Ideas (8)   │  │
│   └────────────────────────┴────────────────────────┘  │
├────────────────────────────────────────────────────────┤
│ Filtrar por etiqueta:                                  │
│ [Todos]  [#utn (4)]  [#dibujo (2)]  [#devocional (2)]  │
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ #utn · Sincronizado con Drive / NotebookLM     [☁] │ │
│ │ Dudas de Trigonometría & Choque Elástico           │ │
│ │ • Recordar la relación entre sen^2 + cos^2 = 1.    │ │
│ │ • Fórmulas de choque inelástico de la clase UTN.   │ │
│ │ Hace 2 horas · Extraído por OCR de Telegram        │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ #dibujo                                            │ │
│ │ Observaciones Lámina 3 · Profesor Calitecno        │ │
│ │ • Corregir espesor de trazo en líneas de cota.     │ │
│ │ • Llevar microfibra 0.2 y regla T limpia.          │ │
│ │ Ayer 19:40 · Nota de voz transcrita                │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ #devocional                                        │ │
│ │ Filipenses 4:6-7 — Paz en medio de parciales       │ │
│ │ "Por nada estéis afanosos, sino sean conocidas..." │ │
│ │ 27 ago 07:15                                       │ │
│ └────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────┤
│ [▦ Calendario]   [◷ Línea Táctil]   [✎ Notas]  [⚙ Ajustes]│
└────────────────────────────────────────────────────────┘
```

---

## 4. Vista 4: Conversación en Telegram & Tarjeta Interactiva de Confirmación

```
┌────────────────────────────────────────────────────────┐
│ 💬 Telegram · Ritmo Personal Bot                       │
├────────────────────────────────────────────────────────┤
│ [Lucas] 🎤 Mensaje de voz (0:09)                      │
│ "Che Ritmo, anotame para el jueves que viene a las    │
│ tres de la tarde entrega de informe de Calitecno."     │
│                                                14:22 ✓ │
├────────────────────────────────────────────────────────┤
│ [Ritmo Bot] 🤖                                         │
│ Transcribiendo y analizando con Gemini 2.0 Flash...    │
│                                                14:23   │
│ ┌────────────────────────────────────────────────────┐ │
│ │ 📋 NUEVO COMPROMISO DETECTADO                      │ │
│ │                                                    │ │
│ │ • Título: Entrega Informe Calitecno                │ │
│ │ • Fecha: Jueves 08 de Octubre 2026                 │ │
│ │ • Horario: 15:00 a 16:30 (90 min sugeridos)        │ │
│ │ • Categoría: [Azul] Formación Técnica / Colegio    │ │
│ │ • Precedencia: Tier 2 (Movible Estructurado)       │ │
│ │ • Dificultad Académica: 3 / 5                      │ │
│ │                                                    │ │
│ │ ¿Confirmamos el guardado en tu calendario?         │ │
│ └────────────────────────────────────────────────────┘ │
│ ┌───────────────────┬────────────────────────────────┐ │
│ │ [✓ Confirmar]     │ [✎ Ajustar Hora]               │ │
│ ├───────────────────┴────────────────────────────────┤ │
│ │ [✕ Descartar]                                      │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

---

## 5. Vista 5: Modal de Reprogramación Human-in-the-Loop (3 Escenarios)

```
┌────────────────────────────────────────────────────────┐
│ ⚠️ SOBRECARGA DETECTADA EN TU DÍA                      │
│ Hoy tenés 7.5 horas de carga y colisiona con Iglesia.  │
│ Elegí cómo querés redistribuir tu tiempo:              │
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ ESCENARIO A: Compresión Diaria                     │ │
│ │ • Mantiene las 3 láminas de la semana al día.      │ │
│ │ • Reduce Guitarra y Gimnasio a 30 min cada uno.    │ │
│ │ • Termina tu día a las 21:00 sin invadir descanso. │ │
│ │                                  [Aplicar Opción A]│ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ESCENARIO B: Buffer de Fin de Semana               │ │
│ │ • Mueve Lámina 3 al Domingo 15:30 (post fútbol).   │ │
│ │ • Te libera la tarde de hoy para descansar.        │ │
│ │ • Mantiene intacto el horario de iglesia.          │ │
│ │                                  [Aplicar Opción B]│ │
│ └────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ESCENARIO C: Prioridad Absoluta UTN                │ │
│ │ • Pausa proyectos de IA personales por 3 días.     │ │
│ │ • Concentra todo el foco en matemática de UTN.     │ │
│ │                                  [Aplicar Opción C]│ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ [Ajustar Manualmente en Línea de Tiempo]    [Cancelar] │
└────────────────────────────────────────────────────────┘
```
