import React from 'react';
import { Search, Sparkles, Filter, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

interface TopHeaderProps {
  currentDateText: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onTodayClick: () => void;
  onSearchClick: () => void;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenMonthYearPicker?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentDateText,
  onPrevMonth,
  onNextMonth,
  onTodayClick,
  onSearchClick,
  isFocusMode,
  onToggleFocusMode,
  onOpenMonthYearPicker,
}) => {
  return (
    <header className="sticky top-0 z-20 flex flex-col border-b border-dotted border-caldera-obsidian/25 bg-caldera-limestone/95 px-4 pt-3 pb-2.5 backdrop-blur-xs">
      <div className="flex items-center justify-between gap-2">
        {/* Month Title & Chevron Navigation */}
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={onOpenMonthYearPicker}
            aria-label={`Seleccionar mes y año, actualmente ${currentDateText}`}
            className="group flex items-center gap-1.5 text-left rounded-full py-1 px-2.5 -ml-1 transition-colors hover:bg-caldera-pumice active:scale-[0.98]"
          >
            <h1 className="font-display text-2xl tracking-wider text-caldera-obsidian uppercase truncate group-hover:text-caldera-ember transition-colors">
              {currentDateText}
            </h1>
            <ChevronDown className="w-4 h-4 text-caldera-obsidian/60 group-hover:text-caldera-ember transition-colors shrink-0" />
          </button>
          <div className="flex items-center ml-0.5">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Mes anterior"
              className="p-1.5 rounded-full text-caldera-obsidian/70 hover:text-caldera-obsidian hover:bg-caldera-pumice transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Mes siguiente"
              className="p-1.5 rounded-full text-caldera-obsidian/70 hover:text-caldera-obsidian hover:bg-caldera-pumice transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick "Hoy" Button — Caldera Ember Pill */}
          <button
            type="button"
            onClick={onTodayClick}
            className="rounded-full bg-caldera-ember px-3.5 py-1 text-xs font-bold text-caldera-obsidian transition-all duration-150 active:scale-95 hover:bg-caldera-ember-hover border border-caldera-obsidian/20"
          >
            Hoy
          </button>

          {/* Focus Mode Toggle */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            aria-label="Modo Foco"
            title={isFocusMode ? 'Modo Foco Activo (Solo UTN y Prioridades)' : 'Activar Modo Foco'}
            className={`p-2 rounded-full transition-colors border ${
              isFocusMode
                ? 'bg-caldera-ember text-caldera-obsidian border-caldera-obsidian'
                : 'text-caldera-obsidian/70 hover:text-caldera-obsidian hover:bg-caldera-pumice border-transparent'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Search Button */}
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Buscar eventos"
            className="p-2 rounded-full text-caldera-obsidian/70 hover:text-caldera-obsidian hover:bg-caldera-pumice transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isFocusMode && (
        <div className="mt-2 flex items-center justify-between rounded-full bg-caldera-ember/20 px-3 py-1 text-[11px] font-bold text-caldera-obsidian border border-caldera-ember">
          <span className="flex items-center gap-1.5 font-sans">
            <Sparkles className="w-3.5 h-3.5 text-caldera-ember shrink-0" />
            Modo Foco — Mostrando únicamente bloques Tier 1 y UTN
          </span>
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="underline text-[10px] ml-2 font-bold hover:text-caldera-ember"
          >
            Desactivar
          </button>
        </div>
      )}
    </header>
  );
};
