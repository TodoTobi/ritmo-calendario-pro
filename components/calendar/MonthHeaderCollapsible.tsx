import React, { useState } from 'react';
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
}

export const MonthHeaderCollapsible: React.FC<MonthHeaderCollapsibleProps> = ({
  currentDate,
  selectedDate,
  events,
  onSelectDate,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const monthGridDays = getMonthDaysGrid(currentDate);
  const weekStripDays = getWeekDaysStrip(selectedDate);
  const displayedDays = isExpanded ? monthGridDays : weekStripDays;

  const weekDayHeaders = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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

  return (
    <div className="bg-white border-b border-ritmo-line/80 px-3 pt-2 pb-1 shadow-sm transition-all duration-200">
      {/* Day of Week Label Headers */}
      <div className="grid grid-cols-7 mb-1 text-center">
        {weekDayHeaders.map((letter, i) => (
          <span
            key={`${letter}-${i}`}
            className="text-[11px] font-bold text-ritmo-muted uppercase tracking-wider py-0.5"
          >
            {letter}
          </span>
        ))}
      </div>

      {/* Grid of Days */}
      <div
        className={`grid grid-cols-7 gap-y-1 transition-all duration-200 ${
          isExpanded ? 'min-h-[190px]' : 'min-h-[44px]'
        }`}
      >
        {displayedDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonthDay = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const dayEvents = getDayEvents(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => handleDayClick(day)}
              className={`group flex flex-col items-center justify-center py-1 rounded-full relative transition-transform active:scale-90 ${
                isSelected
                  ? 'bg-ritmo-purple text-white shadow-sm font-extrabold'
                  : isCurrentDay
                  ? 'border border-ritmo-purple text-ritmo-purple font-bold'
                  : isCurrentMonthDay
                  ? 'text-ritmo-ink hover:bg-ritmo-soft font-semibold'
                  : 'text-ritmo-muted/40 font-normal'
              }`}
            >
              <span className="text-xs">{format(day, 'd')}</span>

              {/* Event Category Indicator Dots (Up to 3 dots) */}
              <div className="flex items-center gap-0.5 mt-0.5 h-1.5">
                {dayEvents.slice(0, 3).map((ev) => {
                  const colorScheme = EVENT_COLOR_MAP[ev.color];
                  return (
                    <span
                      key={ev.id}
                      className={`w-1.5 h-1.5 rounded-full transition-opacity ${
                        isSelected ? 'bg-white' : ''
                      }`}
                      style={{
                        backgroundColor: isSelected ? '#ffffff' : colorScheme.accent,
                      }}
                    />
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Collapse / Expand Handle Bar */}
      <div className="flex justify-center mt-1">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-label={isExpanded ? 'Comprimir a vista semanal' : 'Expandir a vista mensual'}
          className="flex items-center gap-1 py-1 px-3 text-[10px] font-bold text-ritmo-muted hover:text-ritmo-ink rounded-full transition-colors active:scale-95"
        >
          {isExpanded ? (
            <>
              <span>Semana</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span>Mes completo</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
