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

    if (absX > 75 && absX > absY * 1.6) {
      if (diffX < 0) {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }
        onNextMonth?.();
      } else {
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }
        onPrevMonth?.();
      }
    }
  };

  return (
    <div
      className="w-full bg-white border-b border-family-stone transition-all duration-300 touch-pan-y font-inter"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 border-b border-family-stone bg-family-cream/60 px-1 py-1.5 text-center">
        {weekDayHeaders.map((header) => (
          <span
            key={header}
            className="text-[10px] font-medium text-family-muted uppercase tracking-wider"
          >
            {header}
          </span>
        ))}
      </div>

      {/* Grid of Days — Hero Full-Height View */}
      <div
        className={`grid grid-cols-7 divide-x divide-y divide-family-stone transition-all duration-300 ${
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
                  ? 'bg-family-stone/40 ring-1 ring-inset ring-family-charcoal'
                  : isCurrentDay
                  ? 'bg-family-cream/80'
                  : !isCurrentMonthDay
                  ? 'bg-family-stone/20 opacity-40'
                  : 'hover:bg-family-cream/50 bg-white'
              }`}
            >
              {/* Date Header inside Cell */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[11px] sm:text-xs font-medium flex items-center justify-center transition-transform ${
                    isSelected
                      ? 'bg-family-ink text-white font-semibold scale-105'
                      : isCurrentDay
                      ? 'bg-family-charcoal text-white font-semibold'
                      : isCurrentMonthDay
                      ? 'text-family-charcoal'
                      : 'text-family-muted'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Event Count pill if there are many */}
                {dayEvents.length > 2 && isExpanded && (
                  <span className="text-[9px] font-medium text-family-muted px-1.5 rounded-full bg-family-stone hidden sm:inline-block">
                    +{dayEvents.length - 2}
                  </span>
                )}
              </div>

              {/* Event Previews inside Cell */}
              {isExpanded ? (
                <div className="flex flex-col gap-1 overflow-hidden flex-1">
                  {dayEvents.slice(0, 2).map((ev) => {
                    const colorScheme = EVENT_COLOR_MAP[ev.color] || EVENT_COLOR_MAP.green;
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectDate(day);
                          if (onEventClick) onEventClick(ev);
                        }}
                        className={`group/pill flex items-center gap-1 px-1.5 py-0.5 rounded-[6px] text-[9px] sm:text-[10px] font-medium truncate transition-transform hover:scale-[1.02] border border-family-stone/80 ${colorScheme.bg} text-family-charcoal`}
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
                    <span className="text-[8px] font-medium text-family-muted sm:hidden px-0.5">
                      +{dayEvents.length - 2} más
                    </span>
                  )}
                </div>
              ) : (
                /* Compact Strip Dots */
                <div className="flex items-center justify-center gap-1 mt-auto h-2">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const colorScheme = EVENT_COLOR_MAP[ev.color] || EVENT_COLOR_MAP.green;
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
      <div className="flex items-center justify-between px-4 py-2 bg-family-cream border-t border-family-stone">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 py-1 px-3.5 text-xs font-medium text-family-charcoal hover:bg-family-stone/40 bg-white rounded-full border border-family-stone shadow-sm transition-transform active:scale-95"
        >
          {isExpanded ? (
            <>
              <span>Ver tira semanal</span>
              <ChevronUp className="w-3.5 h-3.5 text-family-charcoal" />
            </>
          ) : (
            <>
              <span>Ver mes completo</span>
              <ChevronDown className="w-3.5 h-3.5 text-family-charcoal" />
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const dateStr = format(selectedDate, 'yyyy-MM-dd');
              const targetEl = document.getElementById(`day-${dateStr}`) || document.getElementById('agenda-section');
              targetEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex items-center gap-1 py-1 px-3.5 text-xs font-semibold text-white bg-family-ink rounded-full transition-transform active:scale-95 hover:bg-family-charcoal"
          >
            <span>Actividades ({format(selectedDate, 'd MMM')}) ↓</span>
          </button>
        </div>
      </div>
    </div>
  );
};
