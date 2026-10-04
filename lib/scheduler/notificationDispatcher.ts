import { format, parseISO, differenceInHours } from 'date-fns';
import { getSupabaseServerClient } from '../supabase/server';
import { sendTelegramMessage } from '../telegram/bot';
import { AlertCadence, CalendarEvent } from '../../types/database.types';
import { timeStringToMinutes } from '../date-utils';

export interface SacredTier1Rule {
  name: string;
  daysOfWeek: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  startMinutes: number; // Minutos desde 00:00
  endMinutes: number;
}

/**
 * Sacred Tier 1 inamovible blocks (Buenos Aires GMT-3)
 * Alerts are strictly suppressed during these periods.
 */
export const SACRED_TIER1_RULES: SacredTier1Rule[] = [
  // 1. Devocional Diario: Todos los días (0-6) alrededor de las 07:00 (06:45 - 07:45)
  {
    name: 'Devocional Diario',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    startMinutes: 6 * 60 + 45, // 06:45
    endMinutes: 7 * 60 + 45,   // 07:45
  },
  // 2. UTN Cursada Sábados: Sábados de 08:00 a 14:30
  {
    name: 'UTN Cursada Sábados',
    daysOfWeek: [6],
    startMinutes: 8 * 60,       // 08:00
    endMinutes: 14 * 60 + 30,   // 14:30
  },
  // 3. Iglesia Miércoles: Miércoles de 19:00 a 21:30
  {
    name: 'Iglesia Miércoles',
    daysOfWeek: [3],
    startMinutes: 19 * 60,      // 19:00
    endMinutes: 21 * 60 + 30,   // 21:30
  },
  // 4. Iglesia / Reunión Jóvenes Sábado: Sábados de 17:00 a 23:00
  {
    name: 'Iglesia Sábado',
    daysOfWeek: [6],
    startMinutes: 17 * 60,      // 17:00
    endMinutes: 23 * 60,        // 23:00
  },
  // 5. Iglesia Culto Dominical: Domingos de 18:00 a 23:00
  {
    name: 'Iglesia Domingo',
    daysOfWeek: [0],
    startMinutes: 18 * 60,      // 18:00
    endMinutes: 23 * 60,        // 23:00
  },
  // 6. Clases de Inglés: Martes y Jueves de 18:30 a 20:30
  {
    name: 'Clases de Inglés',
    daysOfWeek: [2, 4],
    startMinutes: 18 * 60 + 30, // 18:30
    endMinutes: 20 * 60 + 30,   // 20:30
  },
];

export interface BuenosAiresTimeInfo {
  year: number;
  month: number;
  day: number;
  dayOfWeek: number;
  hours: number;
  minutes: number;
  currentMinutes: number;
  dateString: string;
}

/**
 * Returns date and time breakdown in America/Argentina/Buenos_Aires (UTC-3).
 */
export function getBuenosAiresTime(date: Date): BuenosAiresTimeInfo {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const findPart = (t: string) => parts.find((p) => p.type === t)?.value || '';

  const weekdayStr = findPart('weekday');
  const dayOfWeekMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const dayOfWeek = dayOfWeekMap[weekdayStr] ?? date.getDay();
  const year = parseInt(findPart('year'), 10) || date.getFullYear();
  const month = parseInt(findPart('month'), 10) || date.getMonth() + 1;
  const day = parseInt(findPart('day'), 10) || date.getDate();
  const hours = parseInt(findPart('hour'), 10) || 0;
  const minutes = parseInt(findPart('minute'), 10) || 0;
  const currentMinutes = hours * 60 + minutes;
  const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return {
    year,
    month,
    day,
    dayOfWeek,
    hours,
    minutes,
    currentMinutes,
    dateString,
  };
}

export interface QuietWindowStatus {
  isQuiet: boolean;
  matchedReason?: string;
  blockEndMinutes?: number;
  nextAllowedWindow?: Date;
}

/**
 * Checks whether a given timestamp falls into any Tier 1 Inamovible block.
 */
