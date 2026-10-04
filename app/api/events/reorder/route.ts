import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { createProblemResponse } from '@/lib/rfc7807';
import { validateTierMovement } from '@/lib/calendar/tierProtection';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, newEventDate, newStartTime, newEndTime } = body;

    if (!eventId || !newStartTime || !newEndTime) {
      return createProblemResponse(
        400,
        'Solicitud inválida',
        'Faltan campos obligatorios: eventId, newStartTime, newEndTime.',
        'missing-fields',
        '/api/events/reorder'
      );
    }

    // Connect to Supabase
    const supabase = getSupabaseServerClient();

    // 1. Fetch current target event to verify tier
    const { data: currentEvent, error: fetchError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.warn('[ReorderRoute] Supabase fetch issue (offline/mock mode):', fetchError.message);
    }

    const targetDate = newEventDate || currentEvent?.event_date;

    // 2. Fetch existing events on that date
    let existingTier1Events: Array<{
      id: string;
      title: string;
      startTime: string;
      endTime: string;
      tier: 'tier_1' | 'tier_2' | 'tier_3';
    }> = [];

    if (targetDate) {
      const { data: dayEvents } = await supabase
        .from('events')
        .select('*')
        .eq('event_date', targetDate);

      if (dayEvents) {
        existingTier1Events = dayEvents.map((e) => ({
          id: e.id,
          title: e.title,
          startTime: e.start_time,
          endTime: e.end_time,
          tier: e.tier,
        }));
      }
    }

    // 3. Validate Tier movement invariants
    const validation = validateTierMovement(
      {
        id: eventId,
        tier: currentEvent?.tier || 'tier_2',
        title: currentEvent?.title,
      },
      {
        startTime: newStartTime,
        endTime: newEndTime,
      },
      existingTier1Events
    );

    if (!validation.valid) {
      const status = validation.errorCode === 'invalid-time-range' ? 400 : 409;
      const title =
        validation.errorCode === 'err-tier1-conflict'
          ? 'Conflicto con Inamovible'
          : validation.errorCode === 'err-tier1-collision'
          ? 'Colisión con Tier 1'
          : 'Horario inconsistente';

      return createProblemResponse(
        status,
        title,
        validation.message || 'Error de validación de horarios',
        validation.errorCode || 'schedule-conflict',
        '/api/events/reorder'
      );
    }

    // 4. Update the event in Supabase if found
    if (currentEvent) {
      const { error: updateError } = await supabase
        .from('events')
        .update({
          event_date: targetDate,
          start_time: newStartTime,
          end_time: newEndTime,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (updateError) {
        return createProblemResponse(
          500,
          'Fallo de Persistencia',
          updateError.message,
          'database-update-failure',
          '/api/events/reorder'
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Bloque reordenado exitosamente',
      updated: {
        eventId,
        newEventDate: targetDate,
        newStartTime,
        newEndTime,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error inesperado';
    return createProblemResponse(
      500,
      'Error de Servidor',
      message,
      'unexpected-error',
      '/api/events/reorder'
    );
  }
}
