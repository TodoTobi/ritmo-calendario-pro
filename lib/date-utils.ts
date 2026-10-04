import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isYesterday,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';

export const TIMEZONE_ARGENTINA = 'America/Argentina/Buenos_Aires';

export function formatDateSafe(date: Date | string, formatPattern: string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatPattern, { locale: es });
}

export function formatDayHeader(dateStr: string): { label: string; dateNum: string; isCurrentDay: boolean } {
  const date = parseISO(dateStr);
  const currentDay = isToday(date);

  let label = format(date, 'EEEE', { locale: es }).toUpperCase();
  if (currentDay) {
    label = 'HOY';
  } else if (isTomorrow(date)) {
    label = 'MAÑANA';
  } else if (isYesterday(date)) {
    label = 'AYER';
  }

  const dateNum = format(date, "d 'DE' MMMM", { locale: es }).toUpperCase();

  return {
    label,
    dateNum,
    isCurrentDay: currentDay,
  };
}

export function getMonthDaysGrid(currentDate: Date) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  // Start week on Monday (1)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: startDate, end: endDate });
}

export function getWeekDaysStrip(currentDate: Date) {
  const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
  const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });

  return eachDayOfInterval({ start: startDate, end: endDate });
}

export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
}

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export { isSameMonth, isSameDay, isToday, addMonths, subMonths, format, parseISO };
