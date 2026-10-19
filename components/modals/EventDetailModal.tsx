import React from 'react';
import { CalendarEvent } from '@/types/database.types';
import { EVENT_COLOR_MAP, TIER_CONFIG } from '@/lib/color-tokens';
import { X, Clock, Calendar, Lock, Trash2, Sparkles, BookOpen, ExternalLink } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 font-nunito">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-white p-6 border-2 border-duo-border-light shadow-duo-sticker safe-pb animate-fadeIn">
        {/* Header with Color Accent */}
        <div className="flex items-start justify-between border-b-2 border-duo-border-light pb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: colorScheme.accent }}
            />
            <span
              className={`text-xs font-extrabold px-3 py-0.5 rounded-xl uppercase border-2 ${
                isTier1
                  ? 'bg-[#ffebee] text-[#ea2b2b] border-[#ff4b4b]'
                  : event.tier === 'tier_2'
                  ? 'bg-[#ddf4ff] text-duo-blue border-duo-blue'
                  : 'bg-duo-green-light text-duo-green border-duo-green'
              }`}
            >
              {tierConfig.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-xl text-duo-gray hover:text-duo-charcoal hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-extrabold tracking-tight text-duo-charcoal">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-xs text-duo-gray mt-1 leading-relaxed font-bold">
                {event.description}
              </p>
            )}
          </div>

          {/* Time & Date Badges */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-extrabold">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f7f7f7] text-duo-charcoal border-2 border-duo-border-light">
              <Calendar className="w-4 h-4 text-duo-gray shrink-0" />
              <span>{event.event_date}</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f7f7f7] text-duo-charcoal border-2 border-duo-border-light">
              <Clock className="w-4 h-4 text-duo-gray shrink-0" />
              <span>
                {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Difficulty & Sync Details */}
          <div className="rounded-2xl border-2 border-duo-border-light bg-[#f7f7f7] p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-duo-gray">
              <span className="flex items-center gap-1.5 font-extrabold text-duo-charcoal">
                <Sparkles className="w-3.5 h-3.5 text-duo-green" /> Dificultad Académica:
              </span>
              <span className="font-extrabold px-2.5 py-0.5 rounded-lg bg-[#fff9db] text-[#b88c00] border-2 border-[#ffc800]">
                {event.difficulty_score ? `${event.difficulty_score} / 5` : 'Estándar (2/5)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-duo-gray pt-1">
              <span className="flex items-center gap-1.5 font-extrabold text-duo-charcoal">
                <BookOpen className="w-3.5 h-3.5 text-duo-blue" /> Origen:
              </span>
              <span className="font-extrabold text-duo-charcoal uppercase text-[10px] px-2.5 py-0.5 rounded-lg bg-white border-2 border-duo-border-light">
                {event.created_from}
              </span>
            </div>

            {isTier1 && (
              <div className="mt-2 flex items-center gap-2 text-xs font-extrabold text-[#ea2b2b] bg-[#ffebee] p-2.5 rounded-xl border-2 border-[#ff4b4b]">
                <Lock className="w-4 h-4 shrink-0 text-[#ea2b2b]" />
                <span>Bloque protegido: no se permite superposición ni reprogramación automática.</span>
              </div>
            )}
          </div>

          {(event.created_from === 'classroom_sync' || Boolean(event.classroom_coursework_id)) && (
            <a
              href="https://classroom.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-duo-blue hover:opacity-95 text-white font-extrabold uppercase tracking-wide text-xs shadow-duo-blue transition-all active:translate-y-0.5"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir en Google Classroom</span>
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            {!isTier1 && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border-2 border-[#ff4b4b] text-[#ea2b2b] text-xs font-extrabold uppercase hover:bg-red-50 transition-colors active:translate-y-0.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-duo-green text-white text-xs font-extrabold uppercase tracking-wide shadow-duo-green hover:opacity-95 transition-all active:translate-y-0.5"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
