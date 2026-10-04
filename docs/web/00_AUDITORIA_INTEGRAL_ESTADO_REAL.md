# 00_AUDITORIA_INTEGRAL_ESTADO_REAL.md — Auditoría Técnica Línea por Línea del Prototipo Existente

> **Archivo Auditado:** `c:\Users\usuario\Documents\Calendario Pro\index.html`  
> **Longitud:** 483 líneas / 46.6 KB  
> **Fecha de Creación Original:** 27 de agosto de 2026  
> **Objetivo:** Análisis exhaustivo de arquitectura, dependencias, estilos, código JavaScript y limitaciones técnicas previas a la migración productiva.

---

## 1. Estructura General del Documento

El archivo `index.html` fue concebido como un prototipo monolítico autocontenido (HTML, CSS y JavaScript integrados en un solo documento):
- **Líneas 1 a 9:** Declaración de `<!DOCTYPE html>`, meta tags para viewport y precarga de fuentes externas desde Google Fonts (`DM Sans` y `Manrope`).
- **Líneas 10 a 117:** Bloque de estilos `<style>` con variables CSS nativas (`:root`), reglas de reseteo, layout en CSS Grid y Flexbox, y dos puntos de ruptura responsivos (`max-width: 1120px` y `max-width: 820px`).
- **Líneas 119 a 217:** Estructura del DOM HTML (`aside.sidebar`, `header.topbar`, `main.main` con `section.content` y `aside.right`, seguidos de contenedores flotantes para scrim, toast y modales).
- **Líneas 218 a 480:** Lógica JavaScript pura (vanilla JS) ejecutada en el ámbito global del navegador.

---

## 2. Auditoría Detallada de CSS y Sistema Visual

### 2.1. Tokens y Variables en `:root` (Líneas 11 a 33)
```css
:root {
  --bg: #f5f6f8;
  --panel: #ffffff;
  --ink: #151719;
  --muted: #7b8188;
  --line: #e9ebef;
  --soft: #f7f8fa;
  --purple: #6558f5;
  --purple-soft: #eeedff;
  --red: #ff5d63;
  --red-soft: #fff0f1;
  --orange: #f2a641;
  --orange-soft: #fff5e6;
  --blue: #4c9af5;
  --blue-soft: #edf6ff;
  --green: #46a978;
  --green-soft: #edf9f3;
  --yellow: #e7c94a;
  --yellow-soft: #fffbea;
  --shadow: 0 18px 50px rgba(28,31,36,.07);
  --shadow-soft: 0 8px 22px rgba(28,31,36,.05);
  --radius: 18px;
}
```
- **Fortalezas:** Excelente armonía tonal. Cada color de acento dispone de su variante `-soft` correspondiente con alta luminosidad, lo que permite crear fondos de bloque con contraste adecuado para el texto.
- **Deficiencias Detectadas:**
  - No existe soporte para tema oscuro (`prefers-color-scheme: dark`).
  - Las sombras usan valores alfa duros que pueden ralentizar el renderizado en teléfonos de gama baja sin aceleración gráfica dedicada.

### 2.2. Sistema de Maquetación (Grid y Media Queries)
- **Línea 39:** `.app { min-height: 100vh; display: grid; grid-template-columns: 248px minmax(0,1fr); grid-template-rows: 72px 1fr }`
  - La aplicación fue diseñada con una mentalidad estrictamente orientada al monitor de escritorio.
- **Línea 98:** `@media (max-width: 820px)`
  - En móviles transforma el sidebar en un menú lateral oculto (`transform: translateX(-100%)`).
  - **Problema de Usabilidad Móvil:** Al ocultar el sidebar, el usuario pierde el acceso directo a la leyenda y al mini-calendario. Además, la grilla del mes fuerza un `min-width: 640px` (Línea 110), provocando que en pantallas de 390px el usuario deba hacer scroll horizontal engorroso.

---

## 3. Auditoría de Lógica JavaScript y Estado

### 3.1. Estado Global y Gestión de Fechas (Líneas 219 a 226)
- **Línea 221:** `const today = new Date(2026, 7, 27);`
  - La fecha actual está **congelada artificialmente** en el 27 de agosto de 2026. No toma la fecha real del sistema operativo ni la zona horaria del usuario.
- **Línea 222:** `let cursor = new Date(2026, 8, 1);`
  - El mes cursor arranca forzado en septiembre.
- **Líneas 225-226:** Uso exclusivo de `localStorage` (`ritmo-events`, `ritmo-removed`, `ritmo-focus`).
  - No existe comunicación con ningún servidor, base de datos ni API externa. Si el usuario ingresa desde otro navegador o borra las cookies, el calendario regresa al estado inicial.

### 3.2. Catálogo de Eventos Base en Memoria (Líneas 227 a 264)
- Contiene 37 eventos hardcodeados correspondientes a finales de agosto y septiembre de 2026.
- Refleja acertadamente las prioridades reales de Lucas (UTN matemática, Dibujo Técnico Láminas 1 a 16, Inglés, Iglesia/Célula, Guitarra), pero carece de flexibilidad para fechas dinámicas, duraciones variables o tareas de Google Classroom.

### 3.3. Rendimiento y Manipulación del DOM (Líneas 285 a 350)
- La función maestra `render()` (Línea 285) invoca destructivamente `.innerHTML = ''` en cada cambio de vista o navegación de mes.
- Esto elimina y recrea cientos de nodos del DOM en cada clic, perdiendo el foco de accesibilidad, anulando transiciones fluidas y consumiendo batería innecesariamente en teléfonos celulares.

---

## 4. Auditoría de Accesibilidad (A11y) y Atajos

- **Línea 478:** Atajos de teclado para escritorio (`+` para modal, `1`, `2`, `3` para vistas, `Escape` para cerrar).
- **Carencia Crítica:** En dispositivos táctiles móviles, los atajos de teclado no están disponibles y la interfaz carece de gestos táctiles directos (*swipe left/right* para cambiar de mes, o *drag-and-drop* para mover bloques de hora).

---

## 5. Dictamen Técnico Global de la Auditoría

| Criterio | Calificación (1 a 10) | Diagnóstico |
| :--- | :---: | :--- |
| **Identidad Visual & Estilo** | **9.5** | Excelente paleta cromática, tipografías sólidas y balance estético. |
| **Ergonomía Móvil** | **4.0** | Requiere scroll horizontal forzado en móvil; sidebar oculta; sin gestos táctiles. |
| **Persistencia & Backend** | **2.0** | Solo `localStorage` en un único cliente; sin sincronización multi-dispositivo. |
| **Inteligencia & Automatización**| **1.0** | Cero automatización; no hay integración con Telegram, Classroom ni IA. |
| **Mantenibilidad del Código**| **3.5** | Código monolítico en un único archivo de 483 líneas sin módulos ni tipos. |

**Conclusión:** El prototipo `index.html` es una magnífica base conceptual de diseño, pero requiere evolucionar hacia la arquitectura en Next.js 14 y Supabase documentada en la suite oficial.
