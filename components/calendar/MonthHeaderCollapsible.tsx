import React, { useState, useRef } from 'react';
import {
  getMonthDaysGrid,
  getWeekDaysStrip,
  isSameDay,
  isSameMonth,
  isToday,
  format,
} from '@/lib/date-utils';
import { CalendarEvent } from '@/types/database.types';
import { EVENT_COLOR_MAP } from '@/lib/color-tokens';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface MonthHeaderCollapsibleProps {
  currentDate: Date;
  selectedDate: Date;
  events: CalendarEvent[];
  onSelectDate: (date: Date) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
}

export const MonthHeaderCollapsible: React.FC<MonthHeaderCollapsibleProps> = ({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
  onEventClick,
  onPrevMonth,
  onNextMonth,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const monthGridDays = getMonthDaysGrid(currentDate);
  const weekStripDays = getWeekDaysStrip(selectedDate);
  const displayedDays = isExpanded ? monthGridDays : weekStripDays;

  const weekDayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Helper to find events on a given day
  const getDayEvents = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return events.filter((e) => e.event_date === dayStr);
  };

  const handleDayClick = (day: Date) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onSelectDate(day);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;

    const diffX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const diffY = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absX = Math.abs(diffX);
    const absY = Math.abs(diffY);

    // CRITICAL CONSTRAINT: DO NOT make it overly sensitive!
    // Threshold: Require at least 75px of horizontal distance (Math.abs(diffX) > 75)
    // AND enforce horizontal dominance (Math.abs(diffX) > Math.abs(diffY) * 1.6)
    // so vertical scrolling through the page does NOT trigger an accidental month change.
    if (absX > 75 && absX > absY * 1.6) {
      if (diffX < 0) {
        // Swipe left -> Next Month
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }
        onNextMonth?.();
      } else {
        // Swipe right -> Previous Month
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }
        onPrevMonth?.();
      }
    }
  };

  return (
    <div
      className="w-full bg-white border-b border-ritmo-line shadow-sm transition-all duration-300 touch-pan-y"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 border-b border-ritmo-line/70 bg-ritmo-soft/60 px-1 py-1.5 text-center">
        {weekDayHeaders.map((header) => (
          <span
            key={header}
            className="text-[10px] font-extrabold text-ritmo-muted uppercase tracking-wider font-manrope"
          >
            {header}
          </span>
        ))}
      </div>

      {/* Grid of Days — Hero Full-Height View */}
      <div
        className={`grid grid-cols-7 divide-x divide-y divide-ritmo-line/60 transition-all duration-300 ${
          isExpanded
            ? 'min-h-[calc(100dvh-200px)] md:min-h-[560px]'
            : 'min-h-[70px]'
        }`}
      >
        {displayedDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonthDay = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const dayEvents = getDayEvents(day);

          return (
            <div
              key={day.toISOString()}
              onClick={() => handleDayClick(day)}
              className={`group flex flex-col p-1 sm:p-1.5 transition-colors relative cursor-pointer select-none ${
                isExpanded ? 'min-h-[72px] sm:min-h-[88px]' : 'min-h-[64px]'
              } ${
                isSelected
                  ? 'bg-ritmo-purple/5 ring-2 ring-inset ring-ritmo-purple'
                  : isCurrentDay
                  ? 'bg-[#fbfaff]'
                  : !isCurrentMonthDay
                  ? 'bg-ritmo-soft/40 opacity-45'
                  : 'hover:bg-ritmo-soft/80 bg-white'
              }`}
            >
              {/* Date Header inside Cell */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-[11px] sm:text-xs font-manrope font-bold flex items-center justify-center transition-transform ${
                    isSelected
                      ? 'bg-ritmo-purple text-white shadow-sm font-extrabold scale-105'
                      : isCurrentDay
                      ? 'bg-ritmo-ink text-white font-extrabold'
                      : isCurrentMonthDay
                      ? 'text-ritmo-ink'
                      : 'text-ritmo-muted'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Event Count pill if there are many */}
                {dayEvents.length > 2 && isExpanded && (
                  <span className="text-[9px] font-bold text-ritmo-muted px-1 rounded-full bg-ritmo-soft hidden sm:inline-block">
                    +{dayEvents.length - 2}
                  </span>
                )}
              </div>

              {/* Event Previews inside Cell */}
              {isExpanded ? (
                <div className="flex flex-col gap-1 overflow-hidden flex-1">
                  {dayEvents.slice(0, 2).map((ev) => {
                    const colorScheme = EVENT_COLOR_MAP[ev.color] || EVENT_COLOR_MAP.orange;
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(day);
                          if (onEventClick) onEventClick(ev);
                        }}
                        className={`group/pill flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold truncate transition-transform hover:scale-[1.02] border border-black/5 ${colorScheme.bg} ${colorScheme.text}`}
                        title={`${ev.start_time.slice(0, 5)} ${ev.title}`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colorScheme.accent }}
                        />
                        <span className="truncate">{ev.title}</span>
                      </div>
                    );
                  })}

                  {dayEvents.length > 2 && (
                    <span className="text-[8px] font-bold text-ritmo-muted sm:hidden px-0.5">
                      +{dayEvents.length - 2} más
                    </span>
                  )}
                </div>
              ) : (
                /* Compact Strip Dots */
                <div className="flex items-center justify-center gap-1 mt-auto h-2">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const colorScheme = EVENT_COLOR_MAP[ev.color] || EVENT_COLOR_MAP.orange;
                    return (
                      <span
                        key={ev.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: colorScheme.accent }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Bar: Clean Toggle Button */}
      <div className="flex items-center justify-between px-4 py-2 bg-ritmo-soft/50 border-t border-ritmo-line/60">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 py-1 px-3 text-[11px] font-bold text-ritmo-muted hover:text-ritmo-ink bg-white rounded-full border border-ritmo-line shadow-2xs transition-transform active:scale-95"
        >
          {isExpanded ? (
            <>
              <span>Ver tira semanal</span>
              <ChevronUp className="w-3.5 h-3.5 text-ritmo-purple" />
            </>
          ) : (
            <>
              <span>Ver mes completo</span>
              <ChevronDown className="w-3.5 h-3.5 text-ritmo-purple" />
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[10px] font-medium text-ritmo-muted/70 tracking-wide select-none">
            ← Desliza para cambiar mes →
          </span>
          <button
            type="button"
            onClick={() => {
              const dateStr = format(selectedDate, 'yyyy-MM-dd');
              const targetEl = document.getElementById(`day-${dateStr}`) || document.getElementById('agenda-section');
              targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center gap-1 py-1 px-3 text-[11px] font-bold text-ritmo-purple hover:text-ritmo-purple/80 bg-ritmo-purple/10 rounded-full transition-transform active:scale-95"
          >
            <span>Ver actividades ({format(selectedDate, 'd MMM')}) ↓</span>
          </button>
        </div>
      </div>
    </div>
  );
};
