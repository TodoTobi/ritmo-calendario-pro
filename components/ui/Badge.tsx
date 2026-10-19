import React from 'react';
import { EventTier, EventColor } from '@/types/database.types';
import { EVENT_COLOR_MAP, TIER_CONFIG } from '@/lib/color-tokens';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'tier' | 'color' | 'neutral' | 'outline' | 'orange' | 'blue' | 'green' | 'gold' | 'mint';
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
    xs: 'text-[10px] px-2 py-0.5 font-medium',
    sm: 'text-[11px] px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-semibold',
  }[size];

  if (variant === 'orange') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-[6px] bg-family-orange/10 text-family-orange border border-family-orange/20 ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'blue') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-[6px] bg-family-blue/10 text-family-blue border border-family-blue/20 ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'green' || variant === 'mint') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-[6px] bg-family-green/10 text-family-green border border-family-green/20 ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'gold') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-[6px] bg-family-honey/20 text-family-gold border border-family-honey/30 ${sizeClasses} ${className}`}
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
        className={`inline-flex items-center gap-1.5 rounded-[6px] ${sizeClasses} ${
          isTier1
            ? 'bg-family-red/10 text-family-red border border-family-red/20'
            : tier === 'tier_2'
            ? 'bg-family-blue/10 text-family-blue border border-family-blue/20'
            : 'bg-family-green/10 text-family-green border border-family-green/20'
        } ${className}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: isTier1 ? '#ff2b3a' : tier === 'tier_2' ? '#0086fc' : '#00c978' }}
        />
        {children || config.tag}
      </span>
    );
  }

  if (variant === 'color' && color) {
    const colorScheme = EVENT_COLOR_MAP[color];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-[6px] ${sizeClasses} ${colorScheme.bg} ${colorScheme.text} border ${colorScheme.border}/30 ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[6px] bg-family-stone text-family-charcoal border border-family-stone ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
