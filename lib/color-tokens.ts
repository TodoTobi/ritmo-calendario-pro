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
    bg: 'bg-[#000437]/10',
    border: 'border-[#000437]',
    text: 'text-[#000437]',
    accent: '#000437', // Night Ink
    lightBg: 'bg-[#000437]/10',
  },
  red: {
    bg: 'bg-[#ff4b4b]/15',
    border: 'border-[#ff4b4b]',
    text: 'text-[#ea2b2b]',
    accent: '#ff4b4b', // Duolingo Red
    lightBg: 'bg-[#ff4b4b]/15',
  },
  orange: {
    bg: 'bg-[#ff9600]/15',
    border: 'border-[#ff9600]',
    text: 'text-[#e58000]',
    accent: '#ff9600', // Duolingo Orange Streak
    lightBg: 'bg-[#ff9600]/15',
  },
  blue: {
    bg: 'bg-[#1cb0f6]/15',
    border: 'border-[#1cb0f6]',
    text: 'text-[#1899d6]',
    accent: '#1cb0f6', // Spark Blue
    lightBg: 'bg-[#1cb0f6]/15',
  },
  green: {
    bg: 'bg-[#58cc02]/15',
    border: 'border-[#58cc02]',
    text: 'text-[#46a302]',
    accent: '#58cc02', // Eager Green
    lightBg: 'bg-[#d7ffb8]', // Storybook Green
  },
  yellow: {
    bg: 'bg-[#ffc800]/20',
    border: 'border-[#e5b400]',
    text: 'text-[#b88c00]',
    accent: '#ffc800', // Gold Gem
    lightBg: 'bg-[#fff9db]',
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
    defaultColor: 'red', // Alert Red / Night Ink
    description: 'Bloque sagrado protegido: Devocional, UTN, Iglesia, Inglés',
  },
  tier_2: {
    label: 'Tier 2 — Movible',
    tag: 'T2',
    isMovable: true,
    defaultColor: 'blue', // Spark Blue
    description: 'Bloque escolar, pasantías y compromisos reorganizables',
  },
  tier_3: {
    label: 'Tier 3 — Hábito / Carga',
    tag: 'T3',
    isMovable: true,
    defaultColor: 'green', // Eager Green
    description: 'Láminas de dibujo, gimnasio, proyectos y repaso flexible',
  },
};
