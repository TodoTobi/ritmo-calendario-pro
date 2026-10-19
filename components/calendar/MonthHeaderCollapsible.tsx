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
      className="w-full bg-white border-b-2 border-duo-border-light transition-all duration-300 touch-pan-y font-nunito"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 border-b-2 border-duo-border-light bg-[#f7f7f7] px-1 py-1.5 text-center">
        {weekDayHeaders.map((header) => (
          <span
            key={header}
            className="text-[11px] font-extrabold text-duo-gray uppercase tracking-wider"
          >
            {header}
          </span>
        ))}
      </div>

      {/* Grid of Days — Clean White Grid with 2px borders */}
      <div
        className={`grid grid-cols-7 divide-x divide-y divide-duo-border-light transition-all duration-300 ${
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
                  ? 'bg-duo-green-light/30 ring-2 ring-inset ring-duo-green'
                  : isCurrentDay
                  ? 'bg-[#f7f7f7]'
                  : !isCurrentMonthDay
                  ? 'bg-gray-50/60 opacity-40'
                  : 'hover:bg-duo-green-light/10 bg-white'
              }`}
            >
              {/* Date Header inside Cell */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg text-xs font-extrabold flex items-center justify-center transition-transform ${
                    isSelected
                      ? 'bg-duo-green text-white shadow-duo-green scale-105'
                      : isCurrentDay
                      ? 'bg-duo-charcoal text-white'
                      : isCurrentMonthDay
                      ? 'text-duo-charcoal'
                      : 'text-duo-gray'
                  }`}
                >
                  {format(day, 'd')}
                </span>

                {/* Event Count pill if there are many */}
                {dayEvents.length > 2 && isExpanded && (
                  <span className="text-[9px] font-extrabold text-duo-gray px-1.5 rounded-md bg-duo-border-light hidden sm:inline-block">
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
                        className={`group/pill flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold truncate transition-transform hover:scale-[1.02] border ${colorScheme.border} ${colorScheme.bg} ${colorScheme.text}`}
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
                    <span className="text-[8px] font-bold text-duo-gray sm:hidden px-0.5">
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
                        className="w-2 h-2 rounded-full"
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

      {/* Bottom Bar: Clean Toggle Buttons */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#f7f7f7] border-t-2 border-duo-border-light">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-center gap-1.5 py-1 px-3 text-xs font-extrabold text-duo-charcoal hover:bg-white bg-white rounded-xl border-2 border-duo-border-light shadow-duo-white transition-all active:translate-y-0.5"
        >
          {isExpanded ? (
            <>
              <span>Tira semanal</span>
              <ChevronUp className="w-4 h-4 text-duo-green" />
            </>
          ) : (
            <>
              <span>Mes completo</span>
              <ChevronDown className="w-4 h-4 text-duo-green" />
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
            className="flex items-center gap-1 py-1.5 px-3.5 text-xs font-extrabold text-white bg-duo-green rounded-xl shadow-duo-green transition-all active:translate-y-0.5"
          >
            <span>Actividades ({format(selectedDate, 'd MMM')}) ↓</span>
          </button>
        </div>
      </div>
    </div>
  );
};
