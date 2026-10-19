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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn font-nunito">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-6 border-2 border-duo-border-light shadow-duo-sticker safe-pb">
        <div className="flex items-center justify-between border-b-2 border-duo-border-light pb-3">
          <h2 className="text-base font-extrabold text-duo-charcoal flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-duo-green" />
            Nuevo Bloque de Calendario
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-xl text-duo-gray hover:text-duo-charcoal hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-duo-gray mb-1 uppercase tracking-wider">
              Título de la Actividad
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Lámina 3 - Cortes y Vistas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border-2 border-duo-border-light px-4 py-2.5 text-xs font-extrabold text-duo-charcoal bg-[#f7f7f7] focus:border-duo-green focus:outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-duo-gray mb-1 uppercase tracking-wider">
                Fecha
              </label>
              <div className="flex items-center rounded-xl border-2 border-duo-border-light px-3 py-2 bg-[#f7f7f7]">
                <Calendar className="w-4 h-4 text-duo-gray mr-1.5 shrink-0" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs font-bold bg-transparent focus:outline-none text-duo-charcoal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-duo-gray mb-1 uppercase tracking-wider">
                Nivel (Tier)
              </label>
              <select
                value={tier}
                onChange={(e) => handleTierChange(e.target.value as EventTier)}
                className="w-full rounded-xl border-2 border-duo-border-light px-3 py-2 text-xs font-extrabold text-duo-charcoal bg-[#f7f7f7] focus:border-duo-green focus:outline-none"
              >
                <option value="tier_1">Tier 1 — Inamovible (Dios/UTN)</option>
                <option value="tier_2">Tier 2 — Movible (Escuela)</option>
                <option value="tier_3">Tier 3 — Hábito/Láminas</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold text-duo-gray mb-1 uppercase tracking-wider">
                Hora Inicio
              </label>
              <div className="flex items-center rounded-xl border-2 border-duo-border-light px-3 py-2 bg-[#f7f7f7]">
                <Clock className="w-4 h-4 text-duo-gray mr-1.5 shrink-0" />
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs font-bold bg-transparent focus:outline-none text-duo-charcoal"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-duo-gray mb-1 uppercase tracking-wider">
                Hora Fin
              </label>
              <div className="flex items-center rounded-xl border-2 border-duo-border-light px-3 py-2 bg-[#f7f7f7]">
                <Clock className="w-4 h-4 text-duo-gray mr-1.5 shrink-0" />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs font-bold bg-transparent focus:outline-none text-duo-charcoal"
                />
              </div>
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="block text-xs font-extrabold text-duo-gray mb-1.5 uppercase tracking-wider">
              Categoría Cromática
            </label>
            <div className="flex items-center gap-2">
              {(['green', 'blue', 'red', 'yellow', 'orange', 'purple'] as EventColor[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-xl transition-all border-2 border-white ${
                    color === c ? 'scale-125 ring-2 ring-duo-charcoal shadow-duo-sticker' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: EVENT_COLOR_MAP[c].accent }}
                />
              ))}
            </div>
          </div>

          {/* Difficulty Score (1-5) */}
          <div>
            <label className="block text-xs font-extrabold text-duo-gray mb-1 uppercase tracking-wider">
              Dificultad Estimada (1 a 5)
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficultyScore(level)}
                  className={`flex-1 py-1 rounded-xl text-xs font-extrabold border-2 transition-all ${
                    difficultyScore === level
                      ? 'bg-duo-charcoal text-white border-duo-charcoal shadow-duo-sticker'
                      : 'bg-[#f7f7f7] text-duo-gray border-duo-border-light hover:text-duo-charcoal'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-duo-gray mb-1 uppercase tracking-wider">
              Notas o Detalles
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre el bloque o consigna..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border-2 border-duo-border-light p-3 text-xs text-duo-charcoal bg-[#f7f7f7] focus:border-duo-green focus:outline-none font-bold"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-2 border-duo-border-light text-xs font-extrabold uppercase text-duo-charcoal hover:bg-gray-100 transition-all active:translate-y-0.5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-xl bg-duo-green text-xs font-extrabold uppercase tracking-wide text-white hover:opacity-95 shadow-duo-green transition-all active:translate-y-0.5"
            >
              Agendar Bloque
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
