import { EventTier } from '../../types/database.types';
import { timeStringToMinutes } from '../date-utils';

export interface EventTimeSlot {
  id?: string;
  title: string;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
  tier: EventTier;
}

export interface TierValidationResult {
  valid: boolean;
  errorCode?: 'err-tier1-conflict' | 'err-tier1-collision' | 'invalid-time-range';
  message?: string;
  conflictingEvent?: EventTimeSlot;
}

/**
 * Validates moving an event according to Tier 1 Inamovible protection invariants.
 *
 * Invariants:
 * 1. End time must be strictly greater than start time.
 * 2. An event belonging to Tier 1 cannot be rescheduled or moved directly.
 * 3. An event moving to a timeslot that overlaps with an existing Tier 1 block is rejected.
 */
export function validateTierMovement(
  eventToMove: { id: string; tier: EventTier; title?: string },
  proposedSlot: { startTime: string; endTime: string },
  existingDayEvents: EventTimeSlot[]
): TierValidationResult {
  const proposedStartMin = timeStringToMinutes(proposedSlot.startTime);
  const proposedEndMin = timeStringToMinutes(proposedSlot.endTime);

  // 1. Time range ordering check
  if (proposedEndMin <= proposedStartMin) {
    return {
      valid: false,
      errorCode: 'invalid-time-range',
      message: 'La hora de finalización debe ser estrictamente posterior a la hora de inicio.',
    };
  }

  // 2. Invariant: Tier 1 events are immutably locked in place
  if (eventToMove.tier === 'tier_1') {
    return {
      valid: false,
      errorCode: 'err-tier1-conflict',
      message: 'El evento pertenece al Tier 1 (Inamovible) y está blindado contra modificaciones o desplazamientos.',
    };
  }

  // 3. Collision check against all existing Tier 1 events on that day
  const tier1Blocks = existingDayEvents.filter(
    (ev) => ev.tier === 'tier_1' && ev.id !== eventToMove.id
  );

  for (const t1 of tier1Blocks) {
    const t1Start = timeStringToMinutes(t1.startTime);
    const t1End = timeStringToMinutes(t1.endTime);

    // Overlap condition: max(startA, startB) < min(endA, endB)
    if (Math.max(proposedStartMin, t1Start) < Math.min(proposedEndMin, t1End)) {
      return {
        valid: false,
        errorCode: 'err-tier1-collision',
        message: `El horario colisiona con el bloque protegido "${t1.title}".`,
        conflictingEvent: t1,
      };
    }
  }

  return {
    valid: true,
  };
}
