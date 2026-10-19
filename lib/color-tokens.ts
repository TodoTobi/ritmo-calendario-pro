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
    bg: 'bg-[#524ae9]/10',
    border: 'border-[#524ae9]',
    text: 'text-[#524ae9]',
    accent: '#524ae9', // Plasma Violet
    lightBg: 'bg-[#524ae9]/10',
  },
  red: {
    bg: 'bg-[#fc5000]/15',
    border: 'border-[#fc5000]',
    text: 'text-[#fc5000]',
    accent: '#fc5000', // Ember
    lightBg: 'bg-[#fc5000]/15',
  },
  orange: {
    bg: 'bg-[#fc5000]/10',
    border: 'border-[#fc5000]',
    text: 'text-[#d44300]',
    accent: '#fc5000', // Ember
    lightBg: 'bg-[#fc5000]/10',
  },
  blue: {
    bg: 'bg-[#524ae9]/10',
    border: 'border-[#524ae9]',
    text: 'text-[#524ae9]',
    accent: '#524ae9', // Plasma Violet
    lightBg: 'bg-[#524ae9]/10',
  },
  green: {
    bg: 'bg-[#2f855a]/10',
    border: 'border-[#2f855a]',
    text: 'text-[#236846]',
    accent: '#2f855a',
    lightBg: 'bg-[#2f855a]/10',
  },
  yellow: {
    bg: 'bg-[#f5f28e]',
    border: 'border-[#d4d168]',
    text: 'text-[#070607]',
    accent: '#070607', // Sulfur with Obsidian text
    lightBg: 'bg-[#f5f28e]',
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
