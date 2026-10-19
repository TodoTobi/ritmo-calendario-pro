import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

interface MonthYearPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: Date;
  onSelectMonthYear: (year: number, monthIndex: number) => void;
}

const MONTHS = [
  { name: 'Enero', short: 'Ene' },
  { name: 'Febrero', short: 'Feb' },
  { name: 'Marzo', short: 'Mar' },
  { name: 'Abril', short: 'Abr' },
  { name: 'Mayo', short: 'May' },
  { name: 'Junio', short: 'Jun' },
  { name: 'Julio', short: 'Jul' },
  { name: 'Agosto', short: 'Ago' },
  { name: 'Septiembre', short: 'Sep' },
  { name: 'Octubre', short: 'Oct' },
  { name: 'Noviembre', short: 'Nov' },
  { name: 'Diciembre', short: 'Dic' },
];

export const MonthYearPickerModal: React.FC<MonthYearPickerModalProps> = ({
  isOpen,
  onClose,
  currentDate,
  onSelectMonthYear,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  useEffect(() => {
    if (isOpen) {
      setSelectedYear(currentDate.getFullYear());
    }
  }, [isOpen, currentDate]);

  if (!isOpen) return null;

  const currentMonthIndex = currentDate.getMonth();
  const currentActualYear = currentDate.getFullYear();
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();

  const handleSelectMonth = (monthIndex: number) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
    onSelectMonthYear(selectedYear, monthIndex);
  };

  const handleJumpToToday = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(15);
    }
    onSelectMonthYear(todayYear, todayMonth);
  };

  const quickYears = [2024, 2025, 2026, 2027, 2028];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="month-year-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-[40px] bg-caldera-limestone p-6 border border-caldera-obsidian/25 transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-dotted border-caldera-obsidian/25">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-caldera-ember flex items-center justify-center text-caldera-obsidian">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="month-year-picker-title"
                className="font-display text-lg uppercase tracking-wide text-caldera-obsidian"
              >
                Navegar al Mes
              </h2>
              <p className="text-[11px] text-caldera-muted font-medium">Selecciona mes y año del calendario</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector"
            className="p-1.5 rounded-full text-caldera-obsidian/60 hover:text-caldera-obsidian hover:bg-caldera-pumice transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Year Selector */}
        <div className="py-4 space-y-2.5">
          <div className="flex items-center justify-between px-2">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              aria-label="Año anterior"
              className="p-2 rounded-full text-caldera-obsidian hover:bg-caldera-pumice active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-display text-3xl text-caldera-obsidian tracking-wider">
              {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              aria-label="Año siguiente"
              className="p-2 rounded-full text-caldera-obsidian hover:bg-caldera-pumice active:scale-95 transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Year Pills */}
          <div className="flex items-center justify-center gap-1.5">
            {quickYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 text-xs font-bold rounded-full transition-all ${
                  selectedYear === yr
                    ? 'bg-caldera-obsidian text-caldera-chalk'
                    : 'bg-caldera-pumice text-caldera-muted hover:text-caldera-obsidian border border-caldera-obsidian/15'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>
        </div>

        {/* 12 Months 3x4 Grid */}
        <div className="grid grid-cols-3 gap-2 py-2">
          {MONTHS.map((m, idx) => {
            const isCurrentlySelected =
              selectedYear === currentActualYear && idx === currentMonthIndex;
            const isTodayMonth =
              selectedYear === todayYear && idx === todayMonth;

            return (
              <button
                key={m.short}
                type="button"
                onClick={() => handleSelectMonth(idx)}
                className={`py-3 px-2 rounded-[24px] flex flex-col items-center justify-center transition-all active:scale-95 border ${
                  isCurrentlySelected
                    ? 'bg-caldera-ember text-caldera-obsidian border-caldera-obsidian/30 font-bold scale-[1.02]'
                    : isTodayMonth
                    ? 'bg-caldera-sulfur text-caldera-obsidian border-caldera-obsidian/30 font-bold'
                    : 'bg-caldera-pumice/50 text-caldera-obsidian border-caldera-obsidian/15 hover:bg-caldera-pumice font-medium'
                }`}
              >
                <span className="font-display text-sm tracking-wide uppercase">{m.name}</span>
                <span
                  className={`text-[9px] uppercase font-bold tracking-wider mt-0.5 ${
                    isCurrentlySelected ? 'text-caldera-obsidian/80' : 'text-caldera-muted'
                  }`}
                >
                  {m.short}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-dotted border-caldera-obsidian/25 flex items-center justify-between">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="text-xs font-bold text-caldera-ember hover:underline py-1 px-2 rounded-full"
          >
            Ir a Hoy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-caldera-obsidian text-xs font-bold text-caldera-chalk hover:bg-caldera-obsidian/90 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
