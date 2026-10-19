'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
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

  // Google Classroom tasks collection
  const [classroomTasks, setClassroomTasks] = useState<any[]>([]);

  // Mobile / Browser Push Notification State
  const [notificationPermission, setNotificationPermission] = useState<string>('default');

  // Keep references to latest events and classroom tasks for interval checker
  const eventsRef = useRef(events);
  eventsRef.current = events;
  const classroomTasksRef = useRef(classroomTasks);
  classroomTasksRef.current = classroomTasks;

  // 1. Register '/sw.js' on mount when 'serviceWorker' in navigator
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[SW] Service Worker registrado exitosamente:', reg.scope);
        })
        .catch((err) => {
          console.warn('[SW] Error al registrar Service Worker:', err);
        });
    }
  }, []);

  // Update notification permission state on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // 2. Implement triggerDeviceNotification using navigator.serviceWorker.ready.then(reg => reg.showNotification(...)) with fallback to new Notification(...)
  const triggerDeviceNotification = (title: string, body: string, tag?: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const options: NotificationOptions & { renotify?: boolean } = {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: tag || 'ritmo-alert',
      renotify: true,
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title, options);
        })
        .catch((err) => {
          console.warn('[SW] Fallback a new Notification por error en Service Worker:', err);
          try {
            new Notification(title, options);
          } catch (e) {
            console.error(e);
          }
        });
    } else {
      try {
        new Notification(title, options);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Las notificaciones del sistema no están soportadas en este navegador.');
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        triggerDeviceNotification(
          '🔔 Ritmo — Notificaciones Activadas',
          '¡Listo! Recibirás alertas invasivas de entregas urgentes de Classroom y parciales.',
          'perm-activated'
        );
      }
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
    }
  };

  const handleTestDeviceNotification = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Las notificaciones del sistema no están soportadas en este navegador.');
      return;
    }
    let perm = Notification.permission;
    if (perm !== 'granted') {
      perm = await Notification.requestPermission();
      setNotificationPermission(perm);
    }
    if (perm === 'granted') {
      triggerDeviceNotification(
        '🔔 Prueba de Notificación — Ritmo',
        '¡Excelente! Las notificaciones en este dispositivo están funcionando correctamente.',
        'test-device-notification'
      );
    } else {
      alert('Permiso de notificaciones no otorgado. Habilitalo en la configuración del navegador.');
    }
  };

  // 3. Interval checker (every 60s) for upcoming events (<= 30 min) and Classroom tasks (<= 24 h)
  useEffect(() => {
    const checkUpcomingAlerts = () => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      const nowMs = Date.now();

      // Check upcoming calendar events starting in <= 30 minutes
      for (const ev of eventsRef.current) {
        if (!ev.event_date || !ev.start_time) continue;
        if (ev.created_from === 'classroom_sync') continue;

        const parts = ev.start_time.trim().split(':');
        const h = (parts[0] || '0').padStart(2, '0');
        const m = (parts[1] || '0').padStart(2, '0');
        const s = (parts[2] || '0').slice(0, 2).padStart(2, '0');
        const cleanTime = `${h}:${m}:${s}`;

        const eventStart = new Date(`${ev.event_date}T${cleanTime}-03:00`);
        const diffMs = eventStart.getTime() - nowMs;
        const diffMinutes = diffMs / (1000 * 60);

        if (diffMinutes >= 0 && diffMinutes <= 30) {
          const storageKey = `notified_ev_${ev.id}_${ev.event_date}`;
          try {
            if (!localStorage.getItem(storageKey)) {
              localStorage.setItem(storageKey, 'true');
              const minsLeft = Math.max(1, Math.round(diffMinutes));
              const tierEmoji = ev.tier === 'tier_1' ? '🔴' : ev.tier === 'tier_2' ? '🟡' : '🟢';
              triggerDeviceNotification(
                `⏰ Evento Inminente: ${ev.title}`,
                `${tierEmoji} Comienza a las ${cleanTime.slice(0, 5)} hs (en aprox. ${minsLeft} min).`,
                `ev-${ev.id}`
              );
            }
          } catch (e) {
            console.warn('Storage check error for event:', e);
          }
        }
      }

      // Check upcoming Classroom tasks due in <= 24 hours
      for (const task of classroomTasksRef.current) {
        if (!task.due_date) continue;
        const dueDate = new Date(task.due_date);
        const diffMs = dueDate.getTime() - nowMs;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours >= 0 && diffHours <= 24) {
          const storageKey = `notified_cl_${task.id}`;
          try {
            if (!localStorage.getItem(storageKey)) {
              localStorage.setItem(storageKey, 'true');
              const hoursLeft = Math.max(1, Math.round(diffHours));
              triggerDeviceNotification(
                `🚨 Entrega de Classroom: ${task.title}`,
                `📚 ${task.course_name || 'Classroom'} — Vence en aprox. ${hoursLeft} hs. ¡No te cuelgues!`,
                `cl-${task.id}`
              );
            }
          } catch (e) {
            console.warn('Storage check error for task:', e);
          }
        }
      }
    };

    const timer = setTimeout(checkUpcomingAlerts, 2000);
    const interval = setInterval(checkUpcomingAlerts, 60000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

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
          setClassroomTasks(dbClassroom);
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
        if (dbClassroom) {
          setClassroomTasks(dbClassroom);
          setClassroomCount(dbClassroom.length);
        }
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
    <div className="flex flex-col h-screen w-full bg-white overflow-hidden text-duo-charcoal font-nunito">
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
      <main className="flex-1 flex flex-col overflow-hidden relative bg-white">
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
            <div id="agenda-section" className="border-t-2 border-duo-border-light bg-white">
              <div className="px-4 py-2.5 bg-white/95 flex items-center justify-between border-b-2 border-duo-border-light sticky top-0 z-10 backdrop-blur-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-duo-charcoal">
                    Actividades: {formatDateSafe(selectedDate, "EEEE d 'de' MMMM")}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-xl bg-duo-green-light text-duo-green border-2 border-duo-green uppercase tracking-wide">
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28 bg-white">
            <div className="rounded-2xl bg-white p-5 border-2 border-duo-border-light shadow-duo-white space-y-4">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-duo-charcoal flex items-center gap-2">
                <Settings className="w-5 h-5 text-duo-green" />
                Configuración del Asistente Ritmo
              </h2>

              <div className="space-y-3 text-xs">
                {/* Database Sync Card */}
                <div className="p-4 rounded-xl bg-[#f7f7f7] border-2 border-duo-border-light space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-duo-green" />
                      <div>
                        <p className="font-extrabold text-duo-charcoal">Base de Datos Supabase</p>
                        <p className="text-[11px] text-duo-gray font-bold">
                          {dbStatus === 'connected' && 'Sincronizado con tablas remotas'}
                          {dbStatus === 'empty' && 'Tablas vacías (listo para sembrar)'}
                          {dbStatus === 'missing_tables' && 'Tablas pendientes de crear en SQL'}
                          {dbStatus === 'checking' && 'Comprobando conexión...'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl border-2 ${
                        dbStatus === 'connected'
                          ? 'bg-duo-green-light text-duo-green border-duo-green'
                          : dbStatus === 'missing_tables'
                          ? 'bg-[#ffebee] text-[#ea2b2b] border-[#ff4b4b]'
                          : 'bg-[#ddf4ff] text-duo-blue border-duo-blue'
                      }`}
                    >
                      {dbStatus === 'connected' ? 'En Línea' : dbStatus === 'missing_tables' ? 'Falta SQL' : 'Conectando'}
                    </span>
                  </div>

                  {dbStatus === 'missing_tables' && (
                    <div className="p-3 rounded-xl bg-[#ffebee] border-2 border-[#ff4b4b] text-[11px] text-[#ea2b2b] space-y-1">
                      <div className="flex items-center gap-1 font-extrabold">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[#ea2b2b]" />
                        Paso pendiente en Supabase Dashboard:
                      </div>
                      <p className="font-bold">
                        Abre tu proyecto de Supabase, ve a <strong>SQL Editor</strong>, pega el contenido del archivo de migración y presiona <strong>Run</strong>.
                      </p>
                      <a
                        href="https://supabase.com/dashboard/project/fvqwfrjpoadvvbskgddz/sql/new"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-extrabold text-[#ea2b2b] underline text-[10px] pt-1"
                      >
                        Abrir SQL Editor en Supabase <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}

                  <button
                    onClick={handlePushRealDataToSupabase}
                    disabled={isSyncingDb}
                    className="w-full py-2.5 px-4 rounded-xl bg-duo-green text-white font-extrabold uppercase text-xs flex items-center justify-center gap-2 shadow-duo-green hover:opacity-95 active:translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                    {isSyncingDb ? 'Sincronizando...' : '🌱 Cargar Datos Reales a Supabase'}
                  </button>

                  {syncFeedback && (
                    <p className="text-xs font-extrabold text-duo-green bg-duo-green-light p-2 rounded-xl border-2 border-duo-green text-center">
                      {syncFeedback}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f7f7f7] border-2 border-duo-border-light">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-duo-green" />
                    <div>
                      <p className="font-extrabold text-duo-charcoal">Modo Monousuario Soberano</p>
                      <p className="text-duo-gray font-bold">Propietario (GMT-3 Buenos Aires)</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-duo-green px-2.5 py-0.5 rounded-xl bg-duo-green-light border-2 border-duo-green">
                    Activo
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f7f7f7] border-2 border-duo-border-light">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-duo-blue" />
                    <div>
                      <p className="font-extrabold text-duo-charcoal">Google Gemini 2.0 Flash</p>
                      <p className="text-duo-gray font-bold">Audio OGG/Opus & Visión Multimodal</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-duo-blue px-2.5 py-0.5 rounded-xl bg-[#ddf4ff] border-2 border-duo-blue">
                    Conectado
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f7f7f7] border-2 border-duo-border-light">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-duo-blue" />
                    <div>
                      <p className="font-extrabold text-duo-charcoal">Telegram Bot Webhook</p>
                      <p className="text-duo-gray font-bold">@ritmo_lucas_bot</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold uppercase text-duo-blue px-2.5 py-0.5 rounded-xl bg-[#ddf4ff] border-2 border-duo-blue">
                    Listo
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f7f7f7] border-2 border-duo-border-light space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-duo-blue" />
                      <div>
                        <p className="font-extrabold text-duo-charcoal">Google Classroom (tv286206@gmail.com)</p>
                        <p className="text-[11px] text-duo-gray font-bold">
                          {classroomCount > 0
                            ? `${classroomCount} tareas y entregas sincronizadas`
                            : '27 cursos activos vinculados'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase text-duo-blue px-2.5 py-0.5 rounded-xl bg-[#ddf4ff] border-2 border-duo-blue">
                      Conectado
                    </span>
                  </div>

                  <button
                    onClick={handleSyncClassroom}
                    disabled={isSyncingClassroom}
                    className="w-full py-2 px-4 rounded-xl bg-duo-blue hover:opacity-95 text-white font-extrabold uppercase tracking-wide text-xs flex items-center justify-center gap-2 shadow-duo-blue transition-all active:translate-y-0.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingClassroom ? 'animate-spin' : ''}`} />
                    {isSyncingClassroom ? 'Sincronizando Classroom...' : '🔄 Sincronizar Classroom Ahora'}
                  </button>

                  {classroomFeedback && (
                    <p className="text-xs font-extrabold text-duo-blue bg-[#ddf4ff] p-2 rounded-xl border-2 border-duo-blue text-center">
                      {classroomFeedback}
                    </p>
                  )}
                </div>

                {/* Google Drive & NotebookLM Source Feed */}
                <div className="p-3.5 rounded-xl bg-[#f7f7f7] border-2 border-duo-border-light space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-duo-green" />
                      <div>
                        <p className="font-extrabold text-duo-charcoal">Google NotebookLM & Drive</p>
                        <p className="text-[11px] text-duo-gray font-bold">
                          Carpeta viva: &quot;Ritmo - UTN Apuntes&quot;
                        </p>
                      </div>
                    </div>
                    <a
                      href="https://notebooklm.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-extrabold uppercase text-duo-charcoal px-2.5 py-0.5 rounded-xl bg-white border-2 border-duo-border-light hover:border-duo-green flex items-center gap-1 transition-colors"
                    >
                      <span>Abrir</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <button
                    onClick={handleSyncDrive}
                    disabled={isSyncingDrive}
                    className="w-full py-2 px-4 rounded-xl bg-duo-green hover:opacity-95 text-white font-extrabold uppercase tracking-wide text-xs flex items-center justify-center gap-2 shadow-duo-green transition-all active:translate-y-0.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                    {isSyncingDrive ? 'Sincronizando con Drive...' : '☁️ Sincronizar Apuntes con Drive'}
                  </button>

                  {driveFeedback && (
                    <p className="text-xs font-extrabold text-duo-green bg-duo-green-light p-2 rounded-xl border-2 border-duo-green text-center">
                      {driveFeedback}
                    </p>
                  )}
                </div>

                {/* Mobile / Device Push Notifications */}
                <div className="p-3.5 rounded-xl bg-[#f7f7f7] border-2 border-duo-border-light space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#ea2b2b]" />
                      <div>
                        <p className="font-extrabold text-duo-charcoal">Notificaciones en este Dispositivo</p>
                        <p className="text-[11px] text-duo-gray font-bold">
                          {notificationPermission === 'granted'
                            ? 'Alertas activas para entregas y eventos'
                            : notificationPermission === 'denied'
                            ? 'Bloqueadas en ajustes de tu navegador'
                            : 'Avisos directos en tu pantalla de bloqueo'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl border-2 ${
                        notificationPermission === 'granted'
                          ? 'bg-duo-green-light text-duo-green border-duo-green'
                          : notificationPermission === 'denied'
                          ? 'bg-[#ffebee] text-[#ea2b2b] border-[#ff4b4b]'
                          : 'bg-white text-duo-gray border-duo-border-light'
                      }`}
                    >
                      {notificationPermission === 'granted'
                        ? 'Activas'
                        : notificationPermission === 'denied'
                        ? 'Bloqueadas'
                        : 'Pendiente'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={handleTestDeviceNotification}
                      className="w-full py-2.5 px-4 rounded-xl bg-duo-charcoal text-white font-extrabold uppercase text-xs flex items-center justify-center gap-2 shadow-duo-sticker hover:opacity-95 active:translate-y-0.5 transition-all"
                    >
                      <Bell className="w-4 h-4 text-duo-green" />
                      🔔 Probar Notificación en este Dispositivo
                    </button>

                    {notificationPermission !== 'granted' && (
                      <button
                        type="button"
                        onClick={handleRequestNotificationPermission}
                        className="w-full py-2 px-4 rounded-xl bg-white border-2 border-duo-border-light text-duo-charcoal font-extrabold uppercase text-xs flex items-center justify-center gap-2 hover:bg-gray-50 active:translate-y-0.5 transition-all"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-duo-green" />
                        Habilitar Permiso del Sistema
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-duo-green-light/40 p-4 border-2 border-duo-green text-xs text-duo-charcoal">
              <h3 className="font-extrabold uppercase tracking-wide text-duo-charcoal flex items-center gap-1.5 mb-1 text-xs">
                <BookOpen className="w-4 h-4 text-duo-green" /> Filosofía del Sistema Duolingo
              </h3>
              <p className="text-duo-gray leading-relaxed font-bold">
                &quot;El calendario trata cada bloque como un sticker motivacional sobre papel blanco: verde #58cc02 para progreso y metas, azul #1cb0f6 para interactividad, y neutrales tranquilos para una mente enfocada.&quot;
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
