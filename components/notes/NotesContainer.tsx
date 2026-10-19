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
  { tag: '#utn', color: 'bg-caldera-ember/15 text-caldera-ember border-caldera-ember/30' },
  { tag: '#dibujo', color: 'bg-caldera-sulfur text-caldera-obsidian border-caldera-obsidian/20' },
  { tag: '#devocional', color: 'bg-emerald-900/10 text-emerald-800 border-emerald-800/30' },
  { tag: '#proyectos', color: 'bg-caldera-plasma/15 text-caldera-plasma border-caldera-plasma/30' },
  { tag: '#ideas', color: 'bg-caldera-sulfur text-caldera-obsidian border-caldera-obsidian/20' },
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
      // Tab filter
      if (activeTab === 'daily') {
        if (note.linked_date !== selectedDateStr) return false;
      } else if (activeTab === 'backlog') {
        if (note.linked_date !== null) return false;
      }

      // Tag filter
      if (selectedTagFilter && note.category_tag !== selectedTagFilter) {
        return false;
      }

      // Query filter
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
    <div className="flex-1 flex flex-col bg-caldera-pumice/30 overflow-hidden pb-24">
      {/* Segmented Tab Bar & Search Header */}
      <div className="bg-caldera-limestone px-4 pt-3 pb-3 border-b border-dotted border-caldera-obsidian/25 space-y-3">
        {/* Clean 3-tab segmented control */}
        <div className="grid grid-cols-3 p-1 rounded-full bg-caldera-pumice border border-caldera-obsidian/15">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`py-1.5 px-1 text-xs font-bold rounded-full uppercase tracking-wider transition-all ${
              activeTab === 'daily'
                ? 'bg-caldera-ember text-caldera-obsidian border border-caldera-obsidian/20'
                : 'text-caldera-muted hover:text-caldera-obsidian'
            }`}
          >
            Del Día
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backlog')}
            className={`py-1.5 px-1 text-xs font-bold rounded-full uppercase tracking-wider transition-all ${
              activeTab === 'backlog'
                ? 'bg-caldera-ember text-caldera-obsidian border border-caldera-obsidian/20'
                : 'text-caldera-muted hover:text-caldera-obsidian'
            }`}
          >
            Backlog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-1.5 px-1 text-xs font-bold rounded-full uppercase tracking-wider transition-all ${
              activeTab === 'all'
                ? 'bg-caldera-ember text-caldera-obsidian border border-caldera-obsidian/20'
                : 'text-caldera-muted hover:text-caldera-obsidian'
            }`}
          >
            Todas ({notes.length})
          </button>
        </div>

        {/* Search Bar & New Note Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-caldera-obsidian/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar apuntes o etiquetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-full border border-caldera-obsidian/25 bg-caldera-limestone text-caldera-obsidian placeholder:text-caldera-muted focus:outline-none focus:border-caldera-ember transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingNote(!isCreatingNote)}
            className="flex items-center gap-1.5 bg-caldera-ember text-caldera-obsidian px-4 py-2 rounded-full text-xs font-bold hover:bg-caldera-ember-hover active:scale-95 transition-all border border-caldera-obsidian/20 shrink-0"
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
            className={`text-[11px] px-3.5 py-1 rounded-full font-bold uppercase whitespace-nowrap transition-colors ${
              selectedTagFilter === null
                ? 'bg-caldera-obsidian text-caldera-chalk'
                : 'bg-caldera-limestone text-caldera-muted border border-caldera-obsidian/20 hover:text-caldera-obsidian'
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
                className={`text-[11px] px-3.5 py-1 rounded-full font-bold uppercase border whitespace-nowrap transition-all ${
                  isSelected ? 'ring-2 ring-caldera-obsidian ring-offset-1 scale-105' : 'hover:opacity-90'
                } ${color}`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* NotebookLM / Drive Sync Ribbon — Caldera Style */}
        <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-[24px] bg-caldera-pumice border border-caldera-obsidian/20 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-caldera-plasma flex items-center justify-center text-caldera-chalk shrink-0">
              <Cloud className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="font-display text-xs uppercase tracking-wider text-caldera-obsidian truncate block">
                NotebookLM & Drive
              </span>
              <span className="text-[10px] text-caldera-muted font-medium">Apuntes #utn como fuente viva</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSyncDrive}
              disabled={isSyncingDrive}
              className="py-1 px-3 rounded-full bg-caldera-ember text-caldera-obsidian font-bold text-[11px] flex items-center gap-1 hover:bg-caldera-ember-hover active:scale-95 transition-all disabled:opacity-50 border border-caldera-obsidian/20"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingDrive ? 'animate-spin' : ''}`} />
              <span>{isSyncingDrive ? 'Sync...' : 'Sincronizar'}</span>
            </button>
            <a
              href="https://notebooklm.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-2.5 rounded-full bg-caldera-limestone border border-caldera-obsidian/30 text-caldera-obsidian font-bold text-[11px] flex items-center gap-1 hover:bg-caldera-pumice transition-colors"
              title="Abrir Google NotebookLM"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {syncDriveMsg && (
          <p className="text-[11px] font-bold text-caldera-obsidian bg-caldera-sulfur p-2 rounded-full border border-caldera-obsidian/20 text-center animate-fadeIn">
            {syncDriveMsg}
          </p>
        )}
      </div>

      {/* Note Creation Form Drawer/Panel */}
      {isCreatingNote && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-caldera-limestone p-5 border-b border-dotted border-caldera-obsidian/25 space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm uppercase tracking-wider text-caldera-obsidian flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-caldera-ember" />
              Nueva Nota o Apunte
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingNote(false)}
              className="text-xs font-bold text-caldera-muted hover:text-caldera-obsidian px-3 py-1 rounded-full border border-caldera-obsidian/20 transition-colors"
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
            className="w-full text-xs font-bold px-4 py-2.5 rounded-full border border-caldera-obsidian/25 focus:outline-none focus:border-caldera-ember transition-all bg-white"
          />

          <textarea
            rows={3}
            placeholder="Detalles, fórmulas o pasos en Markdown..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full text-xs px-4 py-3 rounded-[24px] border border-caldera-obsidian/25 focus:outline-none focus:border-caldera-ember leading-relaxed font-sans transition-all bg-white"
          />

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-caldera-muted">Etiqueta:</span>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="text-xs py-1.5 px-3 rounded-full border border-caldera-obsidian/30 bg-white font-bold text-caldera-obsidian focus:outline-none focus:border-caldera-ember"
              >
                <option value="#general">#general</option>
                <option value="#utn">#utn (Sync Drive)</option>
                <option value="#dibujo">#dibujo</option>
                <option value="#devocional">#devocional</option>
                <option value="#proyectos">#proyectos</option>
                <option value="#ideas">#ideas</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-caldera-obsidian select-none">
              <input
                type="checkbox"
                checked={newIsForToday}
                onChange={(e) => setNewIsForToday(e.target.checked)}
                className="rounded border-caldera-obsidian/40 text-caldera-ember focus:ring-caldera-ember"
              >
              </input>
              <span>Vincular a fecha seleccionada</span>
            </label>

            <button
              type="submit"
              className="bg-caldera-ember text-caldera-obsidian px-5 py-2 rounded-full text-xs font-bold hover:bg-caldera-ember-hover active:scale-95 transition-all border border-caldera-obsidian/20 ml-auto"
            >
              Guardar Nota
            </button>
          </div>
        </form>
      )}

      {/* Daily Mode Subtitle Indicator */}
      {activeTab === 'daily' && (
        <div className="px-5 pt-3 pb-1 flex items-center justify-between text-xs text-caldera-muted font-medium">
          <span className="font-display uppercase tracking-wide">{dayLabel}</span>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-caldera-sulfur text-caldera-obsidian border border-caldera-obsidian/20">
            {filteredNotes.length} {filteredNotes.length === 1 ? 'apunte' : 'apuntes'}
          </span>
        </div>
      )}

      {/* Notes Stream with Caldera 32px Cards */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="rounded-[32px] border border-dotted border-caldera-obsidian/30 bg-caldera-limestone/50 p-8 text-center text-caldera-muted mt-4">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-caldera-ember" />
            <p className="text-sm font-display tracking-wider uppercase text-caldera-obsidian">No hay notas en esta sección</p>
            <p className="text-xs mt-1 text-caldera-muted">
              {activeTab === 'daily'
                ? `No tienes notas vinculadas a ${selectedDateStr}.`
                : 'Tu backlog de ideas está vacío.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const tagObj = PREDEFINED_TAGS.find((p) => p.tag === note.category_tag);
            const tagStyle = tagObj?.color || 'bg-caldera-sulfur text-caldera-obsidian border-caldera-obsidian/20';

            return (
              <div
                key={note.id}
                className={`rounded-[32px] bg-caldera-limestone p-4 sm:p-5 border transition-all duration-150 ${
                  note.is_completed
                    ? 'border-caldera-obsidian/10 opacity-60 bg-caldera-pumice/20'
                    : 'border-caldera-obsidian/20 hover:border-caldera-obsidian/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => onToggleNoteStatus(note.id)}
                    aria-label={note.is_completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    className="mt-1 text-caldera-ember hover:scale-110 active:scale-95 transition-transform shrink-0"
                  >
                    {note.is_completed ? (
                      <CheckCircle className="w-5 h-5 text-caldera-ember fill-caldera-ember/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-caldera-obsidian/40 hover:text-caldera-ember" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Metadata Header Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[11px] font-bold px-3 py-0.5 rounded-full border uppercase ${tagStyle}`}
                        >
                          {note.category_tag}
                        </span>

                        {note.synced_to_drive && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-caldera-plasma/15 text-caldera-plasma border border-caldera-plasma/30"
                            title="Sincronizado con Google Drive para NotebookLM"
                          >
                            Drive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-caldera-muted">
                          {note.linked_date ? note.linked_date : 'Backlog'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label="Eliminar nota"
                          className="text-caldera-muted hover:text-caldera-ember p-1 rounded-full hover:bg-caldera-pumice transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note Title */}
                    <h4
                      className={`font-display text-base tracking-wide uppercase text-caldera-obsidian ${
                        note.is_completed ? 'line-through text-caldera-muted' : ''
                      }`}
                    >
                      {note.title}
                    </h4>

                    {/* Note Content */}
                    {note.content_markdown && (
                      <p className="text-xs sm:text-[13px] text-caldera-muted/90 mt-2 whitespace-pre-wrap font-sans leading-relaxed">
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
