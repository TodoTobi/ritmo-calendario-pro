/**
 * Verification Test: Tier 1 Protection & Collision Invariants
 * Run with: node --experimental-strip-types tests/tier-protection.test.ts
 */

import { validateTierMovement, EventTimeSlot } from '../lib/calendar/tierProtection';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('\n--- 🛡️ RUNNING TIER 1 COLLISION PROTECTION TESTS ---');

// Mock existing schedule for Saturday (UTN cursada Tier 1 from 08:00 to 14:30)
const saturdaySchedule: EventTimeSlot[] = [
  {
    id: 't1-utn-sat',
    title: 'UTN — Cursada Sábados (Álgebra & Sistemas)',
    startTime: '08:00',
    endTime: '14:30',
    tier: 'tier_1',
  },
  {
    id: 't1-church-sat',
    title: 'Iglesia / Jóvenes Sábado',
    startTime: '17:00',
    endTime: '23:00',
    tier: 'tier_1',
  },
  {
    id: 't2-study-group',
    title: 'Grupo de Estudio Física',
    startTime: '15:00',
    endTime: '16:30',
    tier: 'tier_2',
  },
];

// TEST 1: Attempting to move a Tier 1 event directly must be rejected
{
  const result = validateTierMovement(
    { id: 't1-utn-sat', tier: 'tier_1', title: 'UTN' },
    { startTime: '09:00', endTime: '15:30' },
    saturdaySchedule
  );

  assert(!result.valid, 'Moving a Tier 1 event directly must be invalid');
  assert(
    result.errorCode === 'err-tier1-conflict',
    'Error code must be err-tier1-conflict for direct Tier 1 movements'
  );
}

// TEST 2: Moving a Tier 2 event inside the UTN Tier 1 block (08:00 - 14:30) must be rejected
{
  const result = validateTierMovement(
    { id: 't2-plate', tier: 'tier_2', title: 'Entrega Práctica' },
    { startTime: '10:00', endTime: '12:00' },
    saturdaySchedule
  );

  assert(!result.valid, 'Tier 2 event overlapping Tier 1 block must be rejected');
  assert(
    result.errorCode === 'err-tier1-collision',
    'Error code must be err-tier1-collision'
  );
  assert(
    result.conflictingEvent?.title.includes('UTN') ?? false,
    'Conflicting event must correctly identify the UTN block'
  );
}

// TEST 3: Partial collision: starts before Tier 1, ends inside Tier 1 (07:30 - 09:00)
{
  const result = validateTierMovement(
    { id: 't2-review', tier: 'tier_2', title: 'Repaso Previo' },
    { startTime: '07:30', endTime: '09:00' },
    saturdaySchedule
  );

  assert(!result.valid, 'Partial overlap starting before Tier 1 must be rejected');
  assert(result.errorCode === 'err-tier1-collision', 'Must return err-tier1-collision');
}

// TEST 4: Partial collision: starts inside Tier 1, ends after Tier 1 (14:00 - 15:30)
{
  const result = validateTierMovement(
    { id: 't2-lunch', tier: 'tier_2', title: 'Almuerzo Extendido' },
    { startTime: '14:00', endTime: '15:30' },
    saturdaySchedule
  );

  assert(!result.valid, 'Partial overlap ending after Tier 1 must be rejected');
  assert(result.errorCode === 'err-tier1-collision', 'Must return err-tier1-collision');
}

// TEST 5: Total envelope: starts before and ends after Tier 1 (07:00 - 15:00)
{
  const result = validateTierMovement(
    { id: 't2-hackathon', tier: 'tier_2', title: 'Hackathon' },
    { startTime: '07:00', endTime: '15:00' },
    saturdaySchedule
  );

  assert(!result.valid, 'Total envelope covering Tier 1 must be rejected');
  assert(result.errorCode === 'err-tier1-collision', 'Must return err-tier1-collision');
}

// TEST 6: Boundary case: ending exactly at Tier 1 start (06:30 - 08:00) -> ALLOWED
{
  const result = validateTierMovement(
    { id: 't3-gym', tier: 'tier_3', title: 'Entrenamiento Matutino' },
    { startTime: '06:30', endTime: '08:00' },
    saturdaySchedule
  );

  assert(result.valid, 'Slot ending exactly at Tier 1 start time must be allowed');
}

// TEST 7: Boundary case: starting exactly at Tier 1 end (14:30 - 16:30) -> ALLOWED
{
  const result = validateTierMovement(
    { id: 't3-drawing', tier: 'tier_3', title: 'Lámina 4 Dibujo Técnico' },
    { startTime: '14:30', endTime: '16:30' },
    saturdaySchedule
  );

  assert(result.valid, 'Slot starting exactly at Tier 1 end time must be allowed');
}

// TEST 8: Valid free window between UTN and Church (14:45 - 16:45) -> ALLOWED
{
  const result = validateTierMovement(
    { id: 't3-drawing-plate', tier: 'tier_3', title: 'Lámina de Dibujo' },
    { startTime: '14:45', endTime: '16:45' },
    saturdaySchedule
  );

  assert(result.valid, 'Event placed in safe transition window must be accepted');
}

// TEST 9: Inconsistent time range (end_time <= start_time) -> REJECTED
{
  const result = validateTierMovement(
    { id: 't2-bad-range', tier: 'tier_2', title: 'Error de Horario' },
    { startTime: '16:00', endTime: '15:00' },
    saturdaySchedule
  );

  assert(!result.valid, 'Event with end_time <= start_time must be invalid');
  assert(result.errorCode === 'invalid-time-range', 'Must return invalid-time-range error code');
}

console.log('--- 🎉 ALL TIER 1 PROTECTION TESTS PASSED SUCCESSFULLY ---\n');
