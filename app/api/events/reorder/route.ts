import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { timeStringToMinutes } from '@/lib/date-utils';

function errorResponse(status: number, title: string, detail: string, type: string) {
  return new NextResponse(
    JSON.stringify({
      type: `https://ritmo.app/errors/${type}`,
      title,
      status,
      detail,
      instance: '/api/events/reorder',
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/problem+json',
      },
    }
  );
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, newEventDate, newStartTime, newEndTime } = body;

    if (!eventId || !newStartTime || !newEndTime) {
      return errorResponse(
        400,
        'Solicitud inválida',
        'Faltan campos obligatorios: eventId, newStartTime, newEndTime.',
        'missing-fields'
      );
    }

    const proposedStartMin = timeStringToMinutes(newStartTime);
    const proposedEndMin = timeStringToMinutes(newEndTime);

    if (proposedEndMin <= proposedStartMin) {
      return errorResponse(
        400,
        'Horario inconsistente',
        'La hora de finalización debe ser estrictamente posterior a la hora de inicio.',
        'invalid-time-range'
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
      console.warn('Supabase fetch issue (might be in offline/mock mode):', fetchError.message);
    }

    if (currentEvent && currentEvent.tier === 'tier_1') {
      return errorResponse(
        409,
        'Conflicto con Inamovible',
        'El evento que intenta mover pertenece al Tier 1 y está blindado de reprogramación.',
        'err-tier1-conflict'
      );
    }

    // 2. Fetch existing Tier 1 events on that date to check collisions
    const targetDate = newEventDate || currentEvent?.event_date;
    if (targetDate) {
      const { data: tier1Events } = await supabase
        .from('events')
        .select('*')
        .eq('event_date', targetDate)
        .eq('tier', 'tier_1');

      if (tier1Events && tier1Events.length > 0) {
        for (const t1 of tier1Events) {
          if (t1.id === eventId) continue;
          const t1Start = timeStringToMinutes(t1.start_time);
          const t1End = timeStringToMinutes(t1.end_time);

          if (Math.max(proposedStartMin, t1Start) < Math.min(proposedEndMin, t1End)) {
            return errorResponse(
              409,
              'Colisión con Tier 1',
              `El horario colisiona con el bloque protegido "${t1.title}".`,
              'err-tier1-collision'
            );
          }
        }
      }
    }

    // 3. Update the event in Supabase if found
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
        return errorResponse(
          500,
          'Fallo de Persistencia',
          updateError.message,
          'database-update-failure'
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
    return errorResponse(500, 'Error de Servidor', message, 'unexpected-error');
  }
}
