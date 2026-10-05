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
  { tag: '#utn', color: 'bg-[#fff0f1] text-[#ff5d63] border-[#ff5d63]/30' },
  { tag: '#dibujo', color: 'bg-[#fff5e6] text-[#f2a641] border-[#f2a641]/30' },
  { tag: '#devocional', color: 'bg-[#edf9f3] text-[#46a978] border-[#46a978]/30' },
  { tag: '#proyectos', color: 'bg-[#eeedff] text-[#6558f5] border-[#6558f5]/30' },
  { tag: '#ideas', color: 'bg-[#fffbea] text-[#9a8413] border-[#e7c94a]/30' },
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
    setNewTag('#general');
    setIsCreatingNote(false);
  };

  const { label: dayLabel } = formatDayHeader(selectedDateStr);

  return (
    <div className="flex-1 flex flex-col bg-ritmo-bg overflow-hidden pb-24">
      {/* Segmented Tab Bar & Search Header */}
      <div className="bg-white px-4 pt-3 pb-3 border-b border-ritmo-line/80 space-y-3">
        {/* Clean 3-tab segmented control */}
        <div className="grid grid-cols-3 p-1 rounded-2xl bg-ritmo-soft">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'daily'
                ? 'bg-white text-ritmo-ink shadow-xs'
                : 'text-ritmo-muted hover:text-ritmo-ink'
            }`}
          >
            Del Día
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backlog')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'backlog'
                ? 'bg-white text-ritmo-ink shadow-xs'
                : 'text-ritmo-muted hover:text-ritmo-ink'
            }`}
          >
            Backlog
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'all'
                ? 'bg-white text-ritmo-ink shadow-xs'
                : 'text-ritmo-muted hover:text-ritmo-ink'
            }`}
          >
            Todas ({notes.length})
          </button>
        </div>

        {/* Search Bar & New Note Button */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-ritmo-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar apuntes o etiquetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-ritmo-line/80 bg-ritmo-soft/50 text-ritmo-ink placeholder:text-ritmo-muted focus:outline-none focus:border-ritmo-purple focus:bg-white transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingNote(!isCreatingNote)}
            className="flex items-center gap-1.5 bg-ritmo-purple text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-ritmo-purple/90 active:scale-95 transition-all shadow-xs shrink-0"
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
            className={`text-[11px] px-3 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              selectedTagFilter === null
                ? 'bg-ritmo-ink text-white shadow-xs'
                : 'bg-ritmo-soft text-ritmo-muted border border-ritmo-line hover:text-ritmo-ink'
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
                className={`text-[11px] px-3 py-1 rounded-full font-bold border whitespace-nowrap transition-all ${
                  isSelected ? 'ring-2 ring-ritmo-ink ring-offset-1 scale-105' : 'hover:opacity-90'
                } ${color}`}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* NotebookLM / Drive Sync Ribbon */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Cloud className="w-4 h-4 text-ritmo-purple shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-ritmo-ink truncate block">NotebookLM & Drive</span>
              <span className="text-[10px] text-ritmo-muted">Apuntes #utn como fuente viva</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleSyncDrive}
              disabled={isSyncingDrive}
              className="py-1 px-2.5 rounded-lg bg-ritmo-purple text-white font-bold text-[11px] flex items-center gap-1 hover:bg-ritmo-purple/90 active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingDrive ? 'animate-spin' : ''}`} />
              <span>{isSyncingDrive ? 'Sync...' : 'Sincronizar'}</span>
            </button>
            <a
              href="https://notebooklm.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1 px-2 rounded-lg bg-white border border-purple-200 text-ritmo-purple font-bold text-[11px] flex items-center gap-1 hover:bg-purple-50 transition-colors"
              title="Abrir Google NotebookLM"
            >
              <span>Abrir</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {syncDriveMsg && (
          <p className="text-[11px] font-medium text-ritmo-purple bg-purple-50 p-2 rounded-xl border border-purple-200 animate-fadeIn">
            {syncDriveMsg}
          </p>
        )}
      </div>

      {/* Note Creation Form Drawer/Panel */}
      {isCreatingNote && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white p-5 border-b border-ritmo-line/80 space-y-4 animate-fadeIn shadow-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-ritmo-ink flex items-center gap-1.5 font-manrope">
              <Sparkles className="w-4 h-4 text-ritmo-purple" />
              Nueva Nota o Apunte
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingNote(false)}
              className="text-xs font-medium text-ritmo-muted hover:text-ritmo-ink px-2 py-1 rounded-lg hover:bg-ritmo-soft transition-colors"
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
            className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-xl border border-ritmo-line/80 focus:outline-none focus:border-ritmo-purple focus:ring-2 focus:ring-ritmo-purple/10 transition-all font-manrope"
          />

          <textarea
            rows={3}
            placeholder="Detalles, fórmulas o pasos en Markdown..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-ritmo-line/80 focus:outline-none focus:border-ritmo-purple focus:ring-2 focus:ring-ritmo-purple/10 leading-relaxed font-sans transition-all"
          />

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-ritmo-muted">Etiqueta:</span>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="text-xs py-1.5 px-2.5 rounded-lg border border-ritmo-line bg-white font-semibold text-ritmo-ink focus:outline-none focus:border-ritmo-purple"
              >
                <option value="#general">#general</option>
                <option value="#utn">#utn (Sync Drive)</option>
                <option value="#dibujo">#dibujo</option>
                <option value="#devocional">#devocional</option>
                <option value="#proyectos">#proyectos</option>
                <option value="#ideas">#ideas</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium cursor-pointer text-ritmo-ink select-none">
              <input
                type="checkbox"
                checked={newIsForToday}
                onChange={(e) => setNewIsForToday(e.target.checked)}
                className="rounded border-ritmo-line text-ritmo-purple focus:ring-ritmo-purple"
              />
              <span>Vincular a fecha seleccionada</span>
            </label>

            <button
              type="submit"
              className="bg-ritmo-purple text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-ritmo-purple/90 active:scale-95 transition-all shadow-xs ml-auto"
            >
              Guardar Nota
            </button>
          </div>
        </form>
      )}

      {/* Daily Mode Subtitle Indicator if viewing daily */}
      {activeTab === 'daily' && (
        <div className="px-5 pt-3 pb-1 flex items-center justify-between text-xs text-ritmo-muted font-medium">
          <span>{dayLabel}</span>
          <span className="text-[11px]">{filteredNotes.length} {filteredNotes.length === 1 ? 'apunte' : 'apuntes'}</span>
        </div>
      )}

      {/* Notes Stream with Generous Card Margins and Separation */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-ritmo-line bg-white p-8 text-center text-ritmo-muted mt-4">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-ritmo-purple" />
            <p className="text-sm font-semibold font-manrope">No hay notas en esta sección</p>
            <p className="text-xs mt-1 text-ritmo-muted/80">
              {activeTab === 'daily'
                ? `No tienes notas vinculadas a ${selectedDateStr}.`
                : 'Tu backlog de ideas está vacío.'}
            </p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const tagObj = PREDEFINED_TAGS.find((p) => p.tag === note.category_tag);
            const tagStyle = tagObj?.color || 'bg-ritmo-soft text-ritmo-ink border-ritmo-line';

            return (
              <div
                key={note.id}
                className={`rounded-2xl bg-white p-4 sm:p-5 border transition-all duration-200 ${
                  note.is_completed
                    ? 'border-ritmo-line/60 opacity-60 bg-ritmo-soft/30'
                    : 'border-ritmo-line/80 hover:border-ritmo-purple/40 shadow-xs hover:shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => onToggleNoteStatus(note.id)}
                    aria-label={note.is_completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    className="mt-0.5 text-ritmo-purple hover:scale-110 active:scale-95 transition-transform shrink-0"
                  >
                    {note.is_completed ? (
                      <CheckCircle className="w-5 h-5 text-ritmo-green fill-ritmo-green/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-ritmo-muted/50 hover:text-ritmo-purple" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* Metadata Header Row */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${tagStyle}`}
                        >
                          {note.category_tag}
                        </span>

                        {note.synced_to_drive && (
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-200"
                            title="Sincronizado con Google Drive para NotebookLM"
                          >
                            Drive
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-ritmo-muted">
                          {note.linked_date ? note.linked_date : 'Backlog'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label="Eliminar nota"
                          className="text-ritmo-muted hover:text-ritmo-red p-1 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Note Title */}
                    <h4
                      className={`font-manrope font-bold text-sm sm:text-base leading-snug text-ritmo-ink ${
                        note.is_completed ? 'line-through text-ritmo-muted' : ''
                      }`}
                    >
                      {note.title}
                    </h4>

                    {/* Note Content */}
                    {note.content_markdown && (
                      <p className="text-xs sm:text-[13px] text-ritmo-muted/90 mt-2 whitespace-pre-wrap font-sans leading-relaxed">
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