export function checkQuietWindowStatus(
  date: Date,
  additionalEvents?: CalendarEvent[]
): QuietWindowStatus {
  const timeInfo = getBuenosAiresTime(date);

  // 1. Check fixed sacred routines
  for (const rule of SACRED_TIER1_RULES) {
    if (rule.daysOfWeek.includes(timeInfo.dayOfWeek)) {
      if (timeInfo.currentMinutes >= rule.startMinutes && timeInfo.currentMinutes < rule.endMinutes) {
        // Compute next allowed window (+ 15 min buffer after block end)
        const allowedMinutes = rule.endMinutes + 15;
        const allowedHours = Math.floor(allowedMinutes / 60);
        const allowedMins = allowedMinutes % 60;

        const nextAllowed = new Date(date);
        // Set Buenos Aires local hours
        nextAllowed.setUTCHours(allowedHours + 3, allowedMins, 0, 0);

        return {
          isQuiet: true,
          matchedReason: rule.name,
          blockEndMinutes: rule.endMinutes,
          nextAllowedWindow: nextAllowed,
        };
      }
    }
  }

  // 2. Check dynamic events passed in or present
  if (additionalEvents && additionalEvents.length > 0) {
    for (const ev of additionalEvents) {
      if (ev.tier === 'tier_1' && ev.event_date === timeInfo.dateString) {
        const startMin = timeStringToMinutes(ev.start_time);
        const endMin = timeStringToMinutes(ev.end_time);

        if (timeInfo.currentMinutes >= startMin && timeInfo.currentMinutes < endMin) {
          const allowedMinutes = endMin + 15;
          const allowedHours = Math.floor(allowedMinutes / 60);
          const allowedMins = allowedMinutes % 60;

          const nextAllowed = new Date(date);
          nextAllowed.setUTCHours(allowedHours + 3, allowedMins, 0, 0);

          return {
            isQuiet: true,
            matchedReason: `Evento Inamovible: ${ev.title}`,
            blockEndMinutes: endMin,
            nextAllowedWindow: nextAllowed,
          };
        }
      }
    }
  }

  return {
    isQuiet: false,
  };
}

/**
 * Convenience helper returning boolean for quiet window status.
 */
export function isInsideQuietWindow(date: Date, additionalEvents?: CalendarEvent[]): boolean {
  return checkQuietWindowStatus(date, additionalEvents).isQuiet;
}

/**
 * Convenience helper returning next allowed alert window.
 */
export function getNextAllowedWindow(date: Date, additionalEvents?: CalendarEvent[]): Date {
  const status = checkQuietWindowStatus(date, additionalEvents);
  if (status.nextAllowedWindow) {
    return status.nextAllowedWindow;
  }
  return date;
}

export interface DispatchedAlertResult {
  suppressed: boolean;
  reason?: string;
  nextAllowedWindow?: string | null;
  dispatchedCount: number;
  alerts: Array<{
    id: string;
    title: string;
    cadence: AlertCadence;
  }>;
}

const CADENCE_CONFIG: Array<{
  cadence: AlertCadence;
  label: string;
  minHours: number;
  maxHours: number;
}> = [
  { cadence: '2_hours', label: '2 Horas — Alerta Inminente', minHours: 0, maxHours: 2.5 },
  { cadence: '24_hours', label: '24 Horas — Mañana', minHours: 2.5, maxHours: 25 },
  { cadence: '2_days', label: '2 Días de Anticipación', minHours: 25, maxHours: 49 },
  { cadence: '3_days', label: '3 Días de Anticipación', minHours: 49, maxHours: 73 },
  { cadence: '7_days', label: '7 Días de Anticipación', minHours: 73, maxHours: 169 },
];

/**
 * Dispatches pending preventive alerts across events and tasks.
 * Strictly respects Smart Quiet Windows by suppressing alerts during Tier 1 blocks.
 */
