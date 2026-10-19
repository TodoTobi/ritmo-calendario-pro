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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-[40px] sm:rounded-[40px] bg-caldera-limestone p-6 border border-caldera-obsidian/25 safe-pb animate-fadeIn">
        {/* Header with Color Accent */}
        <div className="flex items-start justify-between border-b border-dotted border-caldera-obsidian/25 pb-3">
          <div className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-full"
              style={{ backgroundColor: colorScheme.accent }}
            />
            <span
              className={`text-xs font-bold px-3 py-0.5 rounded-full uppercase ${
                isTier1
                  ? 'bg-caldera-ember text-caldera-obsidian border border-caldera-obsidian/30'
                  : event.tier === 'tier_2'
                  ? 'bg-caldera-plasma/15 text-caldera-plasma border border-caldera-plasma/30'
                  : 'bg-caldera-sulfur text-caldera-obsidian border border-caldera-obsidian/20'
              }`}
            >
              {tierConfig.label}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="p-1 rounded-full text-caldera-obsidian/60 hover:text-caldera-obsidian hover:bg-caldera-pumice transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-display text-xl uppercase tracking-wide text-caldera-obsidian">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-xs text-caldera-muted mt-1 leading-relaxed font-medium">
                {event.description}
              </p>
            )}
          </div>

          {/* Time & Date Badges */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-bold">
            <div className="flex items-center gap-2 p-3 rounded-full bg-caldera-pumice text-caldera-obsidian border border-caldera-obsidian/15">
              <Calendar className="w-4 h-4 text-caldera-obsidian/60 shrink-0" />
              <span>{event.event_date}</span>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-full bg-caldera-pumice text-caldera-obsidian border border-caldera-obsidian/15">
              <Clock className="w-4 h-4 text-caldera-obsidian/60 shrink-0" />
              <span>
                {event.start_time.slice(0, 5)} – {event.end_time.slice(0, 5)}
              </span>
            </div>
          </div>

          {/* Difficulty & Sync Details */}
          <div className="rounded-[24px] border border-caldera-obsidian/20 bg-caldera-pumice/40 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between text-caldera-muted">
              <span className="flex items-center gap-1.5 font-bold text-caldera-obsidian">
                <Sparkles className="w-3.5 h-3.5 text-caldera-ember" /> Dificultad Académica:
              </span>
              <span className="font-bold px-2.5 py-0.5 rounded-full bg-caldera-sulfur text-caldera-obsidian border border-caldera-obsidian/20">
                {event.difficulty_score ? `${event.difficulty_score} / 5` : 'Estándar (2/5)'}
              </span>
            </div>

            <div className="flex items-center justify-between text-caldera-muted pt-1">
              <span className="flex items-center gap-1.5 font-bold text-caldera-obsidian">
                <BookOpen className="w-3.5 h-3.5 text-caldera-plasma" /> Origen:
              </span>
              <span className="font-bold text-caldera-obsidian uppercase text-[10px] px-2 py-0.5 rounded-full bg-caldera-limestone border border-caldera-obsidian/20">
                {event.created_from}
              </span>
            </div>

            {isTier1 && (
              <div className="mt-2 flex items-center gap-2 text-[11px] font-bold text-caldera-obsidian bg-caldera-ember/20 p-2.5 rounded-[16px] border border-caldera-ember/40">
                <Lock className="w-4 h-4 shrink-0 text-caldera-ember" />
                <span>Bloque protegido: no se permite superposición ni reprogramación automática.</span>
              </div>
            )}
          </div>

          {(event.created_from === 'classroom_sync' || Boolean(event.classroom_coursework_id)) && (
            <a
              href="https://classroom.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-full bg-caldera-plasma hover:opacity-90 text-caldera-chalk font-bold text-xs transition-opacity"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Abrir en Google Classroom</span>
            </a>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-2">
            {!isTier1 && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center justify-center gap-1.5 px-5 py-3 rounded-full border border-caldera-ember text-caldera-ember text-xs font-bold hover:bg-caldera-ember/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-full bg-caldera-obsidian text-caldera-chalk text-xs font-bold hover:bg-caldera-obsidian/90 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
