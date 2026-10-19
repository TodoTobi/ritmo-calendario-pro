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
  const colorScheme = EVENT_COLOR_MAP[event.color] || EVENT_COLOR_MAP.green;
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
        className={`w-full text-left rounded-[6px] px-2.5 py-1 text-xs font-medium border-l-[3px] transition-all duration-150 active:scale-[0.98] ${colorScheme.bg} text-family-charcoal truncate flex items-center justify-between gap-1`}
        style={{ borderLeftColor: colorScheme.accent }}
      >
        <span className="truncate">{event.title}</span>
        {isTier1 && <Lock className="w-3 h-3 text-family-red shrink-0" />}
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
      className="relative w-full rounded-[10px] p-3.5 border-l-4 transition-all duration-150 active:scale-[0.99] cursor-pointer bg-white border border-family-stone text-family-charcoal hover:border-family-stone/80 font-inter shadow-family-inset"
      style={{ borderLeftColor: colorScheme.accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-medium text-family-muted mb-1">
            <Clock className="w-3.5 h-3.5 text-family-muted shrink-0" />
            <span className="text-family-charcoal font-medium">
              {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
            </span>
            {event.difficulty_score && (
              <span className="ml-1 px-2 py-0.5 text-[10px] rounded-[6px] bg-family-honey/20 border border-family-honey/30 font-medium text-family-gold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-family-gold" />
                D{event.difficulty_score}
              </span>
            )}
            {(event.created_from === 'classroom_sync' || event.classroom_coursework_id) && (
              <span className="ml-1 px-2 py-0.5 text-[10px] rounded-[6px] bg-family-blue/10 border border-family-blue/20 font-medium text-family-blue flex items-center gap-1">
                📚 Classroom
              </span>
            )}
          </div>
          <h4 className="text-sm font-medium tracking-tight text-family-ink leading-snug truncate">
            {event.title}
          </h4>
          {event.description && (
            <p className="text-xs text-family-brown mt-1 line-clamp-1 font-normal">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {isTier1 ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-semibold bg-family-red/10 text-family-red border border-family-red/20"
              title="Bloque sagrado inamovible"
            >
              <Lock className="w-2.5 h-2.5" />
              T1
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-semibold border ${
                event.tier === 'tier_2'
                  ? 'bg-family-blue/10 text-family-blue border-family-blue/20'
                  : 'bg-family-green/10 text-family-green border-family-green/20'
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
