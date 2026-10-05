'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TopHeader } from '@/components/ui/TopHeader';
import { BottomNav, NavTab } from '@/components/ui/BottomNav';
import { FAB } from '@/components/ui/FAB';
import { MonthHeaderCollapsible } from '@/components/calendar/MonthHeaderCollapsible';
import { AgendaFeed } from '@/components/calendar/AgendaFeed';
import { TactileTimeline } from '@/components/timeline/TactileTimeline';
import { NotesContainer } from '@/components/notes/NotesContainer';
import { QuickAddModal } from '@/components/modals/QuickAddModal';
import { EventDetailModal } from '@/components/modals/EventDetailModal';
import { MonthYearPickerModal } from '@/components/modals/MonthYearPickerModal';
import { CalendarEvent, NoteItem } from '@/types/database.types';
import {
  formatDateSafe,
  addMonths,
  subMonths,
  format,
  timeStringToMinutes,
  minutesToTimeString,
  getArgentinaDateString,
  getArgentinaTimeString,
  formatInArgentina,
} from '@/lib/date-utils';
import {
  Settings,
  ShieldCheck,
  RefreshCw,
  Smartphone,
  BookOpen,
  Bot,
  Database,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Bell,
  Cloud,
} from 'lucide-react';
import { generateRealOctoberEvents, generateRealNotes } from '@/lib/seed-data';
import { supabaseBrowserClient } from '@/lib/supabase/client';

// Initial data loaded with Lucas's complete real October & November schedule
const INITIAL_EVENTS: CalendarEvent[] = generateRealOctoberEvents();
const INITIAL_NOTES: NoteItem[] = generateRealNotes();

