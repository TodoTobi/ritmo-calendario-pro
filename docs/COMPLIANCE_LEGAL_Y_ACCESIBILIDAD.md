# COMPLIANCE_LEGAL_Y_ACCESIBILIDAD.md — Privacidad, Seguridad de Datos & Accesibilidad

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Modelo de Gobernanza:** Datos Soberanos Monousuario & Zero-Telemetry Comercial  
> **Estándar de Accesibilidad:** W3C WCAG 2.1 Nivel AA

---

## 1. Privacidad de Datos y Soberanía Personal

Ritmo fue concebido bajo el principio de **Privacidad por Diseño (Privacy by Design)**:
1. **Ausencia de Telemetría Comercial:** La aplicación no incluye trackers de publicidad, píxeles de Meta, Google Analytics ni scripts de seguimiento de terceros.
2. **Tratamiento de Audios e Imágenes en Google AI Studio:**  
   Las notas de voz y fotografías de apuntes enviadas a través de Gemini 2.0 Flash se procesan a través de los endpoints de la API de Google AI Studio con cifrado en tránsito (TLS 1.3). No se almacenan archivos binarios de audio en la base de datos de Ritmo una vez completada la extracción.
3. **Aislamiento Monousuario:** Todos los registros están asociados a una clave privada única del propietario (`RITMO_MASTER_TOKEN`), blindados mediante políticas RLS en PostgreSQL.

---

## 2. Alcance Mínimo de Permisos OAuth2 (Least Privilege Scopes)

La integración con el ecosistema de Google solicita estrictamente los permisos necesarios para operar, evitando accesos intrusivos a correos o contactos personales:

| API de Google | Scope Solicitado | Justificación Operativa |
| :--- | :--- | :--- |
| **Classroom** | `https://www.googleapis.com/auth/classroom.courses.readonly` | Lectura exclusiva de la lista de cursos activos en los que el usuario está matriculado. |
| **Classroom** | `https://www.googleapis.com/auth/classroom.coursework.me.readonly` | Lectura de tareas asignadas al usuario y sus fechas límites oficiales de entrega. |
| **Drive** | `https://www.googleapis.com/auth/drive.file` | Acceso **única y exclusivamente** a los archivos y carpetas creados por la aplicación Ritmo (`/Ritmo_UTN_Notes/`). No permite leer otros documentos privados del Google Drive del usuario. |

---

## 3. Accesibilidad Universal (WCAG 2.1 Nivel AA)

### 3.1. Ratios de Contraste Cromático
Todas las interfaces cumplen el criterio de éxito 1.4.3 de las WCAG (contraste mínimo de 4.5:1 para texto normal y 3:1 para elementos de interfaz de usuario de gran tamaño).

### 3.2. Navegación Asistida por Teclado
Ritmo soporta control total sin ratón ni pantalla táctil mediante atajos directos:
- Tecla `1`: Cambiar inmediatamente a vista **Mes**.
- Tecla `2`: Cambiar a vista **Semana**.
- Tecla `3`: Cambiar a vista **Día / Timeline**.
- Tecla `+`: Abrir el modal de creación rápida de evento.
- Tecla `Escape`: Cerrar cualquier modal o menú lateral activo.
- Teclas `Flecha Izquierda / Derecha`: Navegar al período anterior o siguiente.

### 3.3. Marcado Semántico & Soporte para Lectores de Pantalla (ARIA)
- Uso de elementos semánticos nativos de HTML5: `<header>`, `<main>`, `<aside>`, `<nav>`, `<section>`.
- Todos los botones que contienen únicamente iconos (`+`, `≡`, `⌕`, `‹`, `›`) disponen de atributos `aria-label` descriptivos en español (ej. `aria-label="Agregar nuevo bloque"`, `aria-label="Mes anterior"`).
- Atributos `aria-current="date"` sobre la celda del día actual en la grilla mensual.

---

## 4. Portabilidad y Exportación de Datos

En cumplimiento del derecho a la portabilidad de datos personales:
1. **Exportación iCalendar (.ics):** Permite descargar un archivo `.ics` estándar compatible con Google Calendar, Apple Calendar y Outlook con todos los eventos registrados.
2. **Volcado Completo JSON:** Desde la pantalla de ajustes, el usuario puede generar con un solo clic un archivo `ritmo_export.json` que contiene todos sus eventos, notas, plantillas y registros de Classroom.
