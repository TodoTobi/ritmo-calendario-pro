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
    bg: 'bg-[#9f4fff]/10',
    border: 'border-[#9f4fff]',
    text: 'text-[#9f4fff]',
    accent: '#9f4fff', // Plum Violet
    lightBg: 'bg-[#9f4fff]/10',
  },
  red: {
    bg: 'bg-[#ff2b3a]/10',
    border: 'border-[#ff2b3a]',
    text: 'text-[#d71927]',
    accent: '#ff2b3a', // Alert Red
    lightBg: 'bg-[#ff2b3a]/10',
  },
  orange: {
    bg: 'bg-[#ff3e00]/10',
    border: 'border-[#ff3e00]',
    text: 'text-[#d63400]',
    accent: '#ff3e00', // Ember Orange
    lightBg: 'bg-[#ff3e00]/10',
  },
  blue: {
    bg: 'bg-[#0086fc]/10',
    border: 'border-[#0086fc]',
    text: 'text-[#0086fc]',
    accent: '#0086fc', // Link Blue
    lightBg: 'bg-[#0086fc]/10',
  },
  green: {
    bg: 'bg-[#00c978]/15',
    border: 'border-[#00c978]',
    text: 'text-[#009b5c]',
    accent: '#00c978', // Grass Green
    lightBg: 'bg-[#00c978]/15',
  },
  yellow: {
    bg: 'bg-[#ffbb26]/20',
    border: 'border-[#d48f00]',
    text: 'text-[#9e6b00]',
    accent: '#ffbb26', // Honey / Gold
    lightBg: 'bg-[#ffbb26]/20',
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
    defaultColor: 'red', // Alert Red
    description: 'Bloque sagrado protegido: Devocional, UTN, Iglesia, Inglés',
  },
  tier_2: {
    label: 'Tier 2 — Movible',
    tag: 'T2',
    isMovable: true,
    defaultColor: 'blue', // Link Blue
    description: 'Bloque escolar, pasantías y compromisos reorganizables',
  },
  tier_3: {
    label: 'Tier 3 — Hábito / Carga',
    tag: 'T3',
    isMovable: true,
    defaultColor: 'green', // Grass Green
    description: 'Láminas de dibujo, gimnasio, proyectos y repaso flexible',
  },
};
