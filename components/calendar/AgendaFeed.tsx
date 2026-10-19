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

  // Group events by rolling window
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
    <div className="w-full px-4 py-4 space-y-4 pb-36 bg-white font-nunito">
      {/* Classroom Tasks Card — Duolingo Sticker Card */}
      {classroomNoDueTasks && classroomNoDueTasks.length > 0 && (
        <div className="rounded-2xl border-2 border-duo-border-light bg-white p-4 space-y-3 shadow-duo-white">
          <button
            type="button"
            onClick={() => setShowNoDue(!showNoDue)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#ddf4ff] border-2 border-duo-blue flex items-center justify-center text-duo-blue">
                <BookOpen className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-sm font-extrabold tracking-tight text-duo-charcoal">
                  Tareas de Classroom sin fecha límite ({classroomNoDueTasks.length})
                </p>
                <p className="text-xs font-bold text-duo-gray">
                  Actividades asignadas de cursos activos 2026
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-duo-green-light text-duo-green border-2 border-duo-green">
                {showNoDue ? 'Ocultar' : 'Ver todas'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-duo-charcoal transition-transform ${
                  showNoDue ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {showNoDue && (
            <div className="space-y-2 pt-2 border-t-2 border-duo-border-light max-h-72 overflow-y-auto pr-1">
              {classroomNoDueTasks.map((task) => (
                <div
                  key={task.id || task.coursework_id}
                  className="p-3 rounded-xl bg-[#f7f7f7] border-2 border-duo-border-light space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-duo-blue bg-[#ddf4ff] px-2 py-0.5 rounded-lg border border-duo-blue">
                      {task.course_name}
                    </span>
                    {task.alternate_link && (
                      <a
                        href={task.alternate_link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-extrabold text-duo-blue hover:underline inline-flex items-center gap-0.5"
                      >
                        Abrir <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs font-extrabold text-duo-charcoal leading-snug">
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-duo-gray line-clamp-2 leading-relaxed font-medium">
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
            className={`space-y-2.5 transition-all rounded-2xl ${
              isSelected
                ? 'p-3 bg-duo-green-light/20 border-2 border-duo-green shadow-duo-white'
                : 'p-1'
            }`}
          >
            {/* Clear Day Section Header */}
            <div className="flex items-center justify-between border-b-2 border-duo-border-light pb-1.5 pt-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs tracking-wider uppercase font-extrabold ${
                    isCurrentDay
                      ? 'text-[#ea2b2b]'
                      : isSelected
                      ? 'text-duo-green'
                      : 'text-duo-charcoal'
                  }`}
                >
                  {label}
                </span>
                <span className="text-xs font-extrabold text-duo-gray">
                  {dateNum}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-xl bg-duo-green text-white shadow-duo-green ml-1">
                    Seleccionado
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onAddEventForDate(dateStr)}
                aria-label={`Añadir evento para ${dateStr}`}
                className="flex items-center gap-1 text-xs font-extrabold text-duo-charcoal hover:text-duo-green transition-all px-2.5 py-1 rounded-xl border-2 border-duo-border-light bg-white hover:border-duo-green active:translate-y-0.5"
              >
                <Plus className="w-3.5 h-3.5 text-duo-green stroke-[3]" />
                <span>Agregar</span>
              </button>
            </div>

            {/* List of Events or Empty State */}
            {dayEvents.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-duo-border-light bg-[#f7f7f7] p-4 text-center">
                <p className="text-xs font-bold text-duo-gray">Sin compromisos programados</p>
                <button
                  type="button"
                  onClick={() => onAddEventForDate(dateStr)}
                  className="mt-1 text-xs font-extrabold text-duo-blue hover:underline"
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
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl border-2 border-duo-border-light bg-white text-xs font-extrabold text-duo-charcoal hover:bg-duo-green-light/20 hover:border-duo-green transition-all active:translate-y-0.5 shadow-duo-white"
          >
            <span>Ver 7 días más en la agenda</span>
            <ChevronDown className="w-4 h-4 text-duo-green" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDaysCount(7)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl border-2 border-duo-border-light bg-white text-xs font-extrabold text-duo-gray hover:bg-duo-green-light/20 transition-all active:translate-y-0.5"
          >
            <span>Volver a vista de 7 días</span>
          </button>
        )}
      </div>
    </div>
  );
};