export default function RitmoMainPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-10-04T12:00:00'));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-10-04T12:00:00'));
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Data collections state initialized with full real schedule
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [notes, setNotes] = useState<NoteItem[]>(INITIAL_NOTES);

  // Seed / DB sync state in settings
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'empty' | 'missing_tables'>('checking');
  const [isSyncingDb, setIsSyncingDb] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Google Classroom sync state
  const [classroomCount, setClassroomCount] = useState<number>(0);
  const [classroomNoDueTasks, setClassroomNoDueTasks] = useState<any[]>([]);
  const [isSyncingClassroom, setIsSyncingClassroom] = useState<boolean>(false);
  const [classroomFeedback, setClassroomFeedback] = useState<string | null>(null);

  // Google Drive & NotebookLM sync state
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [driveFeedback, setDriveFeedback] = useState<string | null>(null);

  // Mobile / Browser Push Notification State
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Las notificaciones del sistema no están soportadas en este navegador.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('🔔 Ritmo — Notificaciones Activadas', {
          body: '¡Listo! Recibirás alertas invasivas de entregas urgentes de Classroom y parciales.',
          icon: '/icons/icon-192.png',
        });
      }
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  };

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<CalendarEvent | null>(null);
  const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState<boolean>(false);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

  // Supabase real-time synchronization on mount
  useEffect(() => {
    async function syncWithSupabase() {
      try {
        const { data: dbEvents, error: evErr } = await supabaseBrowserClient
          .from('events')
          .select('*')
          .order('start_time');

        if (evErr) {
          if (evErr.code === 'PGRST205' || evErr.message?.includes('schema cache')) {
            setDbStatus('missing_tables');
          } else {
            setDbStatus('empty');
          }
          return;
        }

        let baseEvents: CalendarEvent[] = [];
        if (dbEvents && dbEvents.length > 0) {
          baseEvents = dbEvents as CalendarEvent[];
          setEvents(baseEvents);
          setDbStatus('connected');
        } else {
          setDbStatus('empty');
        }

        const { data: dbNotes, error: nErr } = await supabaseBrowserClient
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!nErr && dbNotes && dbNotes.length > 0) {
          setNotes(dbNotes as NoteItem[]);
        }

        // Fetch Google Classroom coursework sync items (only active, pending/unsubmitted)
        const { data: dbClassroom, error: clErr } = await supabaseBrowserClient
          .from('classroom_sync')
          .select('*')
          .neq('state', 'TURNED_IN')
          .neq('state', 'RETURNED')
          .order('due_date', { ascending: true });

        if (!clErr && dbClassroom && dbClassroom.length > 0) {
          setClassroomCount(dbClassroom.length);

          // 1. Process tasks with due_date, converting accurately to America/Argentina/Buenos_Aires (GMT-3)
          const classroomEvents: CalendarEvent[] = (dbClassroom as any[])
            .filter((item) => Boolean(item.due_date))
            .map((item) => {
              const due = new Date(item.due_date);
              const eventDate = getArgentinaDateString(due); // "2026-10-05" in BA
              const timeFormatted = getArgentinaTimeString(due); // "07:59" in BA
              const startTime = `${timeFormatted}:00`;
              const startMin = timeStringToMinutes(timeFormatted);
              const endMin = Math.min(23 * 60 + 59, startMin + 60);
              const endTime = `${minutesToTimeString(endMin)}:00`;

              return {
                id: `classroom-${item.id}`,
                title: `📚 ${item.course_name}: ${item.title}`,
                description: item.description
                  ? `${item.description}\n\nEnlace: ${item.alternate_link || ''}`
                  : `Entrega de Google Classroom. Curso: ${item.course_name}\n\nEnlace: ${item.alternate_link || ''}`,
                event_date: eventDate,
                start_time: startTime,
                end_time: endTime,
                tier: 'tier_3' as const,
                color: 'orange' as const,
                is_inamovible: false,
                difficulty_score: 3,
                classroom_coursework_id: item.coursework_id,
                created_from: 'classroom_sync' as const,
                created_at: item.last_synced_at || new Date().toISOString(),
                updated_at: item.last_synced_at || new Date().toISOString(),
              };
            });

          // 2. Process tasks WITHOUT due_date from active 2026 courses
          const noDueList = (dbClassroom as any[]).filter((item) => {
            if (item.due_date) return false;
            const c = (item.course_name || '').toLowerCase();
            return (
              c.includes('2026') ||
              c.includes('seguridad') ||
              c.includes('régimen') ||
              c.includes('educación física')
            );
          });
          setClassroomNoDueTasks(noDueList);

          setEvents((prev) => {
            const existingCoursework = new Set(
              prev.map((e) => e.classroom_coursework_id).filter(Boolean)
            );
            const toAdd = classroomEvents.filter(
              (ce) => !existingCoursework.has(ce.classroom_coursework_id)
            );
            return [...prev, ...toAdd];
          });

          // Proactive native device notification for imminent Classroom deliveries
          if (
            typeof window !== 'undefined' &&
            'Notification' in window &&
            Notification.permission === 'granted'
          ) {
            const now = new Date();
            const imminent = classroomEvents.find((ce) => {
              const due = new Date(`${ce.event_date}T${ce.start_time}`);
              const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
              return diffHours > 0 && diffHours <= 36;
            });

            if (imminent && !sessionStorage.getItem(`notified_${imminent.id}`)) {
              sessionStorage.setItem(`notified_${imminent.id}`, 'true');
              new Notification('🚨 Ritmo: Entrega Inminente de Classroom', {
                body: `${imminent.title} vence pronto. ¡No te cuelgues!`,
                icon: '/icons/icon-192.png',
              });
            }
          }
        }
      } catch (err) {
        console.warn('Supabase no conectado aún; usando dataset real local.', err);
        setDbStatus('missing_tables');
      }
    }
    syncWithSupabase();
  }, []);

  // Handler to sync real data into Supabase from UI
  const handlePushRealDataToSupabase = async () => {
    setIsSyncingDb(true);
    setSyncFeedback(null);
    try {
      const rawEvents = generateRealOctoberEvents();
      const realEvents = rawEvents.map(({ is_inamovible, ...rest }) => rest);
      const realNotes = generateRealNotes().map((n) => ({ ...n, linked_event_id: null }));

      const { error: evErr } = await supabaseBrowserClient
        .from('events')
        .upsert(realEvents, { onConflict: 'id' });

      if (evErr) {
        if (evErr.code === 'PGRST205' || evErr.message?.includes('schema cache')) {
          setDbStatus('missing_tables');
          setSyncFeedback('Las tablas no existen aún en Supabase. Debes ejecutar el script SQL en el panel de Supabase.');
        } else {
          setSyncFeedback(`Error de Supabase: ${evErr.message}`);
        }
        setIsSyncingDb(false);
        return;
      }

      const { error: noteErr } = await supabaseBrowserClient
        .from('notes')
        .upsert(realNotes, { onConflict: 'id' });

      if (noteErr) {
        setSyncFeedback(`Eventos sincronizados, error en notas: ${noteErr.message}`);
      } else {
        setEvents(rawEvents);
        setNotes(realNotes);
        setDbStatus('connected');
        setSyncFeedback(`¡Éxito! ${realEvents.length} eventos y ${realNotes.length} notas sincronizados.`);
      }
    } catch (e: any) {
      setSyncFeedback(`Error de red: ${e?.message || 'Verifica tu conexión'}`);
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Filter events based on focus mode
  const displayedEvents = useMemo(() => {
    if (!isFocusMode) return events;
    return events.filter((e) => e.tier === 'tier_1' || e.color === 'red');
  }, [events, isFocusMode]);

  // Handlers
  const handlePrevMonth = () => setCurrentDate((prev) => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentDate((prev) => addMonths(prev, 1));
  const handleTodayClick = () => {
    const today = new Date('2026-10-04T12:00:00');
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const handleSelectDate = (date: Date) => {
    setSelectedDate(date);

    // Sync currentDate if date is in a different month
    if (date.getMonth() !== currentDate.getMonth() || date.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1, 12, 0, 0));
    }

    // Auto-scroll directly to selected day in agenda feed
    setTimeout(() => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const targetEl = document.getElementById(`day-${dateStr}`) || document.getElementById('agenda-section');
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleSyncClassroom = async () => {
    setIsSyncingClassroom(true);
    setClassroomFeedback(null);
    try {
      const res = await fetch('/api/cron/classroom-sync');
      const data = await res.json();
      if (data.success) {
        setClassroomFeedback(`¡Sincronizado! ${data.coursesFound} cursos y ${data.tasksSyncedCount} tareas.`);
        const { data: dbClassroom } = await supabaseBrowserClient
          .from('classroom_sync')
          .select('*')
          .order('due_date', { ascending: true });
        if (dbClassroom) setClassroomCount(dbClassroom.length);
      } else {
        setClassroomFeedback(data.error || 'No se pudo sincronizar Classroom.');
      }
    } catch (e: any) {
      setClassroomFeedback('Error al sincronizar Classroom.');
    } finally {
      setIsSyncingClassroom(false);
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    setDriveFeedback(null);
    try {
      const res = await fetch('/api/drive/sync', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setDriveFeedback(`¡Sincronizado! ${data.syncedCount} notas en Drive para NotebookLM.`);
      } else {
        setDriveFeedback('Error al sincronizar notas con Drive.');
      }
    } catch {
      setDriveFeedback('Error de red al sincronizar con Drive.');
    } finally {
      setIsSyncingDrive(false);
      setTimeout(() => setDriveFeedback(null), 5000);
    }
  };

  const handleSelectMonthYear = (year: number, monthIndex: number) => {
    const newMonthDate = new Date(year, monthIndex, 1, 12, 0, 0);
    setCurrentDate(newMonthDate);
    const maxDays = new Date(year, monthIndex + 1, 0).getDate();
    const currentDay = selectedDate.getDate();
    const clampedDay = Math.min(currentDay, maxDays);
    setSelectedDate(new Date(year, monthIndex, clampedDay, 12, 0, 0));
    setIsMonthYearPickerOpen(false);
  };

  const handleCreateEvent = async (
    newEventData: Omit<CalendarEvent, 'id' | 'is_inamovible' | 'created_at' | 'updated_at'>
  ) => {
    const newEvent: CalendarEvent = {
      ...newEventData,
      id: `ev-${Date.now()}`,
      is_inamovible: newEventData.tier === 'tier_1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setEvents((prev) => [...prev, newEvent]);

    try {
      const { is_inamovible, ...dbPayload } = newEvent;
      await supabaseBrowserClient.from('events').insert([dbPayload]);
    } catch (e) {
      console.warn('Error guardando evento en Supabase:', e);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
    try {
      await supabaseBrowserClient.from('events').delete().eq('id', id);
    } catch (e) {
      console.warn('Error eliminando evento en Supabase:', e);
    }
  };

  const handleUpdateEventTime = async (
    eventId: string,
    newStartTime: string,
    newEndTime: string
  ): Promise<boolean> => {
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id === eventId) {
          return {
            ...e,
            start_time: newStartTime,
            end_time: newEndTime,
            updated_at: new Date().toISOString(),
          };
        }
        return e;
      })
    );

    try {
      await supabaseBrowserClient
        .from('events')
        .update({
          start_time: newStartTime,
          end_time: newEndTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);
    } catch (e) {
      console.warn('Error actualizando horario en Supabase:', e);
    }
    return true;
  };

  // Notes handlers
  const handleAddNote = async (newNoteData: Omit<NoteItem, 'id' | 'created_at' | 'updated_at'>) => {
    const newNote: NoteItem = {
      ...newNoteData,
      id: `note-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);

    try {
      await supabaseBrowserClient.from('notes').insert([newNote]);
    } catch (e) {
      console.warn('Error guardando nota en Supabase:', e);
    }
  };

  const handleToggleNoteStatus = async (id: string) => {
    const updated = notes.find((n) => n.id === id);
    if (!updated) return;
    const newStatus = !updated.is_completed;

    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_completed: newStatus } : n))
    );

    try {
      await supabaseBrowserClient
        .from('notes')
        .update({ is_completed: newStatus, updated_at: new Date().toISOString() })
        .eq('id', id);
    } catch (e) {
      console.warn('Error actualizando estado de nota en Supabase:', e);
    }
  };

  const handleDeleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    try {
      await supabaseBrowserClient.from('notes').delete().eq('id', id);
    } catch (e) {
      console.warn('Error eliminando nota en Supabase:', e);
    }
  };

  const currentMonthFormatted = formatDateSafe(currentDate, 'MMMM yyyy');

  return (
    <div className="flex flex-col h-screen w-full bg-ritmo-bg overflow-hidden text-ritmo-ink">
      {/* Top Header */}
      <TopHeader
        currentDateText={currentMonthFormatted}
        isFocusMode={isFocusMode}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onTodayClick={handleTodayClick}
        onSearchClick={() => {}}
        onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
        onOpenMonthYearPicker={() => setIsMonthYearPickerOpen(true)}
      />

      {/* Main Content Area based on Active Bottom Tab */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {activeTab === 'calendar' && (
          <div className="flex-1 overflow-y-auto pb-24 scroll-smooth">
            {/* Full-Screen Hero Month View with swipe navigation */}
            <MonthHeaderCollapsible
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={displayedEvents}
              onSelectDate={handleSelectDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />

            {/* Continuous Vertical Feed of Days and Events */}
            <div id="agenda-section" className="border-t border-ritmo-line/80 bg-white">
              <div className="px-4 py-2.5 bg-ritmo-soft/80 flex items-center justify-between border-b border-ritmo-line sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-ritmo-purple font-manrope">
                    Actividades: {formatDateSafe(selectedDate, "EEEE d 'de' MMMM")}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-ritmo-purple/10 text-ritmo-purple">
                  {displayedEvents.filter((e) => e.event_date === selectedDateStr).length} actividades
                </span>
              </div>
              <AgendaFeed
                events={displayedEvents}
                selectedDateStr={selectedDateStr}
                classroomNoDueTasks={classroomNoDueTasks}
                onEventClick={(event: CalendarEvent) => setSelectedEventForModal(event)}
                onAddEventForDate={(dateStr: string) => {
                  setSelectedDate(new Date(`${dateStr}T12:00:00`));
                  setIsQuickAddOpen(true);
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <TactileTimeline
            dateStr={selectedDateStr}
            events={displayedEvents}
            onUpdateEventTime={handleUpdateEventTime}
          />
        )}

        {activeTab === 'notes' && (
          <NotesContainer
            selectedDateStr={selectedDateStr}
            notes={notes}
            onAddNote={handleAddNote}
            onToggleNoteStatus={handleToggleNoteStatus}
            onDeleteNote={handleDeleteNote}
          />
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
            <div className="rounded-2xl bg-white p-5 shadow-sm border border-ritmo-line space-y-4">
              <h2 className="font-manrope text-base font-extrabold text-ritmo-ink flex items-center gap-2">
                <Settings className="w-5 h-5 text-ritmo-purple" />
                Configuración del Asistente Ritmo
              </h2>

              <div className="space-y-3 text-xs">
                {/* Database Sync Card */}
                <div className="p-3.5 rounded-xl bg-ritmo-soft border border-ritmo-line/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-ritmo-purple" />
                      <div>
                        <p className="font-bold text-ritmo-ink">Base de Datos Supabase</p>
                        <p className="text-[11px] text-ritmo-muted">
                          {dbStatus === 'connected' && 'Sincronizado con tablas remotas'}
                          {dbStatus === 'empty' && 'Tablas vacías (listo para sembrar)'}
                          {dbStatus === 'missing_tables' && 'Tablas pendientes de crear en SQL'}
                          {dbStatus === 'checking' && 'Comprobando conexión...'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        dbStatus === 'connected'
                          ? 'bg-green-50 text-ritmo-green border-green-200'
                          : dbStatus === 'missing_tables'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-blue-50 text-ritmo-blue border-blue-200'
                      }`}
                    >
                      {dbStatus === 'connected' ? 'En Línea' : dbStatus === 'missing_tables' ? 'Falta SQL' : 'Conectando'}
                    </span>
                  </div>

                  {dbStatus === 'missing_tables' && (
                    <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-800 space-y-1">
                      <div className="flex items-center gap-1 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        Paso pendiente en Supabase Dashboard:
                      </div>
                      <p>
                        Abre tu proyecto de Supabase, ve a <strong>SQL Editor</strong>, pega el contenido del archivo de migración y presiona <strong>Run</strong>.
                      </p>
                      <a
                        href="https://supabase.com/dashboard/project/fvqwfrjpoadvvbskgddz/sql/new"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-ritmo-purple underline text-[10px] pt-1"
                      >
                        Abrir SQL Editor en Supabase <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  <button
                    onClick={handlePushRealDataToSupabase}
                    disabled={isSyncingDb}
                    className="w-full py-2 px-3 rounded-lg bg-ritmo-purple text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-ritmo-purple/90 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                    {isSyncingDb ? 'Sincronizando...' : '🌱 Cargar Datos Reales a Supabase'}
                  </button>

                  {syncFeedback && (
                    <p className="text-[11px] font-medium text-ritmo-purple bg-purple-50 p-2 rounded border border-purple-100">
                      {syncFeedback}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-ritmo-soft">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-ritmo-green" />
                    <div>
                      <p className="font-bold text-ritmo-ink">Modo Monousuario Soberano</p>
                      <p className="text-ritmo-muted">Propietario (GMT-3 Buenos Aires)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-ritmo-green px-2 py-0.5 rounded-full bg-green-50 border border-green-200">
                    Activo
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-ritmo-soft">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-ritmo-purple" />
                    <div>
                      <p className="font-bold text-ritmo-ink">Google Gemini 2.0 Flash</p>
                      <p className="text-ritmo-muted">Audio OGG/Opus & Visión Multimodal</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-ritmo-purple px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200">
                    Conectado
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-ritmo-soft">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-ritmo-blue" />
                    <div>
                      <p className="font-bold text-ritmo-ink">Telegram Bot Webhook</p>
                      <p className="text-ritmo-muted">@ritmo_lucas_bot</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-ritmo-blue px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                    Listo
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-ritmo-soft border border-ritmo-line/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-ritmo-blue" />
                      <div>
                        <p className="font-bold text-ritmo-ink">Google Classroom (tv286206@gmail.com)</p>
                        <p className="text-[11px] text-ritmo-muted">
                          {classroomCount > 0
                            ? `${classroomCount} tareas y entregas sincronizadas`
                            : '27 cursos activos vinculados'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-ritmo-blue px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200">
                      Conectado
                    </span>
                  </div>

                  <button
                    onClick={handleSyncClassroom}
                    disabled={isSyncingClassroom}
                    className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingClassroom ? 'animate-spin' : ''}`} />
                    {isSyncingClassroom ? 'Sincronizando Classroom...' : '🔄 Sincronizar Classroom Ahora'}
                  </button>

                  {classroomFeedback && (
                    <p className="text-[11px] font-medium text-blue-700 bg-blue-50 p-2 rounded border border-blue-100">
                      {classroomFeedback}
                    </p>
                  )}
                </div>

                {/* Google Drive & NotebookLM Source Feed */}
                <div className="p-3 rounded-xl bg-ritmo-soft border border-ritmo-line/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-ritmo-purple" />
                      <div>
                        <p className="font-bold text-ritmo-ink">Google NotebookLM & Drive</p>
                        <p className="text-[11px] text-ritmo-muted">
                          Carpeta viva: &quot;Ritmo - UTN Apuntes&quot;
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://notebooklm.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-ritmo-purple px-2 py-0.5 rounded-full bg-purple-50 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 transition-colors"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <button
                    onClick={handleSyncDrive}
                    disabled={isSyncingDrive}
                    className="w-full py-1.5 px-3 rounded-lg bg-ritmo-purple hover:bg-ritmo-purple/90 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                    {isSyncingDrive ? 'Sincronizando con Drive...' : '☁️ Sincronizar Apuntes con Drive'}
                  </button>

                  {driveFeedback && (
                    <p className="text-[11px] font-medium text-ritmo-purple bg-purple-50 p-2 rounded border border-purple-200">
                      {driveFeedback}
                    </p>
                  )}
                </div>

                {/* Mobile / Device Push Notifications */}
                <div className="p-3.5 rounded-xl bg-ritmo-soft border border-ritmo-line/60 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-ritmo-purple" />
                      <div>
                        <p className="font-bold text-ritmo-ink">Notificaciones en el Celular</p>
                        <p className="text-[11px] text-ritmo-muted">
                          {notificationPermission === 'granted'
                            ? 'Alertas activas para entregas y exámenes'
                            : notificationPermission === 'denied'
                            ? 'Bloqueadas en ajustes de tu navegador'
                            : 'Avisos directos en tu pantalla de bloqueo'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        notificationPermission === 'granted'
                          ? 'bg-green-50 text-ritmo-green border-green-200'
                          : notificationPermission === 'denied'
                          ? 'bg-red-50 text-ritmo-red border-red-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {notificationPermission === 'granted'
                        ? 'Activas'
                        : notificationPermission === 'denied'
                        ? 'Bloqueadas'
                        : 'Pendiente'}
                    </span>
                  </div>

                  {notificationPermission !== 'granted' && (
                    <button
                      onClick={handleRequestNotificationPermission}
                      className="w-full py-2 px-3 rounded-lg bg-ritmo-purple text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:bg-ritmo-purple/90 active:scale-[0.98] transition-all"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      🔔 Activar Notificaciones en este Dispositivo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#fff0f1] p-4 border border-[#ff5d63]/20 text-xs">
              <h3 className="font-bold text-[#ff5d63] flex items-center gap-1.5 mb-1">
                <BookOpen className="w-4 h-4" /> Filosofía del Sistema Ritmo
              </h3>
              <p className="text-ritmo-muted leading-relaxed">
                &quot;El calendario no intenta mostrar todo: intenta hacerte entender tu mes. El color se usa exclusivamente cuando aporta contexto.&quot;
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) */}
      <FAB
        onClick={() => setIsQuickAddOpen(true)}
        ariaLabel="Crear nuevo bloque de calendario"
      />

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />

      {/* Modals */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        defaultDateStr={selectedDateStr}
        onSaveEvent={handleCreateEvent}
      />

      <EventDetailModal
        event={selectedEventForModal}
        isOpen={Boolean(selectedEventForModal)}
        onClose={() => setSelectedEventForModal(null)}
        onDelete={handleDeleteEvent}
      />

      <MonthYearPickerModal
        isOpen={isMonthYearPickerOpen}
        onClose={() => setIsMonthYearPickerOpen(false)}
        currentDate={currentDate}
        onSelectMonthYear={handleSelectMonthYear}
      />
    </div>
  );
}
