import React, { useMemo, useState } from 'react';
import { CalendarEvent } from '@/types/database.types';
import { EventPill } from '@/components/ui/EventPill';
import { formatDayHeader } from '@/lib/date-utils';
import { Plus, ChevronDown, BookOpen, ExternalLink } from 'lucide-react';

export interface ClassroomNoDueItem {
  id: string;
  course_name: string;
  title: string;
  description?: string | null;
  alternate_link?: string | null;
  coursework_id: string;
}

interface AgendaFeedProps {
  events: CalendarEvent[];
  selectedDateStr: string;
  classroomNoDueTasks?: ClassroomNoDueItem[];
  onEventClick: (event: CalendarEvent) => void;
  onAddEventForDate: (dateStr: string) => void;
}

export const AgendaFeed: React.FC<AgendaFeedProps> = ({
  events,
  selectedDateStr,
  classroomNoDueTasks,
  onEventClick,
  onAddEventForDate,
}) => {
  const [daysCount, setDaysCount] = useState<number>(7);
  const [showNoDue, setShowNoDue] = useState<boolean>(false);

  // Group events by a rolling window
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
    <div className="w-full px-4 py-4 space-y-4 pb-36 bg-family-cream font-inter">
      {/* Classroom Tasks Collapsible Card */}
      {classroomNoDueTasks && classroomNoDueTasks.length > 0 && (
        <div className="rounded-[10px] border border-family-stone bg-white p-4 space-y-3 shadow-family-inset">
          <button
            type="button"
            onClick={() => setShowNoDue(!showNoDue)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-family-blue/10 flex items-center justify-center text-family-blue">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-family-ink">
                  Tareas de Classroom sin fecha límite ({classroomNoDueTasks.length})
                </p>
                <p className="text-[11px] font-normal text-family-muted">
                  Actividades asignadas de tus cursos activos 2026
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-[6px] bg-family-stone text-family-charcoal">
                {showNoDue ? 'Ocultar' : 'Ver todas'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-family-muted transition-transform ${
                  showNoDue ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {showNoDue && (
            <div className="space-y-2 pt-2 border-t border-family-stone max-h-72 overflow-y-auto pr-1">
              {classroomNoDueTasks.map((task) => (
                <div
                  key={task.id || task.coursework_id}
                  className="p-3 rounded-[8px] bg-family-cream border border-family-stone space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-family-blue bg-family-blue/10 px-2 py-0.5 rounded-[4px]">
                      {task.course_name}
                    </span>
                    {task.alternate_link && (
                      <a
                        href={task.alternate_link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-family-orange hover:underline inline-flex items-center gap-0.5"
                      >
                        Abrir <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-medium text-family-ink leading-tight">{task.title}</p>
                  {task.description && (
                    <p className="text-[11px] text-family-brown line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {groupedEvents.map(([dateStr, dayEvents]) => {
        const { label, dateNum, isCurrentDay } = formatDayHeader(dateStr);
        const isSelected = dateStr === selectedDateStr;

        return (
          <section
            key={dateStr}
            id={`day-${dateStr}`}
            className={`space-y-2 transition-all rounded-[10px] ${
              isSelected
                ? 'p-3 bg-white border border-family-stone shadow-family-inset'
                : 'p-1'
            }`}
          >
            {/* Clear Day Section Header */}
            <div className="flex items-center justify-between border-b border-family-stone/80 pb-1.5 pt-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs uppercase tracking-wider font-semibold ${
                    isCurrentDay
                      ? 'text-family-orange font-bold'
                      : isSelected
                      ? 'text-family-ink'
                      : 'text-family-charcoal'
                  }`}
                >
                  {label}
                </span>
                <span className="text-xs font-normal text-family-muted">
                  {dateNum}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-family-stone text-family-charcoal ml-1">
                    Seleccionado
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onAddEventForDate(dateStr)}
                aria-label={`Añadir evento para ${dateStr}`}
                className="flex items-center gap-1 text-[11px] font-medium text-family-charcoal hover:text-family-ink transition-colors px-2.5 py-1 rounded-full border border-family-stone bg-white"
              >
                <Plus className="w-3.5 h-3.5 text-family-muted" />
                <span>Agregar</span>
              </button>
            </div>

            {/* List of Events or Empty State */}
            {dayEvents.length === 0 ? (
              <div className="rounded-[10px] border border-dashed border-family-stone bg-white/40 p-4 text-center">
                <p className="text-xs font-normal text-family-muted">Sin compromisos programados</p>
                <button
                  type="button"
                  onClick={() => onAddEventForDate(dateStr)}
                  className="mt-1 text-xs font-medium text-family-orange hover:underline"
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

      {/* Button to extend window */}
      <div className="pt-2 text-center">
        {daysCount === 7 ? (
          <button
            type="button"
            onClick={() => setDaysCount(14)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-family-stone bg-white text-xs font-medium text-family-charcoal hover:bg-family-stone/40 transition-all active:scale-95 shadow-sm"
          >
            <span>Ver 7 días más en la agenda</span>
            <ChevronDown className="w-3.5 h-3.5 text-family-muted" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDaysCount(7)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-family-stone bg-white text-xs font-medium text-family-muted hover:bg-family-stone/40 transition-all active:scale-95"
          >
            <span>Volver a vista de 7 días</span>
          </button>
        )}
      </div>
    </div>
  );
};
