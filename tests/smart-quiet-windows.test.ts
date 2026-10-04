/**
 * Verification Test: Smart Quiet Windows Logic
 * Tests alert suppression during Tier 1 sacred inamovible blocks
 * and alert permission during transition/free windows.
 */

import {
  checkQuietWindowStatus,
  isInsideQuietWindow,
  getNextAllowedWindow,
  getBuenosAiresTime,
} from '../lib/scheduler/notificationDispatcher';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

console.log('\n--- 🔕 RUNNING SMART QUIET WINDOWS TESTS ---');

// 1. Devocional Diario: Todos los días a las 07:00 (06:45 - 07:45)
{
  const devocionalTime = new Date('2026-10-05T07:15:00-03:00'); // Lunes 07:15 GMT-3
  const status = checkQuietWindowStatus(devocionalTime);

  assert(status.isQuiet, 'Alert during morning devotional (07:15) must be suppressed');
  assert(
    status.matchedReason === 'Devocional Diario',
    'Matched rule must be Devocional Diario'
  );
}

// 2. Devocional Diario free window: Lunes 11:00
{
  const morningFreeTime = new Date('2026-10-05T11:00:00-03:00'); // Lunes 11:00 GMT-3
  const status = checkQuietWindowStatus(morningFreeTime);

  assert(!status.isQuiet, 'Alert at 11:00 on Monday must be allowed (free window)');
}

// 3. UTN Cursada Sábados: Sábado 10:30 (dentro de 08:00 - 14:30)
{
  const utnTime = new Date('2026-10-10T10:30:00-03:00'); // Sábado 10:30 GMT-3
  const status = checkQuietWindowStatus(utnTime);

  assert(status.isQuiet, 'Alert during UTN Saturday class (10:30) must be suppressed');
  assert(
    status.matchedReason === 'UTN Cursada Sábados',
    'Matched rule must be UTN Cursada Sábados'
  );
}

// 4. Saturday transition window between UTN and Church (15:00)
{
  const satTransition = new Date('2026-10-10T15:00:00-03:00'); // Sábado 15:00 GMT-3
  const status = checkQuietWindowStatus(satTransition);

  assert(
    !status.isQuiet,
    'Alert on Saturday at 15:00 (transition between UTN and Church) must be allowed'
  );
}

// 5. Iglesia Sábado: Sábado 18:30 (dentro de 17:00 - 23:00)
{
  const churchSat = new Date('2026-10-10T18:30:00-03:00'); // Sábado 18:30 GMT-3
  const status = checkQuietWindowStatus(churchSat);

  assert(status.isQuiet, 'Alert during Saturday church (18:30) must be suppressed');
  assert(status.matchedReason === 'Iglesia Sábado', 'Matched rule must be Iglesia Sábado');
}

// 6. Iglesia Miércoles: Miércoles 20:00 (dentro de 19:00 - 21:30)
{
  const churchWed = new Date('2026-10-07T20:00:00-03:00'); // Miércoles 20:00 GMT-3
  const status = checkQuietWindowStatus(churchWed);

  assert(status.isQuiet, 'Alert during Wednesday church (20:00) must be suppressed');
  assert(status.matchedReason === 'Iglesia Miércoles', 'Matched rule must be Iglesia Miércoles');
}

// 7. Post-Wednesday church free window: Miércoles 22:00 (después de 21:30)
{
  const wedAfterChurch = new Date('2026-10-07T22:00:00-03:00'); // Miércoles 22:00 GMT-3
  const status = checkQuietWindowStatus(wedAfterChurch);

  assert(!status.isQuiet, 'Alert after Wednesday church (22:00) must be allowed');
}

// 8. Iglesia Domingo: Domingo 19:30 (dentro de 18:00 - 23:00)
{
  const churchSun = new Date('2026-10-11T19:30:00-03:00'); // Domingo 19:30 GMT-3
  const status = checkQuietWindowStatus(churchSun);

  assert(status.isQuiet, 'Alert during Sunday evening service (19:30) must be suppressed');
  assert(status.matchedReason === 'Iglesia Domingo', 'Matched rule must be Iglesia Domingo');
}

// 9. Sunday afternoon free window: Domingo 15:00
{
  const sunAfternoon = new Date('2026-10-11T15:00:00-03:00'); // Domingo 15:00 GMT-3
  const status = checkQuietWindowStatus(sunAfternoon);

  assert(!status.isQuiet, 'Alert on Sunday at 15:00 must be allowed');
}

// 10. Clases de Inglés: Martes 19:15 (dentro de 18:30 - 20:30)
{
  const englishTue = new Date('2026-10-06T19:15:00-03:00'); // Martes 19:15 GMT-3
  const status = checkQuietWindowStatus(englishTue);

  assert(status.isQuiet, 'Alert during Tuesday English class (19:15) must be suppressed');
  assert(status.matchedReason === 'Clases de Inglés', 'Matched rule must be Clases de Inglés');
}

// 11. Clases de Inglés: Jueves 20:00 (dentro de 18:30 - 20:30)
{
  const englishThu = new Date('2026-10-08T20:00:00-03:00'); // Jueves 20:00 GMT-3
  const status = checkQuietWindowStatus(englishThu);

  assert(status.isQuiet, 'Alert during Thursday English class (20:00) must be suppressed');
  assert(status.matchedReason === 'Clases de Inglés', 'Matched rule must be Clases de Inglés');
}

// 12. Pre-English free window: Martes 17:00
{
  const tueBeforeEnglish = new Date('2026-10-06T17:00:00-03:00'); // Martes 17:00 GMT-3
  const status = checkQuietWindowStatus(tueBeforeEnglish);

  assert(!status.isQuiet, 'Alert before English class (Tuesday 17:00) must be allowed');
}

// 13. Dynamic Tier 1 Calendar Event Suppression
{
  const customExamDate = new Date('2026-10-09T14:00:00-03:00'); // Viernes 14:00 GMT-3
  const dynamicTier1Event = {
    id: 'parcial-analisis',
    title: 'Parcial de Análisis Matemático UTN',
    description: null,
    event_date: '2026-10-09',
    start_time: '13:00',
    end_time: '16:00',
    tier: 'tier_1' as const,
    color: 'red' as const,
    is_inamovible: true,
    difficulty_score: 5,
    classroom_coursework_id: null,
    created_from: 'web' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const status = checkQuietWindowStatus(customExamDate, [dynamicTier1Event]);
  assert(
    status.isQuiet,
    'Alert during ad-hoc Tier 1 exam (Friday 14:00) must be suppressed'
  );
  assert(
    status.matchedReason?.includes('Parcial de Análisis') ?? false,
    'Matched reason must identify custom exam'
  );
}

// 14. Next allowed window calculation
{
  const wedChurch = new Date('2026-10-07T20:00:00-03:00');
  const nextWindow = getNextAllowedWindow(wedChurch);
  const nextWindowBa = getBuenosAiresTime(nextWindow);

  // Wednesday Church ends at 21:30, +15m buffer = 21:45
  assert(
    nextWindowBa.currentMinutes >= 21 * 60 + 30,
    'Next allowed window must be after the church block concludes'
  );
}

console.log('--- 🎉 ALL SMART QUIET WINDOWS TESTS PASSED SUCCESSFULLY ---\n');
