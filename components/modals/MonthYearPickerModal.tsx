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

  // Quick year options around selected year
  const quickYears = [2024, 2025, 2026, 2027, 2028];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="month-year-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-ritmo-line transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-ritmo-line/80">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-ritmo-purple-soft flex items-center justify-center text-ritmo-purple">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="month-year-picker-title"
                className="font-manrope text-base font-extrabold text-ritmo-ink"
              >
                Navegar al Mes
              </h2>
              <p className="text-[11px] text-ritmo-muted">Selecciona mes y año del calendario</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector"
            className="p-1.5 rounded-full text-ritmo-muted hover:text-ritmo-ink hover:bg-ritmo-soft transition-colors"
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
              className="p-1.5 rounded-xl text-ritmo-ink hover:bg-ritmo-soft active:scale-95 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-manrope text-2xl font-black text-ritmo-ink tracking-tight">
              {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              aria-label="Año siguiente"
              className="p-1.5 rounded-xl text-ritmo-ink hover:bg-ritmo-soft active:scale-95 transition-all"
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
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                  selectedYear === yr
                    ? 'bg-ritmo-purple text-white shadow-xs'
                    : 'bg-ritmo-soft text-ritmo-muted hover:text-ritmo-ink'
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
                className={`py-3 px-2 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 ${
                  isCurrentlySelected
                    ? 'bg-ritmo-purple text-white shadow-md shadow-ritmo-purple/25 font-bold scale-[1.02]'
                    : isTodayMonth
                    ? 'bg-ritmo-purple-soft/60 text-ritmo-purple border-2 border-ritmo-purple/40 font-bold'
                    : 'bg-ritmo-soft/70 text-ritmo-ink hover:bg-ritmo-soft hover:text-ritmo-purple font-semibold'
                }`}
              >
                <span className="font-manrope text-sm tracking-tight">{m.name}</span>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider mt-0.5 ${
                    isCurrentlySelected ? 'text-white/80' : 'text-ritmo-muted'
                  }`}
                >
                  {m.short}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-ritmo-line/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="text-xs font-bold text-ritmo-purple hover:underline py-1 px-2 rounded-lg"
          >
            Ir al mes actual (Hoy)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-ritmo-soft text-xs font-bold text-ritmo-ink hover:bg-ritmo-line transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
