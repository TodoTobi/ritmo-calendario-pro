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
    <header className="sticky top-0 z-20 flex flex-col border-b-2 border-duo-border-light bg-white/95 px-4 pt-3 pb-2.5 backdrop-blur-xs font-nunito">
      <div className="flex items-center justify-between gap-2">
        {/* Month Title & Chevron Navigation */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            type="button"
            onClick={onOpenMonthYearPicker}
            aria-label={`Seleccionar mes y año, actualmente ${currentDateText}`}
            className="group flex items-center gap-1.5 text-left rounded-xl py-1 px-2.5 -ml-1 transition-colors hover:bg-duo-green-light/30 active:scale-[0.98]"
          >
            <h1 className="text-xl font-extrabold tracking-tight text-duo-charcoal capitalize truncate group-hover:text-duo-green transition-colors">
              {currentDateText}
            </h1>
            <ChevronDown className="w-4 h-4 text-duo-gray group-hover:text-duo-green transition-colors shrink-0" />
          </button>
          <div className="flex items-center gap-1 ml-0.5">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Mes anterior"
              className="p-1 rounded-xl border-2 border-duo-gray-faded/40 text-duo-gray hover:text-duo-charcoal hover:border-duo-green hover:bg-duo-green-light/20 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Mes siguiente"
              className="p-1 rounded-xl border-2 border-duo-gray-faded/40 text-duo-gray hover:text-duo-charcoal hover:border-duo-green hover:bg-duo-green-light/20 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick "Hoy" Button — Duolingo Eager Green Sticker Button */}
          <button
            type="button"
            onClick={onTodayClick}
            className="rounded-xl bg-duo-green px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-duo-green transition-all active:translate-y-0.5"
          >
            Hoy
          </button>

          {/* Focus Mode Toggle */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            aria-label="Modo Foco"
            title={isFocusMode ? 'Modo Foco Activo (Solo UTN y Prioridades)' : 'Activar Modo Foco'}
            className={`p-1.5 rounded-xl border-2 transition-all ${
              isFocusMode
                ? 'bg-duo-blue text-white border-duo-blue shadow-duo-blue'
                : 'text-duo-gray border-duo-gray-faded/40 hover:text-duo-charcoal hover:border-duo-gray-faded'
            }`}
          >
            <Filter className="w-4 h-4" />
          </button>

          {/* Search Button */}
          <button
            type="button"
            onClick={onSearchClick}
            aria-label="Buscar eventos"
            className="p-1.5 rounded-xl border-2 border-duo-gray-faded/40 text-duo-gray hover:text-duo-charcoal hover:border-duo-gray-faded transition-all"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isFocusMode && (
        <div className="mt-2.5 flex items-center justify-between rounded-xl bg-duo-green-light/50 px-3.5 py-1.5 text-xs font-bold text-duo-charcoal border-2 border-duo-green">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-duo-green shrink-0" />
            Modo Foco — Mostrando únicamente bloques Tier 1 y UTN
          </span>
          <button
            type="button"
            onClick={onToggleFocusMode}
            className="underline text-[11px] ml-2 font-extrabold text-duo-blue hover:text-duo-charcoal"
          >
            Desactivar
          </button>
        </div>
      )}
    </header>
  );
};
