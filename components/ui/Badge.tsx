import React from 'react';
import { EventTier, EventColor } from '@/types/database.types';
import { EVENT_COLOR_MAP, TIER_CONFIG } from '@/lib/color-tokens';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'tier' | 'color' | 'neutral' | 'outline' | 'sulfur' | 'ember' | 'plasma';
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
    xs: 'text-[9px] px-2 py-0.5 tracking-wider font-semibold',
    sm: 'text-[11px] px-2.5 py-0.5 tracking-wider font-bold',
    md: 'text-xs px-3 py-1 font-bold',
  }[size];

  if (variant === 'sulfur') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-caldera-sulfur text-caldera-obsidian border border-caldera-obsidian/20 uppercase ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'ember') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-caldera-ember text-caldera-obsidian border border-caldera-obsidian/20 uppercase ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'plasma') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-caldera-plasma text-caldera-chalk uppercase ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'tier' && tier) {
    const config = TIER_CONFIG[tier];
    const isTier1 = tier === 'tier_1';
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full uppercase ${sizeClasses} ${
          isTier1
            ? 'bg-caldera-ember text-caldera-obsidian border border-caldera-obsidian/30'
            : tier === 'tier_2'
            ? 'bg-caldera-plasma/15 text-caldera-plasma border border-caldera-plasma/30'
            : 'bg-caldera-sulfur text-caldera-obsidian border border-caldera-obsidian/20'
        } ${className}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: isTier1 ? '#fc5000' : tier === 'tier_2' ? '#524ae9' : '#070607' }}
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
      className={`inline-flex items-center gap-1 rounded-full bg-caldera-pumice text-caldera-obsidian border border-caldera-obsidian/15 ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
