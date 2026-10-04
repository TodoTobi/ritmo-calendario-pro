import React, { useMemo } from 'react';
import { CalendarEvent } from '@/types/database.types';
import { EventPill } from '@/components/ui/EventPill';
import { formatDayHeader } from '@/lib/date-utils';
import { Plus, Calendar as CalendarIcon } from 'lucide-react';

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
  // Group events by date (sorted chronologically)
  const groupedEvents = useMemo(() => {
    const groups: Record<string, CalendarEvent[]> = {};

    // Ensure selected date is present in groups even if empty
    groups[selectedDateStr] = [];

    // Sort events by date and start_time
    const sorted = [...events].sort((a, b) => {
      const dateCompare = a.event_date.localeCompare(b.event_date);
      if (dateCompare !== 0) return dateCompare;
      return a.start_time.localeCompare(b.start_time);
    });

    sorted.forEach((event) => {
      if (!groups[event.event_date]) {
        groups[event.event_date] = [];
      }
      groups[event.event_date].push(event);
    });

    // Return as array of [dateStr, eventsList] sorted by dateStr
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [events, selectedDateStr]);

  return (
    <div className="w-full px-4 py-5 space-y-6 pb-36">
      {groupedEvents.map(([dateStr, dayEvents]) => {
        const { label, dateNum, isCurrentDay } = formatDayHeader(dateStr);
        const isSelected = dateStr === selectedDateStr;

        return (
          <section
            key={dateStr}
            id={`day-${dateStr}`}
            className={`space-y-2.5 transition-all ${
              isSelected ? 'ring-2 ring-ritmo-purple/20 p-2.5 rounded-2xl bg-white/70' : ''
            }`}
          >
            {/* Sticky/Clear Day Section Header */}
            <div className="flex items-center justify-between border-b border-ritmo-line/70 pb-1.5 pt-1">
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xs font-black tracking-widest ${
                    isCurrentDay
                      ? 'text-ritmo-purple'
                      : isSelected
                      ? 'text-ritmo-ink'
                      : 'text-ritmo-muted'
                  }`}
                >
                  {label}
                </span>
                <span className="text-[11px] font-semibold text-ritmo-muted">
                  {dateNum}
                </span>
              </div>

              <button
                type="button"
                onClick={() => onAddEventForDate(dateStr)}
                aria-label={`Añadir evento para ${dateStr}`}
                className="flex items-center gap-1 text-[11px] font-semibold text-ritmo-purple hover:text-ritmo-purple/80 transition-colors p-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </button>
            </div>

            {/* List of Events or Empty Placeholder */}
            {dayEvents.length === 0 ? (
              <div className="rounded-xl border border-dashed border-ritmo-line bg-ritmo-soft/50 p-4 text-center">
                <p className="text-xs text-ritmo-muted">Sin compromisos programados</p>
                <button
                  type="button"
                  onClick={() => onAddEventForDate(dateStr)}
                  className="mt-1 text-xs font-bold text-ritmo-purple hover:underline"
                >
                  + Programar bloque de estudio o descanso
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

      {groupedEvents.length === 0 && (
        <div className="flex flex-col items-center justify-center p-8 text-center text-ritmo-muted">
          <CalendarIcon className="w-10 h-10 mb-2 opacity-40 text-ritmo-purple" />
          <p className="text-sm font-semibold">No hay eventos registrados</p>
          <p className="text-xs mt-1">Usa el botón (+) para crear tu primera rutina o tarea.</p>
        </div>
      )}
    </div>
  );
};
