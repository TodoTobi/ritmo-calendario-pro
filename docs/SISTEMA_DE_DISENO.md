# SISTEMA_DE_DISENO.md — Sistema de Diseño Atómico & Componentes de Interfaz

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Metodología:** Atomic Design (Átomos, Moléculas, Organismos, Plantillas)  
> **Objetivo:** Garantizar consistencia visual, ergonomía táctil móvil y máxima velocidad de renderizado.

---

## 1. Desglose bajo Atomic Design

```
    ┌──────────┐      ┌─────────────┐      ┌──────────────┐      ┌─────────────┐
    │  ÁTOMOS  │ ───> │  MOLÉCULAS  │ ───> │  ORGANISMOS  │ ───> │  PLANTILLAS │
    │ Botones  │      │ Chips Event │      │ Grilla Mes   │      │ Pantalla    │
    │ Badges   │      │ Mini Calendar│     │ Timeline DND │      │ Móvil PWA   │
    │ Inputs   │      │ Timeline Row │     │ Modal Sheet  │      │ Completa    │
    └──────────┘      └─────────────┘      └──────────────┘      └─────────────┘
```

---

## 2. Catálogo Detallado de Componentes

### 2.1. Átomos (Atoms)

#### A-01: Botón de Acción Principal (Primary Button / Add Button)
- **Dimensiones:** `38px x 38px` en barra superior; `44px x 44px` en formularios móviles.
- **Fondo:** `#17191c` (`--ink`).
- **Color Texto / Icono:** `#ffffff`.
- **Radio de Borde:** `11px`.
- **Comportamiento Táctil:** Al pulsar (`:active`), se escala a `0.97` con transición de `0.15s ease`.

#### A-02: Badges y Píldoras Semánticas (Badges)
- **Estructura:** Contenedor inline con `padding: 4px 9px`, tipografía Manrope 800 en mayúsculas, tamaño `10px`, radio `999px`.
- **Variantes:**
  - `Badge Prioridad`: Fondo `#fff0f1`, texto `#ff5d63`.
  - `Badge Sprint`: Fondo `#fff5e6`, texto `#f2a641`.
  - `Badge Neutro`: Fondo `#f4f4f6`, texto `#676d74`.

#### A-03: Campos de Entrada (Text Inputs & Selects)
- **Altura fija:** `40px` (desktop), `44px` (móvil para evitar zoom de iOS).
- **Borde:** `1px solid var(--line)` (`#e9ebef`).
- **Radio de Borde:** `10px`.
- **Estado Focus:** Borde `#c9c5ff` con halo exterior de `3px solid var(--purple-soft)`.

---

### 2.2. Moléculas (Molecules)

#### M-01: Píldora de Evento en Calendario (Event Pill)
- **Ancho:** 100% del ancho de celda con elipsis (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`).
- **Estructura:**
  ```html
  <div class="event orange">
    <i class="bar"></i>
    <span>Lámina 2 · Dibujo Técnico</span>
  </div>
  ```
- **Indicador:** Barra lateral izquierda (`.bar`) de `3px` de ancho con bordes redondeados y color primario de la categoría. Fondo de la píldora en color `--soft` correspondiente.

#### M-02: Conmutador de Vistas (View Toggle Switcher)
- **Contenedor:** Fondo gris neutro `#ebedf0`, padding de `4px`, borde redondeado `11px`.
- **Elementos:** 3 botones (`Mes`, `Semana`, `Día`).
- **Botón Activo:** Fondo blanco `#ffffff`, texto `#151719`, sombra `0 2px 8px rgba(0,0,0,0.07)`, tipografía DM Sans 700.

#### M-03: Fila de Línea de Tiempo (Timeline Row)
- **Layout:** Grid de 2 columnas: `[46px horario]` y `[1fr contenido de bloque]`.
- **Horario:** Tamaño `10px`, color `--muted`, alineado a la derecha.
- **Contenido:** Borde lateral izquierdo de `3px` según la categoría cromática, esquinas derechas redondeadas a `10px`, fondo `#fafafd`.

---

### 2.3. Organismos (Organisms)

#### O-01: Grilla Mensual con Celdas de Acción (Month Grid)
- **Estructura:** Grid CSS de 7 columnas (`minmax(0, 1fr)`).
- **Fila de Días:** Altura `39px`, etiquetas `DOM, LUN, MAR, MIÉ, JUE, VIE, SÁB` en Manrope 800 `10px`.
- **Celdas Diarias:** Altura mínima `118px` (desktop) o `92px` (móvil). Destaca el día actual con un gradiente tenue y un círculo oscuro para el número de fecha.

#### O-02: Canvas Táctil de Línea de Tiempo (Tactile Timeline Canvas)
- **Resolución Temporal:** 16 franjas horarias principales (07:00 a 23:00), subdivididas en ranuras magnéticas de 15 minutos.
- **Soporte Drag-and-Drop:** Bloques con manejadores táctiles (*drag handles*), sombras elevadas al interactuar y prevención de arrastre sobre franjas de Tier 1.

#### O-03: Modal Bottom Sheet
- **Fondo Translúcido (Backdrop):** `rgba(17, 19, 22, 0.28)` con `backdrop-filter: blur(7px)`.
- **Panel Modal:** En móvil emerge desde la parte inferior ocupando el 90% del ancho con esquinas superiores redondeadas a `24px` y animación de entrada elástica.

---

## 3. Ergonomía Táctil y Dimensiones Mínimas

Para garantizar que Ritmo pueda operarse cómodamente con una sola mano en movimiento:
1. **Zonas Táctiles (Touch Targets):** Todo botón o elemento interactuable tiene un tamaño mínimo de **44px x 44px**, superando los requerimientos estándar de Apple HIG y Material Design.
2. **Espaciado Mínimo:** Se mantiene una separación de al menos `8px` entre áreas táctiles adyacentes para prevenir toques involuntarios.
3. **Ubicación del Botón de Acción Flotante (FAB):** Posicionado a `24px` del borde inferior y `20px` del borde derecho, en la zona de alcance natural del pulgar derecho.

---

## 4. Filosofía y Curvas de Animación (Motion Design)

Las transiciones en Ritmo no son decorativas: proporcionan orientación espacial continua para que el usuario nunca pierda la noción de qué día o semana está manipulando:

```css
/* Curva Maestra de Aceleración Elástica */
transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
transition-duration: 280ms;
```

- **Propiedades Permitidas para Animación:** Estrictamente limitadas a `transform` y `opacity` para garantizar que la ejecución ocurra en el hilo del compositor de la GPU a **60/120 cuadros por segundo**.
- **Prohibición de Animaciones Pesadas:** No animar `width`, `height`, `margin` o `top` para evitar recálculos de renderizado (layout reflows).
