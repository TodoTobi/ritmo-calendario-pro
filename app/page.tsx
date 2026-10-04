'use client';

import React, { useState, useMemo } from 'react';
import { TopHeader } from '@/components/ui/TopHeader';
import { BottomNav, NavTab } from '@/components/ui/BottomNav';
import { FAB } from '@/components/ui/FAB';
import { MonthHeaderCollapsible } from '@/components/calendar/MonthHeaderCollapsible';
import { AgendaFeed } from '@/components/calendar/AgendaFeed';
import { TactileTimeline } from '@/components/timeline/TactileTimeline';
import { NotesContainer } from '@/components/notes/NotesContainer';
import { QuickAddModal } from '@/components/modals/QuickAddModal';
import { EventDetailModal } from '@/components/modals/EventDetailModal';
import { CalendarEvent, NoteItem } from '@/types/database.types';
import {
  formatDateSafe,
  addMonths,
  subMonths,
  format,
} from '@/lib/date-utils';
import { Settings, ShieldCheck, RefreshCw, Smartphone, BookOpen, Bot } from 'lucide-react';

// Seed events reflective of Lucas's schedule (October 2026)
const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-devocional-today',
    title: 'Devocional Diario con Dios',
    description: 'Oración matutina y lectura bíblica',
    event_date: '2026-10-04',
    start_time: '06:45:00',
    end_time: '07:30:00',
    tier: 'tier_1',
    color: 'green',
    is_inamovible: true,
    difficulty_score: 1,
    classroom_coursework_id: null,
    created_from: 'template',
    created_at: '2026-10-04T06:00:00Z',
    updated_at: '2026-10-04T06:00:00Z',
  },
  {
    id: 'ev-utn-cursada',
    title: 'UTN Ingreso — Cursada Sábados',
    description: 'Matemática y Física — Aula Magna UTN FRBA',
    event_date: '2026-10-04',
    start_time: '08:00:00',
    end_time: '14:30:00',
    tier: 'tier_1',
    color: 'red',
    is_inamovible: true,
    difficulty_score: 5,
    classroom_coursework_id: null,
    created_from: 'template',
    created_at: '2026-10-04T06:00:00Z',
    updated_at: '2026-10-04T06:00:00Z',
  },
  {
    id: 'ev-lamina-3',
    title: 'Lámina 3 — Vistas Diédricas y Cortes',
    description: 'Dibujo Técnico Formato A3. Tinta y escuadras.',
    event_date: '2026-10-04',
    start_time: '16:00:00',
    end_time: '18:00:00',
    tier: 'tier_3',
    color: 'orange',
    is_inamovible: false,
    difficulty_score: 4,
    classroom_coursework_id: null,
    created_from: 'web',
    created_at: '2026-10-04T06:00:00Z',
    updated_at: '2026-10-04T06:00:00Z',
  },
  {
    id: 'ev-gimnasio',
    title: 'Gimnasio y Acondicionamiento',
    description: 'Entrenamiento de fuerza y tren superior',
    event_date: '2026-10-04',
    start_time: '19:00:00',
    end_time: '20:15:00',
    tier: 'tier_3',
    color: 'green',
    is_inamovible: false,
    difficulty_score: 2,
    classroom_coursework_id: null,
    created_from: 'web',
    created_at: '2026-10-04T06:00:00Z',
    updated_at: '2026-10-04T06:00:00Z',
  },
  {
    id: 'ev-parcial-utn',
    title: 'PARCIAL UTN MATEMÁTICA',
    description: 'Evaluación integradora de ingreso en UTN FRBA',
    event_date: '2026-10-24',
    start_time: '08:00:00',
    end_time: '12:00:00',
    tier: 'tier_1',
    color: 'red',
    is_inamovible: true,
    difficulty_score: 5,
    classroom_coursework_id: null,
    created_from: 'web',
    created_at: '2026-10-04T06:00:00Z',
    updated_at: '2026-10-04T06:00:00Z',
  },
  {
    id: 'ev-ingles',
    title: 'Instituto de Inglés Avanzado',
    description: 'Clase sincrónica de gramática y conversación',
    event_date: '2026-10-06',
    start_time: '18:30:00',
    end_time: '20:30:00',
    tier: 'tier_1',
    color: 'blue',
    is_inamovible: true,
    difficulty_score: 3,
    classroom_coursework_id: null,
    created_from: 'template',
    created_at: '2026-10-04T06:00:00Z',
    updated_at: '2026-10-04T06:00:00Z',
  },
];

