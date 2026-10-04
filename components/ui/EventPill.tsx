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
        className={`w-full text-left rounded-md px-2 py-1 text-[11px] font-medium border-l-[3px] transition-all duration-150 active:scale-[0.98] ${colorScheme.bg} text-ritmo-ink shadow-sm truncate flex items-center justify-between gap-1`}
        style={{ borderLeftColor: colorScheme.accent }}
      >
        <span className="truncate">{event.title}</span>
        {isTier1 && <Lock className="w-3 h-3 text-ritmo-red shrink-0" />}
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
      className={`relative w-full rounded-ritmo-pill p-3 border-l-4 transition-all duration-150 active:scale-[0.99] cursor-pointer shadow-sm hover:shadow-md ${colorScheme.bg} border-t border-r border-b border-ritmo-line/40 text-ritmo-ink`}
      style={{ borderLeftColor: colorScheme.accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-ritmo-muted mb-0.5">
            <Clock className="w-3 h-3 shrink-0" />
            <span>
              {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
            </span>
            {event.difficulty_score && (
              <span className="ml-1 px-1.5 py-0.2 text-[9px] rounded-full bg-white/80 border border-ritmo-line font-bold text-ritmo-ink flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-ritmo-orange" />
                D{event.difficulty_score}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-sm text-ritmo-ink leading-tight truncate">
            {event.title}
          </h4>
          {event.description && (
            <p className="text-xs text-ritmo-muted mt-1 line-clamp-1">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {isTier1 ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff0f1] text-[#ff5d63] border border-[#ff5d63]/30"
              title="Bloque sagrado inamovible"
            >
              <Lock className="w-2.5 h-2.5" />
              T1
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                event.tier === 'tier_2'
                  ? 'bg-[#edf6ff] text-[#4c9af5] border border-[#4c9af5]/30'
                  : 'bg-[#fff5e6] text-[#f2a641] border border-[#f2a641]/30'
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
