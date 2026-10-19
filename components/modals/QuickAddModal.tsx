import React, { useState } from 'react';
import { CalendarEvent, EventTier, EventColor } from '@/types/database.types';
import { EVENT_COLOR_MAP, TIER_CONFIG } from '@/lib/color-tokens';
import { X, Calendar, Clock, Sparkles } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDateStr: string;
  onSaveEvent: (event: Omit<CalendarEvent, 'id' | 'is_inamovible' | 'created_at' | 'updated_at'>) => void;
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  defaultDateStr,
  onSaveEvent,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDateStr);
  const [startTime, setStartTime] = useState('16:00');
  const [endTime, setEndTime] = useState('17:30');
  const [tier, setTier] = useState<EventTier>('tier_3');
  const [color, setColor] = useState<EventColor>('green');
  const [difficultyScore, setDifficultyScore] = useState<number>(3);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveEvent({
      title: title.trim(),
      description: description.trim() || null,
      event_date: date,
      start_time: startTime,
      end_time: endTime,
      tier,
      color,
      difficulty_score: difficultyScore,
      classroom_coursework_id: null,
      created_from: 'web',
    });

    // Reset and close
    setTitle('');
    setDescription('');
    onClose();
  };

  const handleTierChange = (selectedTier: EventTier) => {
    setTier(selectedTier);
    setColor(TIER_CONFIG[selectedTier].defaultColor);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn font-inter">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-[10px] bg-white p-6 border border-family-stone shadow-family-inset safe-pb">
        <div className="flex items-center justify-between border-b border-family-stone pb-3">
          <h2 className="text-base font-semibold text-family-ink flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-family-orange" />
            Nuevo Bloque de Calendario
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-full text-family-muted hover:text-family-ink hover:bg-family-cream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-family-muted mb-1 uppercase tracking-wider">
              Título de la Actividad
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Lámina 3 - Cortes y Vistas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-[8px] border border-family-stone px-3.5 py-2.5 text-xs font-normal text-family-ink bg-family-cream focus:border-family-charcoal focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-family-muted mb-1 uppercase tracking-wider">
                Fecha
              </label>
              <div className="flex items-center rounded-[8px] border border-family-stone px-3 py-2 bg-family-cream">
                <Calendar className="w-4 h-4 text-family-muted mr-1.5 shrink-0" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-normal bg-transparent focus:outline-none text-family-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-family-muted mb-1 uppercase tracking-wider">
                Nivel (Tier)
              </label>
              <select
                value={tier}
                onChange={(e) => handleTierChange(e.target.value as EventTier)}
                className="w-full rounded-[8px] border border-family-stone px-3 py-2 text-xs font-medium text-family-ink bg-family-cream focus:border-family-charcoal focus:outline-none"
              >
                <option value="tier_1">Tier 1 — Inamovible (Dios/UTN)</option>
                <option value="tier_2">Tier 2 — Movible (Escuela)</option>
                <option value="tier_3">Tier 3 — Hábito/Láminas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-family-muted mb-1 uppercase tracking-wider">
                Hora Inicio
              </label>
              <div className="flex items-center rounded-[8px] border border-family-stone px-3 py-2 bg-family-cream">
                <Clock className="w-4 h-4 text-family-muted mr-1.5 shrink-0" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs font-normal bg-transparent focus:outline-none text-family-ink"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-family-muted mb-1 uppercase tracking-wider">
                Hora Fin
              </label>
              <div className="flex items-center rounded-[8px] border border-family-stone px-3 py-2 bg-family-cream">
                <Clock className="w-4 h-4 text-family-muted mr-1.5 shrink-0" />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs font-normal bg-transparent focus:outline-none text-family-ink"
                />
              </div>
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-medium text-family-muted mb-1.5 uppercase tracking-wider">
              Categoría Cromática
            </label>
            <div className="flex items-center gap-2">
              {(['green', 'blue', 'red', 'yellow', 'orange', 'purple'] as EventColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-family-ink ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: EVENT_COLOR_MAP[c].accent }}
                />
              ))}
            </div>
          </div>

          {/* Difficulty Score (1-5) */}
          <div>
            <label className="block text-xs font-medium text-family-muted mb-1 uppercase tracking-wider">
              Dificultad Estimada (1 a 5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficultyScore(level)}
                  className={`flex-1 py-1 rounded-[6px] text-xs font-medium border transition-all ${
                    difficultyScore === level
                      ? 'bg-family-ink text-white border-family-ink'
                      : 'bg-family-cream text-family-muted border-family-stone hover:text-family-ink'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-family-muted mb-1 uppercase tracking-wider">
              Notas o Detalles
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre el bloque o consigna..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-[8px] border border-family-stone p-3 text-xs text-family-ink bg-family-cream focus:border-family-charcoal focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full border border-family-stone text-xs font-medium text-family-charcoal hover:bg-family-cream transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-full bg-family-ink text-xs font-semibold text-white hover:bg-family-charcoal transition-all active:scale-95"
            >
              Agendar Bloque
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
