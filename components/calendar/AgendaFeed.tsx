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
    <div className="w-full px-4 py-4 space-y-6 pb-36 bg-caldera-limestone">
      {/* Classroom Tasks Card — Caldera Plasma Accent Surface */}
      {classroomNoDueTasks && classroomNoDueTasks.length > 0 && (
        <div className="rounded-[32px] border border-caldera-obsidian/20 bg-caldera-pumice/70 p-4 space-y-3">
          <button
            type="button"
            onClick={() => setShowNoDue(!showNoDue)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-caldera-plasma flex items-center justify-center text-caldera-chalk">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <p className="font-display text-sm uppercase tracking-wider text-caldera-obsidian">
                  Tareas de Classroom sin fecha límite ({classroomNoDueTasks.length})
                </p>
                <p className="text-[11px] font-medium text-caldera-muted">
                  Actividades asignadas de cursos 2026
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-caldera-sulfur text-caldera-obsidian border border-caldera-obsidian/20">
                {showNoDue ? 'Ocultar' : 'Ver todas'}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-caldera-obsidian transition-transform ${
                  showNoDue ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {showNoDue && (
            <div className="space-y-2 pt-2 border-t border-dotted border-caldera-obsidian/25 max-h-72 overflow-y-auto pr-1">
              {classroomNoDueTasks.map((task) => (
                <div
                  key={task.id || task.coursework_id}
                  className="p-3 rounded-[20px] bg-caldera-limestone border border-caldera-obsidian/15 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold uppercase tracking-wider text-caldera-plasma bg-caldera-plasma/10 px-2 py-0.5 rounded-full">
                      {task.course_name}
                    </span>
                    {task.alternate_link && (
                      <a
                        href={task.alternate_link}
                        target="_blank"
                        rel="noreferrer"
                        className="font-bold text-caldera-ember hover:underline inline-flex items-center gap-0.5"
                      >
                        Abrir <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <p className="font-display text-sm uppercase tracking-wide text-caldera-obsidian leading-tight">
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-[11px] text-caldera-muted line-clamp-2 leading-relaxed">
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
            className={`space-y-3 transition-all rounded-[32px] ${
              isSelected
                ? 'p-3.5 bg-caldera-pumice/50 border border-caldera-obsidian/30'
                : 'p-1'
            }`}
          >
            {/* Clear Day Section Header */}
            <div className="flex items-center justify-between border-b border-dotted border-caldera-obsidian/25 pb-1.5 pt-0.5">
              <div className="flex items-center gap-2">
                <span
                  className={`font-display text-base tracking-wider uppercase ${
                    isCurrentDay
                      ? 'text-caldera-ember font-bold'
                      : isSelected
                      ? 'text-caldera-obsidian font-bold'
                      : 'text-caldera-muted'
                  }`}
                >
                  {label}
                </span>
                <span className="text-xs font-bold text-caldera-muted">
                  {dateNum}
                </span>
                {isSelected && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-caldera-sulfur text-caldera-obsidian border border-caldera-obsidian/20 ml-1">
                    Seleccionado
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onAddEventForDate(dateStr)}
                aria-label={`Añadir evento para ${dateStr}`}
                className="flex items-center gap-1 text-[11px] font-bold text-caldera-obsidian hover:text-caldera-ember transition-colors px-2.5 py-1 rounded-full border border-caldera-obsidian/25 hover:border-caldera-ember bg-caldera-limestone"
              >
                <Plus className="w-3.5 h-3.5 text-caldera-ember" />
                <span>Agregar</span>
              </button>
            </div>

            {/* List of Events or Empty State */}
            {dayEvents.length === 0 ? (
              <div className="rounded-[24px] border border-dotted border-caldera-obsidian/30 bg-caldera-pumice/20 p-4 text-center">
                <p className="text-xs font-medium text-caldera-muted">Sin compromisos programados</p>
                <button
                  type="button"
                  onClick={() => onAddEventForDate(dateStr)}
                  className="mt-1 text-xs font-bold text-caldera-ember hover:underline"
                >
                  + Programar actividad
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
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
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-caldera-obsidian bg-transparent text-xs font-bold text-caldera-obsidian hover:bg-caldera-pumice transition-all active:scale-95"
          >
            <span>Ver 7 días más en la agenda</span>
            <ChevronDown className="w-3.5 h-3.5 text-caldera-obsidian" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setDaysCount(7)}
            className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full border border-caldera-obsidian bg-transparent text-xs font-bold text-caldera-obsidian hover:bg-caldera-pumice transition-all active:scale-95"
          >
            <span>Volver a vista de 7 días</span>
          </button>
        )}
      </div>
    </div>
  );
};
