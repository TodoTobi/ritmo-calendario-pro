import assert from 'assert';
import { normalizeTimeString, CADENCE_CONFIG } from '../lib/scheduler/notificationDispatcher';
import { parseISO } from 'date-fns';

console.log('\n--- 🔔 RUNNING NOTIFICATION DISPATCHER & CADENCE TESTS ---');

// 1. Time Normalization Tests
const test1 = normalizeTimeString('06:45');
assert.strictEqual(test1, '06:45:00', 'Should normalize HH:mm to HH:mm:00');
console.log('✅ PASS: "06:45" normalizes to "06:45:00"');

const test2 = normalizeTimeString('06:45:00');
assert.strictEqual(test2, '06:45:00', 'Should keep HH:mm:ss without double-padding');
console.log('✅ PASS: "06:45:00" normalizes cleanly to "06:45:00" (no double-colon bug)');

const test3 = normalizeTimeString('6:45');
assert.strictEqual(test3, '06:45:00', 'Should pad single-digit hour to 06:45:00');
console.log('✅ PASS: "6:45" normalizes to "06:45:00"');

const test4 = normalizeTimeString('06:45:00.000');
assert.strictEqual(test4, '06:45:00', 'Should strip millisecond precision to HH:mm:ss');
console.log('✅ PASS: "06:45:00.000" normalizes to "06:45:00"');

// 2. ISO Date Parsing Validation (Preventing Invalid Date / NaN)
const dateStr = '2026-10-05';
const isoValid = `${dateStr}T${test1}-03:00`;
const parsedDate = parseISO(isoValid);
assert.ok(!isNaN(parsedDate.getTime()), 'Parsed date timestamp must not be NaN');
console.log(`✅ PASS: ISO timestamp "${isoValid}" parses validly without NaN: ${parsedDate.toISOString()}`);

// Ensure previously buggy format fails or would have failed
const buggyIso = `${dateStr}T06:45:00:00-03:00`;
const buggyDate = parseISO(buggyIso);
assert.ok(isNaN(buggyDate.getTime()), 'Old buggy ISO string must produce NaN');
console.log('✅ PASS: Old buggy double-colon format produces NaN as expected (bug prevented)');

// 3. Cadence Config & Imminent cadence test
const imminentCadence = CADENCE_CONFIG.find((c) => c.cadence === 'imminent');
assert.ok(imminentCadence, 'CADENCE_CONFIG must contain "imminent" cadence');
assert.strictEqual(imminentCadence.minHours, 0);
assert.strictEqual(imminentCadence.maxHours, 1);
console.log('✅ PASS: "imminent" cadence is configured for 0 to 1 hour window');

// Test cadence matching for 25 minutes (0.416 hours)
const diffHours25m = 25 / 60;
const matched25m = CADENCE_CONFIG.find(
  (c) => diffHours25m >= c.minHours && diffHours25m <= c.maxHours
);
assert.strictEqual(matched25m?.cadence, 'imminent');
console.log('✅ PASS: Event starting in 25 min matches "imminent" cadence');

// Test cadence matching for 90 minutes (1.5 hours)
const diffHours90m = 90 / 60;
const matched90m = CADENCE_CONFIG.find(
  (c) => diffHours90m >= c.minHours && diffHours90m <= c.maxHours
);
assert.strictEqual(matched90m?.cadence, '2_hours');
console.log('✅ PASS: Event starting in 90 min matches "2_hours" cadence');

console.log('--- 🎉 ALL NOTIFICATION DISPATCHER TESTS PASSED SUCCESSFULLY ---\n');
