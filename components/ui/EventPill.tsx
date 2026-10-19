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
        className={`w-full text-left rounded-xl px-2.5 py-1 text-xs font-bold border-2 transition-all active:translate-y-0.5 ${colorScheme.bg} ${colorScheme.text} ${colorScheme.border} truncate flex items-center justify-between gap-1`}
      >
        <span className="truncate">{event.title}</span>
        {isTier1 && <Lock className="w-3 h-3 text-[#ea2b2b] shrink-0" />}
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
      className="relative w-full rounded-2xl p-3.5 border-2 border-duo-border-light bg-white text-duo-charcoal shadow-duo-white transition-all duration-150 active:translate-y-0.5 cursor-pointer hover:border-duo-green font-nunito"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-bold text-duo-gray mb-1">
            <Clock className="w-3.5 h-3.5 text-duo-gray shrink-0" />
            <span className="text-duo-charcoal">
              {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
            </span>
            {event.difficulty_score && (
              <span className="ml-1 px-2 py-0.5 text-[10px] rounded-lg bg-[#fff9db] border-2 border-[#ffc800] font-extrabold text-[#b88c00] flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 text-[#ffc800]" />
                D{event.difficulty_score}
              </span>
            )}
            {(event.created_from === 'classroom_sync' || event.classroom_coursework_id) && (
              <span className="ml-1 px-2 py-0.5 text-[10px] rounded-lg bg-[#ddf4ff] border-2 border-duo-blue font-extrabold text-duo-blue flex items-center gap-1">
                📚 Classroom
              </span>
            )}
          </div>
          <h4 className="text-sm font-extrabold tracking-tight text-duo-charcoal leading-snug truncate">
            {event.title}
          </h4>
          {event.description && (
            <p className="text-xs text-duo-gray mt-1 line-clamp-1 font-medium">
              {event.description}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {isTier1 ? (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-xl text-[10px] font-extrabold bg-[#ffebee] text-[#ea2b2b] border-2 border-[#ff4b4b]"
              title="Bloque sagrado inamovible"
            >
              <Lock className="w-2.5 h-2.5" />
              T1
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-xl text-[10px] font-extrabold border-2 ${
                event.tier === 'tier_2'
                  ? 'bg-[#ddf4ff] text-duo-blue border-duo-blue'
                  : 'bg-duo-green-light text-duo-green border-duo-green'
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
