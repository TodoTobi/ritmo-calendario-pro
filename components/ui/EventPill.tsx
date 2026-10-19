import React from 'react';
import { CalendarEvent } from '@/types/database.types';
import { EVENT_COLOR_MAP, TIER_CONFIG } from '@/lib/color-tokens';
import { Lock, Clock, Sparkles } from 'lucide-react';

interface EventPillProps {
  event: CalendarEvent;
  onClick?: (event: CalendarEvent) => void;
  isCompact?: boolean;
}

export const EventPill: React.FC<EventPillProps> = ({ event, onClick, isCompact = false }) => {
  const colorScheme = EVENT_COLOR_MAP[event.color] || EVENT_COLOR_MAP.orange;
  const isTier1 = event.tier === 'tier_1';

  const handleClick = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick?.(event);
  };

  if (isCompact) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`w-full text-left rounded-full px-2.5 py-1 text-[11px] font-medium border-l-[3px] transition-all duration-150 active:scale-[0.98] ${colorScheme.bg} text-caldera-obsidian truncate flex items-center justify-between gap-1`}
        style={{ borderLeftColor: colorScheme.accent }}
      >
        <span className="truncate">{event.title}</span>
        {isTier1 && <Lock className="w-3 h-3 text-caldera-ember shrink-0" />}
      </button>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      className={`relative w-full rounded-[24px] sm:rounded-[28px] p-3.5 border-l-4 transition-all duration-150 active:scale-[0.99] cursor-pointer bg-caldera-limestone border-y border-r border-caldera-obsidian/15 text-caldera-obsidian hover:border-caldera-obsidian/40`}
      style={{ borderLeftColor: colorScheme.accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-caldera-muted mb-1">
            <Clock className="w-3 h-3 text-caldera-obsidian/60 shrink-0" />
            <span className="font-semibold text-caldera-obsidian/80">
              {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
            </span>
            {event.difficulty_score && (
              <span className="ml-1 px-2 py-0.5 text-[9px] rounded-full bg-caldera-sulfur border border-caldera-obsidian/20 font-bold text-caldera-obsidian flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-caldera-obsidian" />
                D{event.difficulty_score}
              </span>
            )}
            {(event.created_from === 'classroom_sync' || event.classroom_coursework_id) && (
              <span className="ml-1 px-2 py-0.5 text-[9px] rounded-full bg-caldera-plasma/15 border border-caldera-plasma/30 font-bold text-caldera-plasma flex items-center gap-1">
                📚 Classroom
              </span>
            )}
          </div>
          <h4 className="font-display text-base tracking-wide text-caldera-obsidian uppercase leading-tight truncate">
            {event.title}
          </h4>
          {event.description && (
            <p className="text-xs text-caldera-muted mt-1 line-clamp-1 font-medium">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {isTier1 ? (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-caldera-ember text-caldera-obsidian border border-caldera-obsidian/30"
              title="Bloque sagrado inamovible"
            >
              <Lock className="w-2.5 h-2.5 text-caldera-obsidian" />
              T1
            </span>
          ) : (
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                event.tier === 'tier_2'
                  ? 'bg-caldera-plasma/15 text-caldera-plasma border border-caldera-plasma/30'
                  : 'bg-caldera-sulfur text-caldera-obsidian border border-caldera-obsidian/20'
              }`}
            >
              {TIER_CONFIG[event.tier].tag}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