export async function dispatchPendingAlerts(referenceDate?: Date): Promise<DispatchedAlertResult> {
  const now = referenceDate || new Date();
  const supabase = getSupabaseServerClient();

  // 1. Query today's Tier 1 calendar events to supplement static rules
  const timeInfo = getBuenosAiresTime(now);
  const { data: dbTier1Events } = await supabase
    .from('events')
    .select('*')
    .eq('event_date', timeInfo.dateString)
    .eq('tier', 'tier_1');

  // 2. Evaluate Smart Quiet Window status
  const quietStatus = checkQuietWindowStatus(now, (dbTier1Events as CalendarEvent[]) || []);

  if (quietStatus.isQuiet) {
    console.log(
      `[SmartQuietWindows] Delivery SUPPRESSED due to sacred inamovible block: "${quietStatus.matchedReason}".`
    );

    return {
      suppressed: true,
      reason: quietStatus.matchedReason || 'Smart Quiet Window activa',
      nextAllowedWindow: quietStatus.nextAllowedWindow?.toISOString() || null,
      dispatchedCount: 0,
      alerts: [],
    };
  }

  // 3. Find recipient chat ID (from users_profile or env)
  let recipientChatId = process.env.TELEGRAM_AUTHORIZED_CHAT_ID;
  if (!recipientChatId) {
    const { data: profile } = await supabase
      .from('users_profile')
      .select('telegram_chat_id')
      .single();
    if (profile?.telegram_chat_id) {
      recipientChatId = String(profile.telegram_chat_id);
    }
  }

  if (!recipientChatId) {
    console.warn('[NotificationDispatcher] No telegram_chat_id found. Cannot dispatch alerts.');
  }

  const dispatchedAlerts: Array<{ id: string; title: string; cadence: AlertCadence }> = [];

  // 4. Query upcoming calendar events within next 7 days
  const futureDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const futureDateStr = format(futureDate, 'yyyy-MM-dd');

  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', timeInfo.dateString)
    .lte('event_date', futureDateStr)
    .order('event_date', { ascending: true });

  if (upcomingEvents && upcomingEvents.length > 0) {
    for (const ev of upcomingEvents) {
      // Build ISO event start timestamp
      const eventStartIso = `${ev.event_date}T${ev.start_time}:00-03:00`;
      const eventStartDate = parseISO(eventStartIso);
      const diffHours = (eventStartDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (diffHours < 0) continue; // Already started

      // Match cadence
      const matchingCadence = CADENCE_CONFIG.find(
        (c) => diffHours >= c.minHours && diffHours <= c.maxHours
      );

      if (!matchingCadence) continue;

      // Check if alert already sent in alerts_queue
      const { data: existingAlert } = await supabase
        .from('alerts_queue')
        .select('*')
        .eq('event_id', ev.id)
        .eq('cadence', matchingCadence.cadence)
        .eq('status', 'dispatched')
        .maybeSingle();

      if (existingAlert) {
        continue; // Already notified at this cadence
      }

      // Dispatch alert via Telegram
      if (recipientChatId) {
        const text = `🚨 <b>Recordatorio Ritmo [${matchingCadence.label}]</b>\n\n📌 <b>${ev.title}</b>\n🗓 Fecha: <code>${ev.event_date}</code>\n⏰ Horario: <code>${ev.start_time} - ${ev.end_time}</code>\n⏳ Faltan aprox.: <b>${Math.max(1, Math.round(diffHours))} horas</b>`;

        await sendTelegramMessage(recipientChatId, text);
      }

      // Record in alerts_queue
      await supabase.from('alerts_queue').insert({
        event_id: ev.id,
        cadence: matchingCadence.cadence,
        scheduled_for: now.toISOString(),
        status: 'dispatched',
        dispatched_at: now.toISOString(),
      });

      dispatchedAlerts.push({
        id: ev.id,
        title: ev.title,
        cadence: matchingCadence.cadence,
      });
    }
  }

  return {
    suppressed: false,
    dispatchedCount: dispatchedAlerts.length,
    alerts: dispatchedAlerts,
  };
}
