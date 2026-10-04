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
  const [color, setColor] = useState<EventColor>('orange');
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl safe-pb">
        <div className="flex items-center justify-between border-b border-ritmo-line pb-3">
          <h2 className="font-manrope text-base font-extrabold text-ritmo-ink flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-ritmo-purple" />
            Nuevo Bloque de Calendario
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-full text-ritmo-muted hover:text-ritmo-ink hover:bg-ritmo-soft"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-ritmo-muted mb-1 uppercase tracking-wider">
              Título de la Actividad
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Lámina 3 - Cortes y Vistas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-ritmo-line p-2.5 text-sm font-semibold text-ritmo-ink focus:border-ritmo-purple focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ritmo-muted mb-1 uppercase tracking-wider">
                Fecha
              </label>
              <div className="flex items-center rounded-xl border border-ritmo-line px-2.5 py-2">
                <Calendar className="w-4 h-4 text-ritmo-muted mr-1.5" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ritmo-muted mb-1 uppercase tracking-wider">
                Nivel de Prioridad (Tier)
              </label>
              <select
                value={tier}
                onChange={(e) => handleTierChange(e.target.value as EventTier)}
                className="w-full rounded-xl border border-ritmo-line p-2 text-xs font-bold text-ritmo-ink focus:border-ritmo-purple focus:outline-none"
              >
                <option value="tier_1">Tier 1 — Inamovible (Dios/UTN)</option>
                <option value="tier_2">Tier 2 — Movible (Escuela)</option>
                <option value="tier_3">Tier 3 — Hábito/Láminas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-ritmo-muted mb-1 uppercase tracking-wider">
                Hora Inicio
              </label>
              <div className="flex items-center rounded-xl border border-ritmo-line px-2.5 py-2">
                <Clock className="w-4 h-4 text-ritmo-muted mr-1.5" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ritmo-muted mb-1 uppercase tracking-wider">
                Hora Fin
              </label>
              <div className="flex items-center rounded-xl border border-ritmo-line px-2.5 py-2">
                <Clock className="w-4 h-4 text-ritmo-muted mr-1.5" />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs font-semibold focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-bold text-ritmo-muted mb-1.5 uppercase tracking-wider">
              Categoría Cromática
            </label>
            <div className="flex items-center gap-2">
              {(['red', 'orange', 'blue', 'green', 'yellow', 'purple'] as EventColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-ritmo-ink ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: EVENT_COLOR_MAP[c].accent }}
                />
              ))}
            </div>
          </div>

          {/* Difficulty Score (1-5) */}
          <div>
            <label className="block text-xs font-bold text-ritmo-muted mb-1 uppercase tracking-wider">
              Dificultad Estimada (1 a 5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficultyScore(level)}
                  className={`flex-1 py-1 rounded-lg text-xs font-black border transition-all ${
                    difficultyScore === level
                      ? 'bg-ritmo-ink text-white border-ritmo-ink'
                      : 'bg-ritmo-soft text-ritmo-muted border-ritmo-line'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ritmo-muted mb-1 uppercase tracking-wider">
              Notas o Detalles
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre el bloque o consigna..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-ritmo-line p-2 text-xs text-ritmo-ink focus:border-ritmo-purple focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-ritmo-line text-xs font-bold text-ritmo-muted hover:bg-ritmo-soft"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-ritmo-purple text-xs font-bold text-white hover:bg-ritmo-purple/90 shadow-md"
            >
              Agendar Bloque
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
