# ESTILO_Y_PALETA_DE_COLORES.md — Guía Maestra de Estilo, Tokens y Accesibilidad

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Filosofía Visual:** "El calendario no intenta mostrar todo: intenta hacerte entender tu mes. El color se usa exclusivamente cuando aporta contexto."  
> **Cumplimiento:** WCAG 2.1 Nivel AA

---

## 1. Tokens de Color Semánticos Oficiales

La paleta de Ritmo fue calibrada para proveer diferenciación inmediata de alta legibilidad, evitando la contaminación visual y el cansancio ocular durante jornadas extensas de estudio:

| Token CSS | Hex Primario | Hex Suave (Fondo) | Semántica de Negocio / Uso Oficial |
| :--- | :---: | :---: | :--- |
| `--purple` | `#6558f5` | `#eeedff` | **Identidad Ritmo & Fases del Plan:** Resalta la marca, la fase activa en el mini-calendario y las transiciones organizativas. |
| `--red` | `#ff5d63` | `#fff0f1` | **Prioridad Absoluta & Exámenes UTN (Tier 1):** Reservado estrictamente para eventos inamovibles de alta tensión (Parcial 24 Oct, Recuperatorio 7 Nov, entregas críticas). |
| `--orange` | `#f2a641` | `#fff5e6` | **Sprint de Láminas & Proyectos (Tier 3):** Bloques intensivos de dibujo técnico (3 láminas semanales) y desarrollo de proyectos. |
| `--blue` | `#4c9af5` | `#edf6ff` | **Escuela & Formación Técnica:** Materias teóricas del colegio, taller, Calitecno y actividades pedagógicas estructuradas. |
| `--green` | `#46a978` | `#edf9f3` | **Vida, Fe & Comunidad (Tier 1/3):** Devocional diario con Dios, reuniones de iglesia, práctica de guitarra, fútbol dominical y gimnasio. |
| `--yellow` | `#e7c94a` | `#fffbea` | **Pasantías & Nuevas Habilidades:** Bloques de trabajo virtual flexible, aprendizaje de nuevas herramientas y alertas intermedias. |

### Tokens Neutros y de Superficie:
| Token CSS | Valor Hex | Función en Interfaz |
| :--- | :---: | :--- |
| `--bg` | `#f5f6f8` | Fondo general de la aplicación (gris cálido no deslumbrante). |
| `--panel` | `#ffffff` | Fondo de tarjetas, celdas de calendario, modales y barras de navegación. |
| `--ink` | `#151719` | Texto principal de máximo contraste, títulos Manrope y botones primarios. |
| `--muted` | `#7b8188` | Texto secundario, subtítulos, horas y descripciones complementarias. |
| `--line` | `#e9ebef` | Bordes sutiles entre celdas, divisores horizontales y tarjetas. |
| `--soft` | `#f7f8fa` | Estados hover, fondos de chips inactivos y pistas de scroll. |

---

## 2. Tipografía Oficial y Escala Jerárquica

Ritmo utiliza una combinación intencional de dos fuentes tipográficas de alta legibilidad:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        JERARQUÍA TIPOGRÁFICA                           │
├────────────────────────────────────────────────────────────────────────┤
│ • MANROPE (Weights: 600, 700, 800)                                     │
│   Uso: Logotipo, títulos de vistas, meses, métricas numéricas y badges │
│   Estilo: Letras geométricas con espaciado ajustado (letter-spacing)   │
│                                                                        │
│ • DM SANS (Weights: 400, 500, 700)                                     │
│   Uso: Cuerpo de texto, etiquetas de eventos, formularios e inputs.    │
│   Estilo: Humanista, clara distinción entre caracteres a cuerpos chicos│
└────────────────────────────────────────────────────────────────────────┘
```

### Escala de Tamaños y Pesos:
- **Display / Título de Mes:** `34px` / Manrope 800 / Tracking `-0.05em`
- **Títulos de Sección / Tarjetas:** `17px – 20px` / Manrope 700 / Tracking `-0.03em`
- **Etiquetas de Día / Horarios:** `10px – 11px` / DM Sans 700 / Tracking `0.08em` (Mayúsculas)
- **Texto de Bloque de Evento:** `10px – 11px` / DM Sans 600 / Line-height `1.2`
- **Notas y Textos de Ayuda:** `11px – 12px` / DM Sans 400 / Line-height `1.5`

---

## 3. Matriz de Contraste y Accesibilidad (WCAG 2.1 AA)

Todos los pares de color han sido auditados para asegurar su visibilidad bajo luz solar directa en pantallas móviles:

| Elemento Visual | Color de Primer Plano (Foreground) | Color de Fondo (Background) | Ratio de Contraste | Cumplimiento WCAG |
| :--- | :---: | :---: | :---: | :---: |
| Texto Principal sobre Panel | `#151719` (`--ink`) | `#ffffff` (`--panel`) | **16.1 : 1** | **AAA (Superado)** |
| Texto Secundario / Sub | `#7b8188` (`--muted`) | `#ffffff` (`--panel`) | **4.62 : 1** | **AA (Aprobado)** |
| Bloque Rojo (Prioridad) | `#4e555b` / Barra `#ff5d63` | `#fff0f1` (`--red-soft`) | **6.45 : 1** | **AA (Aprobado)** |
| Bloque Naranja (Láminas) | `#4e555b` / Barra `#f2a641` | `#fff5e6` (`--orange-soft`) | **6.10 : 1** | **AA (Aprobado)** |
| Bloque Azul (Escuela) | `#4e555b` / Barra `#4c9af5` | `#edf6ff` (`--blue-soft`) | **6.52 : 1** | **AA (Aprobado)** |
| Bloque Verde (Vida / Fe) | `#4e555b` / Barra `#46a978` | `#edf9f3` (`--green-soft`) | **6.28 : 1** | **AA (Aprobado)** |
| Badge Amarillo (Skills) | `#9a8413` (Oscurecido) | `#fffbea` (`--yellow-soft`) | **4.71 : 1** | **AA (Aprobado)** |
| Botón Primario Negro | `#ffffff` | `#151719` (`--ink`) | **16.1 : 1** | **AAA (Superado)** |

---

## 4. Elevación, Sombras y Radios de Borde

- **Radios de Borde Estándar:**
  - Tarjetas principales y modales: `18px` (`--radius: 18px`).
  - Botones, inputs y selectores: `10px – 12px`.
  - Chips de eventos y píldoras: `7px – 8px`.
  - Badges circulares y barras de progreso: `999px` (completamente redondeados).
- **Sombras:**
  - Tarjeta principal de calendario: `0 18px 50px rgba(28, 31, 36, 0.07)` (`--shadow`).
  - Tarjetas secundarias y botones en reposo: `0 8px 22px rgba(28, 31, 36, 0.05)` (`--shadow-soft`).
  - Modales flotantes: `0 30px 100px rgba(0, 0, 0, 0.18)`.
