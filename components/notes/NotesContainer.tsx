import React, { useState, useMemo } from 'react';
import { NoteItem } from '@/types/database.types';
import { formatDayHeader } from '@/lib/date-utils';
import {
  Plus,
  CheckCircle,
  Circle,
  Search,
  BookOpen,
  Sparkles,
  Trash2,
  Cloud,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface NotesContainerProps {
  selectedDateStr: string;
  notes: NoteItem[];
  onAddNote: (newNote: Omit<NoteItem, 'id' | 'created_at' | 'updated_at'>) => void;
  onToggleNoteStatus: (id: string) => void;
  onDeleteNote: (id: string) => void;
}

type TabMode = 'daily' | 'backlog' | 'all';

const PREDEFINED_TAGS = [
  { tag: '#utn', color: 'bg-[#ffebee] text-[#ea2b2b] border-[#ff4b4b]' },
  { tag: '#dibujo', color: 'bg-[#fff9db] text-[#b88c00] border-[#ffc800]' },
  { tag: '#devocional', color: 'bg-duo-green-light text-duo-green border-duo-green' },
  { tag: '#proyectos', color: 'bg-[#ddf4ff] text-duo-blue border-duo-blue' },
  { tag: '#ideas', color: 'bg-white text-duo-charcoal border-duo-gray-faded' },
];

export const NotesContainer: React.FC<NotesContainerProps> = ({
  selectedDateStr,
  notes,
  onAddNote,
  onToggleNoteStatus,
  onDeleteNote,
}) => {
  const [activeTab, setActiveTab] = useState<TabMode>('daily');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCreatingNote, setIsCreatingNote] = useState<boolean>(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState<boolean>(false);
  const [syncDriveMsg, setSyncDriveMsg] = useState<string | null>(null);

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    setSyncDriveMsg(null);
    try {
      const res = await fetch('/api/drive/sync', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setSyncDriveMsg(`¡Sincronizado! ${data.syncedCount} notas en Drive para NotebookLM.`);
      } else {
        setSyncDriveMsg('Error al sincronizar con Drive');
      }
    } catch {
      setSyncDriveMsg('Error de red al sincronizar con Drive');
    } finally {
      setIsSyncingDrive(false);
      setTimeout(() => setSyncDriveMsg(null), 4000);
    }
  };

  // New Note Form State
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');
  const [newTag, setNewTag] = useState<string>('#general');
  const [newIsForToday, setNewIsForToday] = useState<boolean>(true);

  // Filter notes based on active tab, tag, and query
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      if (activeTab === 'daily') {
        if (note.linked_date !== selectedDateStr) return false;
      } else if (activeTab === 'backlog') {
        if (note.linked_date !== null) return false;
      }

      if (selectedTagFilter && note.category_tag !== selectedTagFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesContent = note.content_markdown.toLowerCase().includes(q);
        const matchesTag = note.category_tag.toLowerCase().includes(q);
        return matchesTitle || matchesContent || matchesTag;
      }

      return true;
    });
  }, [notes, activeTab, selectedDateStr, selectedTagFilter, searchQuery]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }

    onAddNote({
      title: newTitle.trim(),
      content_markdown: newContent.trim(),
      category_tag: newTag,
      linked_date: newIsForToday ? selectedDateStr : null,
      linked_event_id: null,
      is_completed: false,
      synced_to_drive: newTag === '#utn',
      drive_file_id: null,
    });

    setNewTitle('');
    setNewContent('');
    setIsCreatingNote(false);
  };

  const dayHeader = formatDayHeader(selectedDateStr);
  const dayLabel = `${dayHeader.label} ${dayHeader.dateNum}`;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden pb-24 font-nunito">
      {/* Segmented Tab Bar & Search Header */}
      <div className="bg-white px-4 pt-3 pb-3 border-b-2 border-duo-border-light space-y-3">
        {/* Clean 3-tab segmented control with Duolingo stickers */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#f7f7f7] border-2 border-duo-border-light">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`py-1.5 px-1 text-xs font-extrabold uppercase rounded-xl transition-all ${
              activeTab === 'daily'
                ? 'bg-duo-green text-white shadow-duo-green'
                : 'text-duo-gray hover:text-duo-charcoal'
            }`}
          >
            Del Día
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backlog')}
            className={`py-1.5 px-1 text-xs font-extrabold uppercase rounded-xl transition-all ${
              activeTab === 'backlog'
                ? 'bg-duo-green text-white shadow-duo-green'
                : 'text-duo-gray hover:text-duo-charcoal'
            }`}
          >
            Backlog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-1.5 px-1 text-xs font-extrabold uppercase rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-duo-green text-white shadow-duo-green'
                : 'text-duo-gray hover:text-duo-charcoal'
            }`}
          >
            Todas ({notes.length})
          </button>
        </div>

        {/* Search Bar & New Note Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-duo-gray absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar apuntes o etiquetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border-2 border-duo-border-light bg-[#f7f7f7] text-duo-charcoal placeholder:text-duo-gray focus:outline-none focus:border-duo-green transition-colors font-bold"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingNote(!isCreatingNote)}
            className="flex items-center gap-1.5 bg-duo-green text-white px-4 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide hover:opacity-95 shadow-duo-green active:translate-y-0.5 transition-all shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nota</span>
          </button>
        </div>

        {/* Tags horizontal filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTagFilter(null)}
            className={`text-xs px-3.5 py-1 rounded-xl font-extrabold uppercase whitespace-nowrap transition-all border-2 ${
              selectedTagFilter === null
                ? 'bg-duo-charcoal text-white border-duo-charcoal'
                : 'bg-white text-duo-gray border-duo-border-light hover:text-duo-charcoal'
            }`}
          >
            #todos
          </button>
          {PREDEFINED_TAGS.map(({ tag, color }) => {
            const isSelected = selectedTagFilter === tag;
            return (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedTagFilter(isSelected ? null : tag)}
                className={`text-xs px-3.5 py-1 rounded-xl font-extrabold uppercase border-2 whitespace-nowrap transition-all ${
                  isSelected ? 'ring-2 ring-duo-charcoal ring-offset-1 scale-105' : 'hover:opacity-90'
                } ${color}`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* NotebookLM / Drive Sync Ribbon */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[#f7f7f7] border-2 border-duo-border-light text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#ddf4ff] border-2 border-duo-blue flex items-center justify-center text-duo-blue shrink-0">
              <Cloud className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-duo-charcoal truncate block">
                NotebookLM & Drive
              </span>
              <span className="text-[11px] text-duo-gray font-bold">Apuntes #utn como fuente viva</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSyncDrive}
              disabled={isSyncingDrive}
              className="py-1 px-3 rounded-xl bg-duo-green text-white font-extrabold uppercase text-[11px] flex items-center gap-1 shadow-duo-green hover:opacity-95 active:translate-y-0.5 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingDrive ? 'animate-spin' : ''}`} />
              <span>{isSyncingDrive ? 'Sync...' : 'Sincronizar'}</span>
            </button>
            <a
              href="https://notebooklm.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-2.5 rounded-xl bg-white border-2 border-duo-border-light text-duo-charcoal font-extrabold text-[11px] flex items-center gap-1 hover:border-duo-green transition-colors"
              title="Abrir Google NotebookLM"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {syncDriveMsg && (
          <p className="text-xs font-extrabold text-duo-green bg-duo-green-light p-2 rounded-xl border-2 border-duo-green text-center animate-fadeIn">
            {syncDriveMsg}
          </p>
        )}
      </div>

      {/* Note Creation Form Drawer/Panel */}
      {isCreatingNote && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white p-5 border-b-2 border-duo-border-light space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold tracking-wider uppercase text-duo-charcoal flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-duo-green" />
              Nueva Nota o Apunte
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingNote(false)}
              className="text-xs font-extrabold text-duo-gray hover:text-duo-charcoal px-3 py-1 rounded-xl border-2 border-duo-border-light transition-colors"
            >
              Cancelar
            </button>
          </div>

          <input
            type="text"
            required
            placeholder="Título del apunte o tarea..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-xs font-extrabold px-4 py-2.5 rounded-xl border-2 border-duo-border-light focus:outline-none focus:border-duo-green transition-all bg-[#f7f7f7] text-duo-charcoal"
          />

          <textarea
            rows={3}
            placeholder="Detalles, fórmulas o pasos en Markdown..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full text-xs px-4 py-3 rounded-xl border-2 border-duo-border-light focus:outline-none focus:border-duo-green leading-relaxed font-bold transition-all bg-[#f7f7f7] text-duo-charcoal"
          />

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-duo-gray">Etiqueta:</span>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-xl border-2 border-duo-border-light bg-white font-extrabold text-duo-charcoal focus:outline-none focus:border-duo-green"
              >
                <option value="#general">#general</option>
                <option value="#utn">#utn (Sync Drive)</option>
                <option value="#dibujo">#dibujo</option>
                <option value="#devocional">#devocional</option>
                <option value="#proyectos">#proyectos</option>
                <option value="#ideas">#ideas</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer text-duo-charcoal select-none">
              <input
                type="checkbox"
                checked={newIsForToday}
                onChange={(e) => setNewIsForToday(e.target.checked)}
                className="rounded-lg border-2 border-duo-border-light text-duo-green focus:ring-duo-green"
              />
              <span>Vincular a fecha seleccionada</span>
            </label>

            <button
              type="submit"
              className="bg-duo-green text-white px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide hover:opacity-95 shadow-duo-green active:translate-y-0.5 transition-all ml-auto"
            >
              Guardar Nota
            </button>
          </div>
        </form>
      )}

      {/* Daily Mode Subtitle Indicator */}
      {activeTab === 'daily' && (
        <div className="px-5 pt-3 pb-1 flex items-center justify-between text-xs text-duo-gray font-bold">
          <span>{dayLabel}</span>
          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-xl bg-duo-green-light text-duo-green border-2 border-duo-green">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'apunte' : 'apuntes'}
          </span>
        </div>
      )}

      {/* Notes Stream with Duolingo Sticker Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-duo-border-light bg-[#f7f7f7] p-8 text-center text-duo-gray mt-4">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-duo-green" />
            <p className="text-sm font-extrabold text-duo-charcoal">No hay notas en esta sección</p>
            <p className="text-xs mt-1 text-duo-gray font-bold">
              {activeTab === 'daily'
                ? `No tienes notas vinculadas a ${selectedDateStr}.`
                : 'Tu backlog de ideas está vacío.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const tagObj = PREDEFINED_TAGS.find((p) => p.tag === note.category_tag);
            const tagStyle = tagObj?.color || 'bg-white text-duo-charcoal border-duo-gray-faded';

            return (
              <div
                key={note.id}
                className={`rounded-2xl bg-white p-4 border-2 shadow-duo-white transition-all duration-150 ${
                  note.is_completed
                    ? 'border-duo-border-light opacity-60 bg-gray-50'
                    : 'border-duo-border-light hover:border-duo-green'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => onToggleNoteStatus(note.id)}
                    aria-label={note.is_completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    className="mt-0.5 text-duo-green hover:scale-110 active:scale-95 transition-transform shrink-0"
                  >
                    {note.is_completed ? (
                      <CheckCircle className="w-6 h-6 text-duo-green fill-duo-green-light" />
                    ) : (
                      <Circle className="w-6 h-6 text-duo-border-light hover:text-duo-green stroke-[2.5]" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Metadata Header Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl border-2 ${tagStyle}`}
                        >
                          {note.category_tag}
                        </span>

                        {note.synced_to_drive && (
                          <span
                            className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-xl bg-[#ddf4ff] text-duo-blue border-2 border-duo-blue"
                            title="Sincronizado con Google Drive para NotebookLM"
                          >
                            Drive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-duo-gray">
                          {note.linked_date ? note.linked_date : 'Backlog'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label="Eliminar nota"
                          className="text-duo-gray hover:text-[#ea2b2b] p-1 rounded-xl hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Note Title */}
                    <h4
                      className={`text-sm sm:text-base font-extrabold leading-snug text-duo-charcoal ${
                        note.is_completed ? 'line-through text-duo-gray' : ''
                      }`}
                    >
                      {note.title}
                    </h4>

                    {note.content_markdown && (
                      <p className="text-xs sm:text-[13px] text-duo-gray mt-2 whitespace-pre-wrap leading-relaxed font-bold">
                        {note.content_markdown}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
