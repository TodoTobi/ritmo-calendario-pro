# 06_SISTEMA_DE_DISENO_UI_KIT.md — UI Kit, Configuración Tailwind & Biblioteca de Componentes

> **Proyecto:** Ritmo — Calendario & Anotador Personal Inteligente  
> **Framework de Estilos:** Tailwind CSS v3.4+ & Headless UI  
> **Iconografía:** Lucide React (SVG ultraliviano, trazo 1.75px)

---

## 1. Configuración de Tailwind CSS (`tailwind.config.ts`)

La configuración enlaza los tokens cromáticos definidos en `:root` para asegurar interoperabilidad absoluta entre CSS nativo y utilidades de Tailwind:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#f5f6f8',
        panel: '#ffffff',
        ink: '#151719',
        muted: '#7b8188',
        line: '#e9ebef',
        soft: '#f7f8fa',
        purple: {
          DEFAULT: '#6558f5',
          soft: '#eeedff',
        },
        red: {
          DEFAULT: '#ff5d63',
          soft: '#fff0f1',
        },
        orange: {
          DEFAULT: '#f2a641',
          soft: '#fff5e6',
        },
        blue: {
          DEFAULT: '#4c9af5',
          soft: '#edf6ff',
        },
        green: {
          DEFAULT: '#46a978',
          soft: '#edf9f3',
        },
        yellow: {
          DEFAULT: '#e7c94a',
          soft: '#fffbea',
        },
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-manrope)', 'sans-serif'],
      },
      boxShadow: {
        card: '0 18px 50px rgba(28, 31, 36, 0.07)',
        soft: '0 8px 22px rgba(28, 31, 36, 0.05)',
        modal: '0 30px 100px rgba(0, 0, 0, 0.18)',
      },
      borderRadius: {
        card: '18px',
        input: '10px',
        pill: '999px',
      },
      animation: {
        pop: 'pop 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
      },
      keyframes: {
        pop: {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 2. Planos de Implementación de Componentes Clave (React + Tailwind)

### 2.1. Componente Píldora de Evento (`EventPill.tsx`)
```tsx
import React from 'react';
import { clsx } from 'clsx';

interface EventPillProps {
  title: string;
  color: 'red' | 'orange' | 'blue' | 'green' | 'yellow' | 'purple';
  onClick?: () => void;
}

const colorMap = {
  red: 'bg-red-soft text-[#4e555b] border-transparent hover:border-red/20',
  orange: 'bg-orange-soft text-[#4e555b] border-transparent hover:border-orange/20',
  blue: 'bg-blue-soft text-[#4e555b] border-transparent hover:border-blue/20',
  green: 'bg-green-soft text-[#4e555b] border-transparent hover:border-green/20',
  yellow: 'bg-yellow-soft text-[#4e555b] border-transparent hover:border-yellow/20',
  purple: 'bg-purple-soft text-[#4e555b] border-transparent hover:border-purple/20',
};

const barMap = {
  red: 'bg-red',
  orange: 'bg-orange',
  blue: 'bg-blue',
  green: 'bg-green',
  yellow: 'bg-yellow',
  purple: 'bg-purple',
};

export const EventPill: React.FC<EventPillProps> = ({ title, color, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'flex items-center gap-[7px] w-full px-[6px] py-[5px] my-[3px] rounded-[7px] text-[10px] leading-tight font-medium cursor-pointer transition-all duration-200 select-none overflow-hidden truncate border',
        'hover:translate-x-[2px] hover:bg-white',
        colorMap[color]
      )}
    >
      <span className={clsx('w-[3px] h-[18px] rounded-full shrink-0', barMap[color])} />
      <span className="truncate">{title}</span>
    </div>
  );
};
```

### 2.2. Componente de Botón de Acción Flotante (`FloatingActionButton.tsx`)
```tsx
import React from 'react';
import { Plus } from 'lucide-react';

interface FABProps {
  onClick: () => void;
  ariaLabel?: string;
}

export const FloatingActionButton: React.FC<FABProps> = ({ onClick, ariaLabel = "Agregar nuevo bloque" }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className="fixed bottom-[84px] right-[20px] md:bottom-[28px] md:right-[28px] w-[52px] h-[52px] rounded-full bg-ink text-white shadow-card flex items-center justify-center transition-transform duration-200 hover:scale-105 active:scale-95 z-30 focus:outline-none focus:ring-4 focus:ring-purple-soft"
    >
      <Plus size={24} strokeWidth={2.5} />
    </button>
  );
};
```

---

## 3. Catálogo de Iconos Oficiales (Lucide React)

Para mantener el bundle de producción liviano, se especifican únicamente los iconos aprobados:
- **`Calendar` / `Grid`:** Indicador de vista mensual.
- **`Clock`:** Indicador de vista de línea de tiempo diaria.
- **`CheckCircle2`:** Tareas y confirmaciones.
- **`AlertTriangle`:** Advertencias de colisión y sobrecarga.
- **`FileText`:** Notas del día y apuntes de clase.
- **`Sparkles`:** Acciones asistidas por Gemini 2.0 Flash.
- **`ChevronLeft` / `ChevronRight`:** Navegación entre meses y semanas.
- **`Search`:** Disparador del overlay de búsqueda.
- **`Sliders`:** Ajustes y alternancia del modo foco.
