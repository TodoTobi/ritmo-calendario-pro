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
    <header className="sticky top-0 z-20 flex flex-col border-b border-family-stone bg-family-cream/95 px-4 pt-3 pb-2.5 backdrop-blur-xs font-inter">
      <div className="flex items-center justify-between gap-2">
        {/* Month Title & Chevron Navigation */}
        <div className="flex items-center gap-1 min-w-0">
          <button
            type="button"
            onClick={onOpenMonthYearPicker}
            aria-label={`Seleccionar mes y año, actualmente ${currentDateText}`}
            className="group flex items-center gap-1.5 text-left rounded-full py-1 px-2.5 -ml-1 transition-colors hover:bg-family-stone/50 active:scale-[0.98]"
          >
            <h1 className="text-xl font-medium tracking-tight text-family-ink capitalize truncate group-hover:text-family-charcoal transition-colors">
              {currentDateText}
            </h1>
            <ChevronDown className="w-4 h-4 text-family-muted group-hover:text-family-ink transition-colors shrink-0" />
          </button>
          <div className="flex items-center ml-0.5">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Mes anterior"
              className="p-1.5 rounded-full text-family-muted hover:text-family-ink hover:bg-family-stone/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Mes siguiente"
              className="p-1.5 rounded-full text-family-muted hover:text-family-ink hover:bg-family-stone/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick "Hoy" Button — Family Dark Pill Button (#121212) */}
          <button
            type="button"
            onClick={onTodayClick}
            className="rounded-full bg-family-ink px-3.5 py-1 text-xs font-semibold text-white transition-all duration-150 active:scale-95 hover:bg-family-charcoal"
          >
            Hoy
          </button>

          {/* Focus Mode Toggle */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            aria-label="Modo Foco"
            title={isFocusMode ? 'Modo Foco Activo (Solo UTN y Prioridades)' : 'Activar Modo Foco'}
            className={`p-1.5 rounded-full transition-colors ${
              isFocusMode
                ? 'bg-family-orange text-white'
                : 'text-family-muted hover:text-family-ink hover:bg-family-stone/50'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Search Button */}
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Buscar eventos"
            className="p-1.5 rounded-full text-family-muted hover:text-family-ink hover:bg-family-stone/50 transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isFocusMode && (
        <div className="mt-2.5 flex items-center justify-between rounded-[10px] bg-family-orange/10 px-3 py-1.5 text-xs font-medium text-family-orange border border-family-orange/20">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-family-orange shrink-0" />
            Modo Foco — Mostrando únicamente bloques Tier 1 y UTN
          </span>
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="underline text-[11px] ml-2 font-semibold hover:text-family-charcoal"
          >
            Desactivar
          </button>
        </div>
      )}
    </header>
  );
};