const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note-1',
    title: 'Fórmulas Clave de Límites Indeterminados',
    content_markdown: 'L’Hôpital: lim f(x)/g(x) = lim f’(x)/g’(x) cuando 0/0 o inf/inf.\nRevisar factorización de polinomios.',
    category_tag: '#utn',
    linked_date: '2026-10-04',
    linked_event_id: 'ev-utn-cursada',
    is_completed: false,
    synced_to_drive: true,
    drive_file_id: 'drive_doc_99182',
    created_at: '2026-10-04T09:30:00Z',
    updated_at: '2026-10-04T09:30:00Z',
  },
  {
    id: 'note-2',
    title: 'Comprar hojas A3 romani y microfibras 0.2',
    content_markdown: 'Pasar por la librería técnica antes del viernes.',
    category_tag: '#dibujo',
    linked_date: '2026-10-04',
    linked_event_id: null,
    is_completed: false,
    synced_to_drive: false,
    drive_file_id: null,
    created_at: '2026-10-04T10:15:00Z',
    updated_at: '2026-10-04T10:15:00Z',
  },
  {
    id: 'note-3',
    title: 'Idea de Proyecto de Automatización con Telegram',
    content_markdown: 'Conectar Webhook con Google Calendar y recibir resúmenes en audio.',
    category_tag: '#ideas',
    linked_date: null,
    linked_event_id: null,
    is_completed: false,
    synced_to_drive: false,
    drive_file_id: null,
    created_at: '2026-10-03T18:00:00Z',
    updated_at: '2026-10-03T18:00:00Z',
  },
];

export default function RitmoMainPage() {
  const [activeTab, setActiveTab] = useState<NavTab>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date('2026-10-04T12:00:00'));
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-10-04T12:00:00'));
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  // Data collections state
  const [events, setEvents] = useState<CalendarEvent[]>(INITIAL_EVENTS);
  const [notes, setNotes] = useState<NoteItem[]>(INITIAL_NOTES);

  // Modals state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<CalendarEvent | null>(null);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');

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

  const handleCreateEvent = (
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
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
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
    return true;
  };

  // Notes handlers
  const handleAddNote = (newNoteData: Omit<NoteItem, 'id' | 'created_at' | 'updated_at'>) => {
    const newNote: NoteItem = {
      ...newNoteData,
      id: `note-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  const handleToggleNoteStatus = (id: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_completed: !n.is_completed } : n))
    );
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const currentMonthFormatted = formatDateSafe(currentDate, 'MMMM yyyy');

  return (
    <div className="flex min-h-screen flex-col bg-ritmo-bg relative">
      {/* Top Header */}
      <TopHeader
        currentDateText={currentMonthFormatted}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onTodayClick={handleTodayClick}
        onSearchClick={() => setIsQuickAddOpen(true)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
      />

      {/* Main Content Area switched by Active Tab */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {activeTab === 'calendar' && (
          <>
            <MonthHeaderCollapsible
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={displayedEvents}
              onSelectDate={handleSelectDate}
            />
            <AgendaFeed
              events={displayedEvents}
              selectedDateStr={selectedDateStr}
              onEventClick={(ev) => setSelectedEventForModal(ev)}
              onAddEventForDate={(d) => {
                setSelectedDate(new Date(d));
                setIsQuickAddOpen(true);
              }}
            />
          </>
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
                <div className="flex items-center justify-between p-3 rounded-xl bg-ritmo-soft">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-ritmo-green" />
                    <div>
                      <p className="font-bold text-ritmo-ink">Modo Monousuario Soberano</p>
                      <p className="text-ritmo-muted">Lucas (GMT-3 Buenos Aires)</p>
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
                      <p className="text-ritmo-muted">/api/telegram/webhook</p>
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
    </div>
  );
}
