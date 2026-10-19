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
  { tag: '#utn', color: 'bg-family-red/10 text-family-red border-family-red/20' },
  { tag: '#dibujo', color: 'bg-family-honey/20 text-family-gold border-family-honey/30' },
  { tag: '#devocional', color: 'bg-family-green/10 text-family-green border-family-green/20' },
  { tag: '#proyectos', color: 'bg-family-blue/10 text-family-blue border-family-blue/20' },
  { tag: '#ideas', color: 'bg-family-stone text-family-charcoal border-family-stone' },
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
    <div className="flex-1 flex flex-col bg-family-cream overflow-hidden pb-24 font-inter">
      {/* Segmented Tab Bar & Search Header */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-family-stone space-y-3">
        {/* Clean 3-tab segmented control */}
        <div className="grid grid-cols-3 p-1 rounded-full bg-family-stone/50 border border-family-stone">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`py-1.5 px-1 text-xs font-medium rounded-full transition-all ${
              activeTab === 'daily'
                ? 'bg-family-ink text-white font-semibold'
                : 'text-family-muted hover:text-family-ink'
            }`}
          >
            Del Día
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backlog')}
            className={`py-1.5 px-1 text-xs font-medium rounded-full transition-all ${
              activeTab === 'backlog'
                ? 'bg-family-ink text-white font-semibold'
                : 'text-family-muted hover:text-family-ink'
            }`}
          >
            Backlog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-1.5 px-1 text-xs font-medium rounded-full transition-all ${
              activeTab === 'all'
                ? 'bg-family-ink text-white font-semibold'
                : 'text-family-muted hover:text-family-ink'
            }`}
          >
            Todas ({notes.length})
          </button>
        </div>

        {/* Search Bar & New Note Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-family-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar apuntes o etiquetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-family-stone bg-family-cream text-family-ink placeholder:text-family-muted focus:outline-none focus:border-family-charcoal transition-colors font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingNote(!isCreatingNote)}
            className="flex items-center gap-1.5 bg-family-ink text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-family-charcoal active:scale-95 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nota</span>
          </button>
        </div>

        {/* Tags horizontal filter bar */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTagFilter(null)}
            className={`text-[11px] px-3 py-1 rounded-[6px] font-medium whitespace-nowrap transition-colors ${
              selectedTagFilter === null
                ? 'bg-family-ink text-white'
                : 'bg-white text-family-muted border border-family-stone hover:text-family-ink'
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
                className={`text-[11px] px-3 py-1 rounded-[6px] font-medium border whitespace-nowrap transition-all ${
                  isSelected ? 'ring-1 ring-family-ink scale-105' : 'hover:opacity-90'
                } ${color}`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* NotebookLM / Drive Sync Ribbon */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[10px] bg-white border border-family-stone shadow-family-inset text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-[6px] bg-family-blue/10 flex items-center justify-center text-family-blue shrink-0">
              <Cloud className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-family-ink truncate block">
                NotebookLM & Drive
              </span>
              <span className="text-[10px] text-family-muted font-normal">Apuntes #utn como fuente viva</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSyncDrive}
              disabled={isSyncingDrive}
              className="py-1 px-3 rounded-full bg-family-ink text-white font-semibold text-[11px] flex items-center gap-1 hover:bg-family-charcoal active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingDrive ? 'animate-spin' : ''}`} />
              <span>{isSyncingDrive ? 'Sync...' : 'Sincronizar'}</span>
            </button>
            <a
              href="https://notebooklm.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-2.5 rounded-full bg-white border border-family-stone text-family-charcoal font-medium text-[11px] flex items-center gap-1 hover:bg-family-cream transition-colors"
              title="Abrir Google NotebookLM"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {syncDriveMsg && (
          <p className="text-[11px] font-medium text-family-green bg-family-green/10 p-2 rounded-[6px] border border-family-green/20 text-center animate-fadeIn">
            {syncDriveMsg}
          </p>
        )}
      </div>

      {/* Note Creation Form Drawer/Panel */}
      {isCreatingNote && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white p-5 border-b border-family-stone space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-family-ink flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-family-orange" />
              Nueva Nota o Apunte
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingNote(false)}
              className="text-xs font-medium text-family-muted hover:text-family-ink px-3 py-1 rounded-full border border-family-stone transition-colors"
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
            className="w-full text-xs font-medium px-4 py-2.5 rounded-[10px] border border-family-stone focus:outline-none focus:border-family-charcoal transition-all bg-family-cream text-family-ink"
          />

          <textarea
            rows={3}
            placeholder="Detalles, fórmulas o pasos en Markdown..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full text-xs px-4 py-3 rounded-[10px] border border-family-stone focus:outline-none focus:border-family-charcoal leading-relaxed font-inter transition-all bg-family-cream text-family-ink"
          />

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-family-muted">Etiqueta:</span>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-[6px] border border-family-stone bg-white font-medium text-family-ink focus:outline-none focus:border-family-charcoal"
              >
                <option value="#general">#general</option>
                <option value="#utn">#utn (Sync Drive)</option>
                <option value="#dibujo">#dibujo</option>
                <option value="#devocional">#devocional</option>
                <option value="#proyectos">#proyectos</option>
                <option value="#ideas">#ideas</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-normal cursor-pointer text-family-charcoal select-none">
              <input
                type="checkbox"
                checked={newIsForToday}
                onChange={(e) => setNewIsForToday(e.target.checked)}
                className="rounded border-family-stone text-family-ink focus:ring-family-ink"
              />
              <span>Vincular a fecha seleccionada</span>
            </label>

            <button
              type="submit"
              className="bg-family-ink text-white px-5 py-2 rounded-full text-xs font-semibold hover:bg-family-charcoal active:scale-95 transition-all ml-auto"
            >
              Guardar Nota
            </button>
          </div>
        </form>
      )}

      {/* Daily Mode Subtitle Indicator */}
      {activeTab === 'daily' && (
        <div className="px-5 pt-3 pb-1 flex items-center justify-between text-xs text-family-muted font-normal">
          <span>{dayLabel}</span>
          <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-family-stone text-family-charcoal">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'apunte' : 'apuntes'}
          </span>
        </div>
      )}

      {/* Notes Stream with Family Inset-Bordered Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="rounded-[10px] border border-dashed border-family-stone bg-white/60 p-8 text-center text-family-muted mt-4">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-family-muted" />
            <p className="text-sm font-medium text-family-ink">No hay notas en esta sección</p>
            <p className="text-xs mt-1 text-family-muted">
              {activeTab === 'daily'
                ? `No tienes notas vinculadas a ${selectedDateStr}.`
                : 'Tu backlog de ideas está vacío.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const tagObj = PREDEFINED_TAGS.find((p) => p.tag === note.category_tag);
            const tagStyle = tagObj?.color || 'bg-family-stone text-family-charcoal border-family-stone';

            return (
              <div
                key={note.id}
                className={`rounded-[10px] bg-white p-4 border transition-all duration-150 shadow-family-inset ${
                  note.is_completed
                    ? 'border-family-stone/50 opacity-60 bg-family-stone/20'
                    : 'border-family-stone hover:border-family-stone/80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleNoteStatus(note.id)}
                    aria-label={note.is_completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    className="mt-0.5 text-family-ink hover:scale-110 active:scale-95 transition-transform shrink-0"
                  >
                    {note.is_completed ? (
                      <CheckCircle className="w-5 h-5 text-family-green fill-family-green/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-family-muted hover:text-family-ink" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Metadata Header Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-[6px] border ${tagStyle}`}
                        >
                          {note.category_tag}
                        </span>

                        {note.synced_to_drive && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-[6px] bg-family-blue/10 text-family-blue border border-family-blue/20"
                            title="Sincronizado con Google Drive para NotebookLM"
                          >
                            Drive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-normal text-family-muted">
                          {note.linked_date ? note.linked_date : 'Backlog'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label="Eliminar nota"
                          className="text-family-muted hover:text-family-red p-1 rounded-full hover:bg-family-cream transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note Title */}
                    <h4
                      className={`text-sm sm:text-base font-medium leading-snug text-family-ink ${
                        note.is_completed ? 'line-through text-family-muted' : ''
                      }`}
                    >
                      {note.title}
                    </h4>

                    {note.content_markdown && (
                      <p className="text-xs sm:text-[13px] text-family-brown mt-2 whitespace-pre-wrap leading-relaxed font-normal">
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
