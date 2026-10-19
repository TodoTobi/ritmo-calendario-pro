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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4 font-inter">
      <div className="w-full max-w-md rounded-t-2xl sm:rounded-[10px] bg-white p-6 border border-family-stone shadow-family-inset safe-pb animate-fadeIn">
        {/* Header with Color Accent */}
        <div className="flex items-start justify-between border-b border-family-stone pb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: colorScheme.accent }}
            />
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-[6px] ${
                isTier1
                  ? 'bg-family-red/10 text-family-red border border-family-red/20'
                  : event.tier === 'tier_2'
                  ? 'bg-family-blue/10 text-family-blue border border-family-blue/20'
                  : 'bg-family-green/10 text-family-green border border-family-green/20'
              }`}
            >
              {tierConfig.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-full text-family-muted hover:text-family-ink hover:bg-family-cream transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium tracking-tight text-family-ink">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-xs text-family-brown mt-1 leading-relaxed font-normal">
                {event.description}
              </p>
            )}
          </div>

          {/* Time & Date Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs font-medium">
            <div className="flex items-center gap-2 p-2.5 rounded-[8px] bg-family-cream border border-family-stone text-family-charcoal">
              <Calendar className="w-4 h-4 text-family-muted shrink-0" />
              <span>{event.event_date}</span>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-[8px] bg-family-cream border border-family-stone text-family-charcoal">
              <Clock className="w-4 h-4 text-family-muted shrink-0" />
              <span>
                {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Difficulty & Sync Details */}
          <div className="rounded-[8px] border border-family-stone bg-family-cream/50 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between text-family-muted">
              <span className="flex items-center gap-1.5 font-medium text-family-charcoal">
                <Sparkles className="w-3.5 h-3.5 text-family-orange" /> Dificultad Académica:
              </span>
              <span className="font-medium text-family-ink px-2 py-0.5 rounded-[4px] bg-family-honey/20 text-family-gold">
                {event.difficulty_score ? `${event.difficulty_score} / 5` : 'Estándar (2/5)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-family-muted pt-1">
              <span className="flex items-center gap-1.5 font-medium text-family-charcoal">
                <BookOpen className="w-3.5 h-3.5 text-family-blue" /> Origen:
              </span>
              <span className="font-medium text-family-charcoal uppercase text-[10px] px-2 py-0.5 rounded-[4px] bg-white border border-family-stone">
                {event.created_from}
              </span>
            </div>

            {isTier1 && (
              <div className="mt-2 flex items-center gap-2 text-[11px] font-normal text-family-red bg-family-red/10 p-2.5 rounded-[6px] border border-family-red/20">
                <Lock className="w-4 h-4 shrink-0 text-family-red" />
                <span>Bloque protegido: no se permite superposición ni reprogramación automática.</span>
              </div>
            )}
          </div>

          {(event.created_from === 'classroom_sync' || Boolean(event.classroom_coursework_id)) && (
            <a
              href="https://classroom.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-full bg-family-blue hover:opacity-95 text-white font-medium text-xs transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir en Google Classroom</span>
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            {!isTier1 && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-family-red text-family-red text-xs font-medium hover:bg-family-red/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-full bg-family-ink text-white text-xs font-semibold hover:bg-family-charcoal transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
