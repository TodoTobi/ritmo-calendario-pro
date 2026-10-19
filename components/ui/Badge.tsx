import React from 'react';
import { EventTier, EventColor } from '@/types/database.types';
import { EVENT_COLOR_MAP, TIER_CONFIG } from '@/lib/color-tokens';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'tier' | 'color' | 'neutral' | 'outline' | 'grass' | 'sky' | 'coral' | 'sunshine';
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
    xs: 'text-[10px] px-2 py-0.5 font-extrabold uppercase tracking-wide',
    sm: 'text-[11px] px-2.5 py-0.5 font-extrabold uppercase tracking-wider',
    md: 'text-xs px-3 py-1 font-extrabold uppercase tracking-wider',
  }[size];

  if (variant === 'grass') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-xl bg-duo-green-light text-duo-green border-2 border-duo-green ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'sky') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-xl bg-[#ddf4ff] text-duo-blue border-2 border-duo-blue ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'coral') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-xl bg-[#ffebee] text-duo-red border-2 border-[#ff4b4b] ${sizeClasses} ${className}`}
      >
        {children}
      </span>
    );
  }

  if (variant === 'sunshine') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-xl bg-[#fff9db] text-[#b88c00] border-2 border-[#ffc800] ${sizeClasses} ${className}`}
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
        className={`inline-flex items-center gap-1.5 rounded-xl border-2 ${sizeClasses} ${
          isTier1
            ? 'bg-[#ffebee] text-[#ea2b2b] border-[#ff4b4b]'
            : tier === 'tier_2'
            ? 'bg-[#ddf4ff] text-duo-blue border-duo-blue'
            : 'bg-duo-green-light text-duo-green border-duo-green'
        } ${className}`}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: isTier1 ? '#ff4b4b' : tier === 'tier_2' ? '#1cb0f6' : '#58cc02' }}
        />
        {children || config.tag}
      </span>
    );
  }

  if (variant === 'color' && color) {
    const colorScheme = EVENT_COLOR_MAP[color];
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-xl border-2 ${sizeClasses} ${colorScheme.bg} ${colorScheme.text} ${colorScheme.border} ${className}`}
      >
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-xl bg-white text-duo-charcoal border-2 border-duo-gray-faded/60 ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
};
