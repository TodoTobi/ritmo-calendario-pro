import React, { useMemo, useState } from 'react';
import { CalendarEvent } from '@/types/database.types';
import { EventPill } from '@/components/ui/EventPill';
import { formatDayHeader } from '@/lib/date-utils';
import { Plus, Calendar as CalendarIcon, ChevronDown } from 'lucide-react';

interface AgendaFeedProps {
  events: CalendarEvent[];
  selectedDateStr: string;
  onEventClick: (event: CalendarEvent) => void;
  onAddEventForDate: (dateStr: string) => void;
}

export const AgendaFeed: React.FC<AgendaFeedProps> = ({
  events,
  selectedDateStr,
  onEventClick,
  onAddEventForDate,
}) => {
  const [daysCount, setDaysCount] = useState<number>(7);

  // Group events by a rolling window starting exactly from selectedDateStr forward (default 7 days)
  const groupedEvents = useMemo(() => {
    const windowDays: string[] = [];
    const baseDate = new Date(`${selectedDateStr}T12:00:00`);

    for (let i = 0; i < daysCount; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      windowDays.push(`${y}-${m}-${day}`);
    }

    // Sort events by date and start_time
    const sorted = [...events].sort((a, b) => {
      const dateCompare = a.event_date.localeCompare(b.event_date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

    const result: [string, CalendarEvent[]][] = windowDays.map((dateStr) => {
      const dayEvents = sorted.filter((e) => e.event_date === dateStr);
      return [dateStr, dayEvents];
    });

    return result;
  }, [events, selectedDateStr, daysCount]);

  return (
    <div className="w-full px-4 py-4 space-y-5 pb-36">
      {groupedEvents.map(([dateStr, dayEvents], index) => {
        const { label, dateNum, isCurrentDay } = formatDayHeader(dateStr);
        const isSelected = dateStr === selectedDateStr;

        return (
          <section
            key={dateStr}
            id={`day-${dateStr}`}
            className={`space-y-2.5 transition-all rounded-2xl ${
              isSelected
                ? 'ring-2 ring-ritmo-purple/30 p-3 bg-ritmo-purple/5 border border-ritmo-purple/20'
                : 'p-1'
            }`}
          >
            {/* Clear Day Section Header */}
            <div className="flex items-center justify-between border-b border-ritmo-line/70 pb-1.5 pt-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-black tracking-widest uppercase ${
                    isCurrentDay
                      ? 'text-ritmo-purple'
                      : isSelected
                      ? 'text-ritmo-ink font-extrabold'
                      : 'text-ritmo-muted'
                  }`}
                >
                  {label}
                </span>
                <span className="text-xs font-bold text-ritmo-muted">
                  {dateNum}
                </span>
                {isSelected && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-ritmo-purple text-white ml-1">
                    Seleccionado
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onAddEventForDate(dateStr)}
                aria-label={`Añadir evento para ${dateStr}`}
                className="flex items-center gap-1 text-[11px] font-bold text-ritmo-purple hover:text-ritmo-purple/80 transition-colors px-2 py-1 rounded-lg hover:bg-ritmo-purple/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {/* List of Events or Empty State */}
            {dayEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ritmo-line bg-white/60 p-3.5 text-center">
                <p className="text-xs font-medium text-ritmo-muted">Sin compromisos programados</p>
                <button
                  type="button"
                  onClick={() => onAddEventForDate(dateStr)}
                  className="mt-1 text-xs font-bold text-ritmo-purple hover:underline"
                >
                  + Programar actividad
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((event) => (
                  <EventPill
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}

      {/* Button to extend the window if user wants more days */}
      <div className="pt-2 text-center">
        {daysCount === 7 ? (
          <button
            type="button"
            onClick={() => setDaysCount(14)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-ritmo-line bg-white text-xs font-bold text-ritmo-ink shadow-sm hover:bg-ritmo-soft transition-all active:scale-95"
          >
            <span>Ver 7 días más en la agenda</span>
            <ChevronDown className="w-3.5 h-3.5 text-ritmo-muted" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDaysCount(7)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-ritmo-line bg-white text-xs font-bold text-ritmo-muted shadow-sm hover:bg-ritmo-soft transition-all active:scale-95"
          >
            <span>Volver a vista de 7 días</span>
          </button>
        )}
      </div>
    </div>
  );
};
