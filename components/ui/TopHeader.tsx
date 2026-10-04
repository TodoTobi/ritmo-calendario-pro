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
    <header className="sticky top-0 z-20 flex flex-col border-b border-ritmo-line/80 bg-white/95 px-4 pt-3 pb-2.5 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        {/* Month Title & Chevron Navigation */}
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={onOpenMonthYearPicker}
            aria-label={`Seleccionar mes y año, actualmente ${currentDateText}`}
            className="group flex items-center gap-1 text-left rounded-xl py-1 px-1.5 -ml-1.5 transition-colors hover:bg-ritmo-soft active:scale-[0.98]"
          >
            <h1 className="font-manrope text-xl font-extrabold tracking-tight text-ritmo-ink capitalize truncate group-hover:text-ritmo-purple transition-colors">
              {currentDateText}
            </h1>
            <ChevronDown className="w-4 h-4 text-ritmo-muted group-hover:text-ritmo-purple transition-colors shrink-0" />
          </button>
          <div className="flex items-center ml-0.5">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Mes anterior"
              className="p-1 rounded-full text-ritmo-muted hover:text-ritmo-ink hover:bg-ritmo-soft transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Mes siguiente"
              className="p-1 rounded-full text-ritmo-muted hover:text-ritmo-ink hover:bg-ritmo-soft transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick "Hoy" Button */}
          <button
            type="button"
            onClick={onTodayClick}
            className="rounded-full border border-ritmo-purple/40 bg-ritmo-purple-soft px-3 py-1 text-xs font-bold text-ritmo-purple transition-all duration-150 active:scale-95 hover:bg-ritmo-purple hover:text-white"
          >
            Hoy
          </button>

          {/* Focus Mode Toggle */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            aria-label="Modo Foco"
            title={isFocusMode ? 'Modo Foco Activo (Solo UTN y Prioridades)' : 'Activar Modo Foco'}
            className={`p-2 rounded-full transition-colors ${
              isFocusMode
                ? 'bg-ritmo-red text-white'
                : 'text-ritmo-muted hover:text-ritmo-ink hover:bg-ritmo-soft'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Search Button */}
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Buscar eventos"
            className="p-2 rounded-full text-ritmo-muted hover:text-ritmo-ink hover:bg-ritmo-soft transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isFocusMode && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-[#fff0f1] px-2.5 py-1 text-[11px] font-semibold text-[#ff5d63] border border-[#ff5d63]/20">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            Modo Foco Activo — Mostrando únicamente bloques Tier 1 y UTN
          </span>
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="underline text-[10px] ml-2"
          >
            Desactivar
          </button>
        </div>
      )}
    </header>
  );
};
