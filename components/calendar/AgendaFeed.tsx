import React, { useMemo, useState } from 'react';
import { CalendarEvent } from '@/types/database.types';
import { EventPill } from '@/components/ui/EventPill';
import { formatDayHeader } from '@/lib/date-utils';
import { Plus, Calendar as CalendarIcon, ChevronDown, BookOpen, ExternalLink } from 'lucide-react';

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
      {/* Classroom Tasks without Due Date Collapsible Card */}
      {classroomNoDueTasks && classroomNoDueTasks.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-2.5 shadow-2xs">
          <button
            type="button"
            onClick={() => setShowNoDue(!showNoDue)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-600">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-blue-950">
                  Tareas de Classroom sin fecha límite ({classroomNoDueTasks.length})
                </p>
                <p className="text-[11px] font-medium text-blue-700/80">
                  Actividades asignadas de tus cursos activos 2026
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {showNoDue ? 'Ocultar' : 'Ver todas'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-blue-700 transition-transform ${
                  showNoDue ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {showNoDue && (
            <div className="space-y-2 pt-2 border-t border-blue-200/80 max-h-72 overflow-y-auto pr-1">
              {classroomNoDueTasks.map((task) => (
                <div
                  key={task.id || task.coursework_id}
                  className="p-3 rounded-xl bg-white border border-blue-100 shadow-2xs space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                      {task.course_name}
                    </span>
                    {task.alternate_link && (
                      <a
                        href={task.alternate_link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5"
                      >
                        Abrir <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-bold text-ritmo-ink leading-tight">{task.title}</p>
                  {task.description && (
                    <p className="text-[11px] text-ritmo-muted line-clamp-2 leading-relaxed">
                      {task.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
