# 01_ESTRATEGIA_Y_RELEVAMIENTO.md — Estrategia Móvil, Ergonomía Táctil & Breakpoints

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Área:** Experiencia de Usuario Web & PWA  
> **Premisa Central:** El 85% de las interacciones de Lucas ocurrirán en un smartphone sostenido con una sola mano en movimiento.

---

## 1. La Estrategia Mobile-First en Ritmo

A diferencia del enfoque tradicional de "diseñar para monitor y luego achicar para celular", la estrategia de Ritmo parte de las limitaciones físicas del dispositivo móvil:
1. **Área de Alcance del Pulgar (Thumb Zone):**  
   Los elementos de interacción crítica (cambio de vistas, botón de agregar, confirmaciones y arrastre de bloques) se ubican en la mitad inferior de la pantalla. La parte superior se reserva para indicadores informativos de baja interacción (nombre del mes, fases del plan).
2. **Cero Scroll Horizontal:**  
   La vista mensual y la agenda diaria se ajustan de manera fluida al 100% del ancho del viewport (`width: 100%`), eliminando los desbordes horizontales presentes en prototipos antiguos.
3. **Respuesta Táctil Inmediata:**  
   Uso de eventos de puntero (`pointerdown`, `pointermove`, `pointerup`) con supresión de retrasos de toque (`touch-action: pan-y`) para una respuesta de 0ms.

---

## 2. Definición Oficial de Breakpoints y Dispositivos de Prueba

| Breakpoint | Ancho Mínimo / Rango | Dispositivos de Referencia | Comportamiento del Layout |
| :--- | :--- | :--- | :--- |
| **`xs` (Compacto)** | `360px – 389px` | iPhone SE, Galaxy A-series | Grilla mensual compacta (celdas de 48px), agenda vertical continua, navegación fija inferior. |
| **`sm` (Móvil Estándar)**| `390px – 429px` | iPhone 14/15/16, Pixel 8, Galaxy S24 | Grilla con texto de 10px en píldoras, cabecera mensual colapsable con tira semanal. |
| **`md` (Tablet / Plegable)**| `430px – 768px` | iPad Mini, Galaxy Fold desplegado | Vista de 2 columnas opcional: grilla mensual a la izquierda y agenda del día a la derecha. |
| **`lg` (Desktop / Laptop)**| `1024px+` | Monitor de escritorio / MacBook | Sidebar lateral fija con mini-calendario y leyenda completa (layout expandido). |

---

## 3. Patrones de Interacción Móvil Oficiales

```
┌────────────────────────────────────────────────────────┐
│             ZONAS ERGONÓMICAS EN PANTALLA MÓVIL        │
├────────────────────────────────────────────────────────┤
│ [Zona Difícil]   Nombre de Mes / Indicador de Batería  │
│                                                        │
│ [Zona Cómoda]    Grilla Calendario / Feed de Eventos   │
│                                                        │
│ [Zona Natural]   Línea de Tiempo Táctil (Drag & Drop)  │
│ [Pulgar Derecho] Barra de Navegación Inferior + FAB (+)│
└────────────────────────────────────────────────────────┘
```

### 3.1. Modal Bottom Sheet Deslizable
- En lugar de modales centrados flotantes de escritorio (difíciles de alcanzar en pantallas altas), todos los formularios de creación y confirmación se abren como **Bottom Sheets** ancladas a la base de la pantalla.
- Se pueden cerrar deslizando hacia abajo con el dedo (*swipe down*) o pulsando el área exterior atenuada.

### 3.2. Línea de Tiempo Táctil Drag-and-Drop
- Arrastre vertical continuo con paso magnético de 15 minutos.
- Durante el arrastre, el scroll nativo de la página se congela temporalmente (`touch-action: none`) para evitar saltos accidentales de la pantalla.
- Activación mediante pulsación sostenida (250ms) para no interferir con el scroll vertical de lectura.

---

## 4. Estrategia de Resiliencia Offline (PWA)

1. **Service Worker Ligero:** Almacena en la Cache API los activos estáticos del frontend (HTML shell, CSS compilado, fuentes locales Manrope y DM Sans).
2. **Caché de Datos en IndexedDB:** Las últimas 4 semanas de eventos y notas se guardan en el almacenamiento local del teléfono. Si el usuario pierde señal en el colectivo, la aplicación carga de inmediato en modo de solo lectura y encola mutaciones pendientes para sincronizarlas al recuperar conexión.
