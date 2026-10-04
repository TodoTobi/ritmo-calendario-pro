import React, { useState, useMemo } from 'react';
import { NoteItem } from '@/types/database.types';
import { formatDayHeader } from '@/lib/date-utils';
import { Plus, CheckCircle, Circle, Tag, Search, BookOpen, Sparkles, Trash2 } from 'lucide-react';

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
      {/* Segmented Tab Bar */}
      <div className="bg-white px-4 pt-3 pb-2 border-b border-ritmo-line/80 space-y-2.5">
        <div className="grid grid-cols-3 p-1 rounded-xl bg-ritmo-soft">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'daily'
                ? 'bg-white text-ritmo-ink shadow-sm'
                : 'text-ritmo-muted hover:text-ritmo-ink'
            }`}
          >
            Del Día ({dayLabel})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backlog')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'backlog'
                ? 'bg-white text-ritmo-ink shadow-sm'
                : 'text-ritmo-muted hover:text-ritmo-ink'
            }`}
          >
            Backlog de Ideas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white text-ritmo-ink shadow-sm'
                : 'text-ritmo-muted hover:text-ritmo-ink'
            }`}
          >
            Todas ({notes.length})
          </button>
        </div>

        {/* Quick Search & Tag Filter Carousel */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-ritmo-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar apuntes o etiquetas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-ritmo-line bg-ritmo-soft/50 text-ritmo-ink placeholder:text-ritmo-muted focus:outline-none focus:border-ritmo-purple"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreatingNote(!isCreatingNote)}
            className="flex items-center gap-1 bg-ritmo-purple text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-ritmo-purple/90 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nota</span>
          </button>
        </div>

        {/* Tags horizontal filter bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedTagFilter(null)}
            className={`text-[10px] px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
              selectedTagFilter === null
                ? 'bg-ritmo-ink text-white'
                : 'bg-ritmo-soft text-ritmo-muted border border-ritmo-line'
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
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold border whitespace-nowrap transition-all ${
                  isSelected ? 'ring-2 ring-ritmo-ink ring-offset-1' : ''
                } ${color}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Note Creation Form Drawer/Panel */}
      {isCreatingNote && (
        <form
          onSubmit={handleCreateSubmit}
          className="bg-white p-4 border-b border-ritmo-line space-y-3 animate-fadeIn shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-ritmo-ink flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-ritmo-purple" /> Nueva Nota o Apunte
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingNote(false)}
              className="text-xs text-ritmo-muted hover:text-ritmo-ink"
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
            className="w-full text-sm font-semibold p-2 rounded-lg border border-ritmo-line focus:outline-none focus:border-ritmo-purple"
          />

          <textarea
            rows={3}
            placeholder="Detalles, ejercicios, fórmulas en Markdown..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full text-xs p-2 rounded-lg border border-ritmo-line focus:outline-none focus:border-ritmo-purple"
          />

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-ritmo-muted">Etiqueta:</span>
              <select
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="text-xs p-1 rounded-md border border-ritmo-line bg-white font-semibold"
              >
                <option value="#general">#general</option>
                <option value="#utn">#utn (Sync Drive)</option>
                <option value="#dibujo">#dibujo</option>
                <option value="#devocional">#devocional</option>
                <option value="#proyectos">#proyectos</option>
                <option value="#ideas">#ideas</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={newIsForToday}
                onChange={(e) => setNewIsForToday(e.target.checked)}
                className="rounded text-ritmo-purple focus:ring-ritmo-purple"
              />
              <span>Vincular a hoy ({selectedDateStr})</span>
            </label>

            <button
              type="submit"
              className="bg-ritmo-purple text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-ritmo-purple/90 ml-auto"
            >
              Guardar Nota
            </button>
          </div>
        </form>
      )}

      {/* Notes Stream */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
        {filteredNotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ritmo-line bg-white p-8 text-center text-ritmo-muted">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-ritmo-purple" />
            <p className="text-sm font-semibold">No hay notas en esta sección</p>
            <p className="text-xs mt-1">
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
                className={`rounded-2xl bg-white p-3.5 border transition-all duration-150 ${
                  note.is_completed
                    ? 'border-ritmo-line/60 opacity-60 bg-ritmo-soft/40'
                    : 'border-ritmo-line hover:border-ritmo-purple/40 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleNoteStatus(note.id)}
                    aria-label={note.is_completed ? 'Marcar como pendiente' : 'Marcar como completada'}
                    className="mt-0.5 text-ritmo-purple hover:scale-110 transition-transform shrink-0"
                  >
                    {note.is_completed ? (
                      <CheckCircle className="w-5 h-5 text-ritmo-green fill-ritmo-green/20" />
                    ) : (
                      <Circle className="w-5 h-5 text-ritmo-muted/50" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tagStyle}`}
                      >
                        {note.category_tag}
                      </span>

                      <div className="flex items-center gap-1.5">
                        {note.synced_to_drive && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-50 text-blue-600 border border-blue-200"
                            title="Sincronizado con Google Drive para NotebookLM"
                          >
                            Drive
                          </span>
                        )}
                        <span className="text-[10px] font-medium text-ritmo-muted">
                          {note.linked_date ? note.linked_date : 'Backlog'}
                        </span>
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          aria-label="Eliminar nota"
                          className="text-ritmo-muted hover:text-ritmo-red p-0.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <h4
                      className={`font-semibold text-sm leading-snug text-ritmo-ink ${
                        note.is_completed ? 'line-through text-ritmo-muted' : ''
                      }`}
                    >
                      {note.title}
                    </h4>

                    {note.content_markdown && (
                      <p className="text-xs text-ritmo-muted mt-1 whitespace-pre-wrap font-sans">
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
