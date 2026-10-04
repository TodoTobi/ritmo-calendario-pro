import { EventColor, EventTier } from '@/types/database.types';

export interface ColorScheme {
  bg: string;
  border: string;
  text: string;
  accent: string;
  lightBg: string;
}

export const EVENT_COLOR_MAP: Record<EventColor, ColorScheme> = {
  purple: {
    bg: 'bg-[#eeedff]',
    border: 'border-[#6558f5]',
    text: 'text-[#6558f5]',
    accent: '#6558f5',
    lightBg: '#eeedff',
  },
  red: {
    bg: 'bg-[#fff0f1]',
    border: 'border-[#ff5d63]',
    text: 'text-[#ff5d63]',
    accent: '#ff5d63',
    lightBg: '#fff0f1',
  },
  orange: {
    bg: 'bg-[#fff5e6]',
    border: 'border-[#f2a641]',
    text: 'text-[#f2a641]',
    accent: '#f2a641',
    lightBg: '#fff5e6',
  },
  blue: {
    bg: 'bg-[#edf6ff]',
    border: 'border-[#4c9af5]',
    text: 'text-[#4c9af5]',
    accent: '#4c9af5',
    lightBg: '#edf6ff',
  },
  green: {
    bg: 'bg-[#edf9f3]',
    border: 'border-[#46a978]',
    text: 'text-[#46a978]',
    accent: '#46a978',
    lightBg: '#edf9f3',
  },
  yellow: {
    bg: 'bg-[#fffbea]',
    border: 'border-[#e7c94a]',
    text: 'text-[#9a8413]',
    accent: '#e7c94a',
    lightBg: '#fffbea',
  },
};

export const TIER_CONFIG: Record<
  EventTier,
  { label: string; tag: string; isMovable: boolean; defaultColor: EventColor; description: string }
> = {
  tier_1: {
    label: 'Tier 1 — Inamovible',
    tag: 'T1',
    isMovable: false,
    defaultColor: 'red',
    description: 'Bloque sagrado protegido: Devocional, UTN, Iglesia, Inglés',
  },
  tier_2: {
    label: 'Tier 2 — Movible',
    tag: 'T2',
    isMovable: true,
    defaultColor: 'blue',
    description: 'Bloque escolar, pasantías y compromisos reorganizables',
  },
  tier_3: {
    label: 'Tier 3 — Hábito / Carga',
    tag: 'T3',
    isMovable: true,
    defaultColor: 'orange',
    description: 'Láminas de dibujo, gimnasio, proyectos y repaso flexible',
  },
};
