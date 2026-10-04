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

        if (dbEvents && dbEvents.length > 0) {
          setEvents(dbEvents as CalendarEvent[]);
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
            <div className="border-t border-ritmo-line/80 bg-white">
              <div className="px-4 py-2.5 bg-ritmo-soft/60 flex items-center justify-between border-b border-ritmo-line">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-ritmo-muted font-manrope">
                  Agenda del Mes
                </span>
              </div>
              <AgendaFeed
                events={displayedEvents}
                selectedDateStr={selectedDateStr}
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

                <div className="flex items-center justify-between p-3 rounded-xl bg-ritmo-soft">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-ritmo-orange" />
                    <div>
                      <p className="font-bold text-ritmo-ink">Google Classroom Sync</p>
                      <p className="text-ritmo-muted">Tareas y fechas límite automáticas</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-ritmo-orange px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200">
                    Standby
                  </span>
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
