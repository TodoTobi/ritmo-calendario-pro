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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn font-nunito"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 border-2 border-duo-border-light shadow-duo-sticker transform transition-all animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-duo-border-light">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-duo-green text-white flex items-center justify-center shadow-duo-green">
              <CalendarIcon className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2
                id="month-year-picker-title"
                className="text-base font-extrabold text-duo-charcoal"
              >
                Navegar al Mes
              </h2>
              <p className="text-xs text-duo-gray font-bold">Selecciona mes y año del calendario</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar selector"
            className="p-1 rounded-xl text-duo-gray hover:text-duo-charcoal hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Year Selector */}
        <div className="py-4 space-y-2.5">
          <div className="flex items-center justify-between px-2">
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y - 1)}
              aria-label="Año anterior"
              className="p-2 rounded-xl border-2 border-duo-border-light text-duo-charcoal hover:bg-gray-50 active:translate-y-0.5 transition-all"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <span className="text-2xl font-extrabold text-duo-charcoal tracking-tight">
              {selectedYear}
            </span>
            <button
              type="button"
              onClick={() => setSelectedYear((y) => y + 1)}
              aria-label="Año siguiente"
              className="p-2 rounded-xl border-2 border-duo-border-light text-duo-charcoal hover:bg-gray-50 active:translate-y-0.5 transition-all"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Quick Year Pills */}
          <div className="flex items-center justify-center gap-1.5">
            {quickYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-3 py-1 text-xs font-extrabold uppercase rounded-xl border-2 transition-all ${
                  selectedYear === yr
                    ? 'bg-duo-charcoal text-white border-duo-charcoal shadow-duo-sticker'
                    : 'bg-[#f7f7f7] text-duo-gray border-duo-border-light hover:text-duo-charcoal'
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
                className={`py-2.5 px-2 rounded-xl flex flex-col items-center justify-center transition-all active:translate-y-0.5 border-2 ${
                  isCurrentlySelected
                    ? 'bg-duo-green text-white border-duo-green shadow-duo-green font-extrabold'
                    : isTodayMonth
                    ? 'bg-duo-green-light text-duo-green border-duo-green font-extrabold'
                    : 'bg-[#f7f7f7] text-duo-charcoal border-duo-border-light hover:border-duo-green font-bold'
                }`}
              >
                <span className="text-xs font-extrabold">{m.name}</span>
                <span
                  className={`text-[9px] uppercase font-extrabold tracking-wider mt-0.5 ${
                    isCurrentlySelected ? 'text-white/80' : 'text-duo-gray'
                  }`}
                >
                  {m.short}
                </span>
              </button>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t-2 border-duo-border-light flex items-center justify-between">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="text-xs font-extrabold text-duo-blue uppercase hover:underline py-1 px-2 rounded-xl"
          >
            Ir a Hoy
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-duo-green text-xs font-extrabold uppercase text-white shadow-duo-green hover:opacity-95 transition-all active:translate-y-0.5"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
