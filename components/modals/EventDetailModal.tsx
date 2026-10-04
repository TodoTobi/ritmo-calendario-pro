import React from 'react';
import { CalendarEvent } from '@/types/database.types';
import { EVENT_COLOR_MAP, TIER_CONFIG } from '@/lib/color-tokens';
import { X, Clock, Calendar, Lock, Trash2, Sparkles, BookOpen } from 'lucide-react';

interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
  onDelete,
}) => {
  if (!isOpen || !event) return null;

  const colorScheme = EVENT_COLOR_MAP[event.color];
  const tierConfig = TIER_CONFIG[event.tier];
  const isTier1 = event.tier === 'tier_1';

  const handleDelete = () => {
    if (isTier1) {
      alert('Los eventos de Tier 1 son inamovibles y protegidos por la regla soberana de Ritmo.');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar "${event.title}"?`)) {
      onDelete(event.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl safe-pb animate-fadeIn">
        {/* Header with Color Accent */}
        <div className="flex items-start justify-between border-b border-ritmo-line pb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: colorScheme.accent }}
            />
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${colorScheme.bg} ${colorScheme.text}`}
            >
              {tierConfig.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-full text-ritmo-muted hover:text-ritmo-ink hover:bg-ritmo-soft"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-manrope text-lg font-bold text-ritmo-ink">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-xs text-ritmo-muted mt-1 leading-relaxed">
                {event.description}
              </p>
            )}
          </div>

          {/* Time & Date Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-ritmo-soft text-ritmo-ink">
              <Calendar className="w-4 h-4 text-ritmo-muted shrink-0" />
              <span>{event.event_date}</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-ritmo-soft text-ritmo-ink">
              <Clock className="w-4 h-4 text-ritmo-muted shrink-0" />
              <span>
                {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Difficulty & Sync Details */}
          <div className="rounded-xl border border-ritmo-line p-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-ritmo-muted">
              <span className="flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-ritmo-orange" /> Dificultad Académica:
              </span>
              <span className="font-bold text-ritmo-ink">
                {event.difficulty_score ? `${event.difficulty_score} / 5` : 'Estándar (2/5)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-ritmo-muted">
              <span className="flex items-center gap-1 font-semibold">
                <BookOpen className="w-3.5 h-3.5 text-ritmo-blue" /> Origen:
              </span>
              <span className="font-bold text-ritmo-ink uppercase text-[10px]">
                {event.created_from}
              </span>
            </div>

            {isTier1 && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#ff5d63] bg-[#fff0f1] p-2 rounded-lg">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Bloque protegido: no se permite superposición ni reprogramación automática.</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {!isTier1 && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-ritmo-red/40 text-ritmo-red text-xs font-bold hover:bg-ritmo-red/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-ritmo-ink text-white text-xs font-bold hover:bg-ritmo-ink/90 shadow-sm"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
