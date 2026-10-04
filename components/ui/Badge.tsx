import React from 'react';
import { EventTier, EventColor } from '@/types/database.types';
import { EVENT_COLOR_MAP, TIER_CONFIG } from '@/lib/color-tokens';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'tier' | 'color' | 'neutral' | 'outline';
  tier?: EventTier;
  color?: EventColor;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  tier,
  color,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = {
    xs: 'text-[9px] px-1.5 py-0.5 tracking-wide font-semibold',
    sm: 'text-[10px] px-2 py-0.5 tracking-wider font-bold',
    md: 'text-xs px-2.5 py-1 font-bold',
  }[size];

  if (variant === 'tier' && tier) {
    const config = TIER_CONFIG[tier];
    const colorScheme = EVENT_COLOR_MAP[config.defaultColor];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full uppercase ${sizeClasses} ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}/30 ${className}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: colorScheme.accent }}
        />
        {children || config.tag}
      </span>
    );
  }

  if (variant === 'color' && color) {
    const colorScheme = EVENT_COLOR_MAP[color];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full ${sizeClasses} ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}/30 ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-ritmo-soft text-ritmo-ink border border-ritmo-line ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
