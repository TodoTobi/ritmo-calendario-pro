# ANOTACIONES.md — Sistema Híbrido de Notas & Integración con NotebookLM

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Módulo:** Anotador Híbrido y Pipeline de Estudio UTN  
> **Destino Externo:** Google Drive (`/Ritmo_UTN_Notes/`) & Google NotebookLM

---

## 1. El Paradigma de Notas Híbridas de Ritmo

La mayoría de los sistemas de notas fracasan por aislamiento: las notas quedan en una aplicación desconectada del momento en que deben ejecutarse. Ritmo implementa un **modelo híbrido de dos vías**:

```
                              ┌───────────────────────────────┐
                              │      ANOTADOR RITMO           │
                              └──────────────┬────────────────┘
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
        ┌────────────────────────────┐                ┌────────────────────────────┐
        │   NOTAS CONTEXTUALES DÍA   │                │     BACKLOG DE IDEAS       │
        │ • Vinculadas a una fecha   │                │ • Ideas atómicas libres    │
        │ • Ancladas a un bloque     │                │ • Sin fecha fija requerida │
        │ • Checklist de materiales  │                │ • Etiquetas temáticas (#)  │
        └────────────────────────────┘                └──────────────┬─────────────┘
                                                                     │
                                                              (Etiqueta #utn)
                                                                     │
                                                                     ▼
                                                      ┌────────────────────────────┐
                                                      │    GOOGLE DRIVE PIPELINE   │
                                                      │  Carpeta /Ritmo_UTN_Notes/ │
                                                      │    Archivos Markdown .md   │
                                                      └──────────────┬─────────────┘
                                                                     │
                                                                     ▼
                                                      ┌────────────────────────────┐
                                                      │     GOOGLE NOTEBOOKLM      │
                                                      │  Generación de Guías,      │
                                                      │  Flashcards y Audio Pod    │
                                                      └────────────────────────────┘
```

---

## 2. Taxonomía de Etiquetas y Almacenamiento

Toda nota creada en el backlog o extraída mediante Telegram se categoriza bajo una taxonomía predefinida:

| Etiqueta | Color Asociado | Propósito / Ámbito | Pipeline Activo |
| :--- | :---: | :--- | :---: |
| `#utn` | `--red` (`#ff5d63`) | Ejercicios de física, matemáticas, fórmulas y dudas de clase para el ingreso a la UTN. | **Sincronización automática con Google Drive** |
| `#dibujo` | `--orange` (`#f2a641`) | Lista de materiales, observaciones de profesores sobre láminas y cotas técnicas. | Base de datos local Supabase |
| `#devocional` | `--green` (`#46a978`) | Pasajes bíblicos, reflexiones espirituales matutinas y motivos de oración. | Base de datos local Supabase |
| `#proyectos` | `--purple` (`#6558f5`) | Ideas de desarrollo de software, arquitectura de IA y nuevas aplicaciones. | Base de datos local Supabase |
| `#general` | `--blue` (`#4c9af5`) | Recordatorios varios, compras y trámites personales. | Base de datos local Supabase |

---

## 3. Pipeline de Sincronización con Google Drive & Google NotebookLM

### 3.1. Sincronización Automática
Cuando el usuario guarda una nota con la etiqueta `#utn` (o envía una foto de un pizarrón de UTN que es transcrita por Gemini 2.0 Flash):
1. El backend de Ritmo genera un archivo Markdown limpio con metadatos YAML frontmatter:
   ```markdown
   ---
   title: "UTN Ingreso — Repaso de Geometría y Vectores"
   date: "2026-10-04"
   source: "Ritmo AI OCR / Telegram"
   tags: ["utn", "matematica", "parcial_2"]
   ---
   
   # Ejercicios Resueltos y Dudas de Clase
   - Producto escalar entre vectores en R3.
   - Ecuación de la recta en el plano.
   ```
2. Invoca la Google Drive API para insertar o actualizar el archivo dentro del directorio `/Ritmo_UTN_Notes/`.

### 3.2. Consumo en Google NotebookLM
Google NotebookLM monitorea dicha carpeta de Google Drive como **fuente viva de conocimiento**. Antes del **Parcial 2 (24 de Octubre)** y el **Recuperatorio (7 de Noviembre)**, el usuario puede:
- Generar un **Audio Overview** (resumen conversacional en podcast) de todas las dudas acumuladas en la semana.
- Crear **Guías de Estudio Instantáneas** y cuestionarios tipo test sobre los teoremas anotados.
- Detectar vacíos conceptuales analizando las notas de los sábados de cursada.

---

## 4. Experiencia de Usuario: Drawer y Editor de Notas

- **Acceso Rápido:** Deslizando desde el borde lateral derecho o pulsando la pestaña *Notas* en la barra inferior.
- **Editor Ultraliviano:** Soporte de listas de verificación (`[ ] Tarea`), negritas y títulos sin la sobrecarga de un editor WYSIWYG pesado.
- **Filtro Rápido:** Barra de chips superiores con conteo de notas (`Todos (14)`, `#utn (6)`, `#dibujo (3)`, `#devocional (5)`).
