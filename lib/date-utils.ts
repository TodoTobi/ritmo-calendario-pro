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

/**
 * Converts any Date or ISO string into Buenos Aires components (year, month, day, hours, minutes).
 * Strictly immune to server runtime timezone (e.g. Vercel UTC).
 */
export function getBuenosAiresDateParts(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE_ARGENTINA,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = dtf.formatToParts(d);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '';

  const year = parseInt(getPart('year'), 10) || d.getFullYear();
  const month = parseInt(getPart('month'), 10) || d.getMonth() + 1;
  const day = parseInt(getPart('day'), 10) || d.getDate();
  const hours = parseInt(getPart('hour'), 10) || 0;
  const minutes = parseInt(getPart('minute'), 10) || 0;

  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    hours,
    minutes,
    dateString, // "2026-10-05"
    timeString, // "07:59"
  };
}

/**
 * Returns formatted date and time in Argentina timezone (GMT-3):
 * e.g. "05/10 07:59"
 */
export function formatInArgentina(
  date: Date | string,
  formatType: 'datetime' | 'date' | 'time' | 'short_date' = 'datetime'
): string {
  const parts = getBuenosAiresDateParts(date);
  const dayStr = String(parts.day).padStart(2, '0');
  const monthStr = String(parts.month).padStart(2, '0');

  switch (formatType) {
    case 'date':
      return parts.dateString; // "2026-10-05"
    case 'time':
      return parts.timeString; // "07:59"
    case 'short_date':
      return `${dayStr}/${monthStr}`; // "05/10"
    case 'datetime':
    default:
      return `${dayStr}/${monthStr} ${parts.timeString}`; // "05/10 07:59"
  }
}

export function getArgentinaDateString(date: Date | string): string {
  return formatInArgentina(date, 'date');
}

export function getArgentinaTimeString(date: Date | string): string {
  return formatInArgentina(date, 'time');
}

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
