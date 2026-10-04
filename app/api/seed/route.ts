import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase/server';
import { generateRealOctoberEvents, generateRealNotes } from '@/lib/seed-data';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '').trim();
    const ritmoToken = req.headers.get('x-ritmo-token');

    // Simple security validation using master token or cron secret
    const masterToken = process.env.RITMO_MASTER_TOKEN;
    const cronSecret = process.env.CRON_SECRET;

    if (
      (masterToken && (token === masterToken || ritmoToken === masterToken)) ||
      (cronSecret && token === cronSecret) ||
      process.env.NODE_ENV === 'development'
    ) {
      const realEvents = generateRealOctoberEvents();
      const realNotes = generateRealNotes();

      // Upsert events into Supabase
      const { error: evErr } = await supabaseServerClient
        .from('events')
        .upsert(realEvents, { onConflict: 'id' });

      if (evErr) {
        return NextResponse.json(
          { error: 'Failed to seed events', details: evErr.message },
          { status: 500 }
        );
      }

      // Upsert notes into Supabase
      const { error: noteErr } = await supabaseServerClient
        .from('notes')
        .upsert(realNotes, { onConflict: 'id' });

      if (noteErr) {
        return NextResponse.json(
          { error: 'Failed to seed notes', details: noteErr.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        message: 'Successfully seeded real October & November routine into Supabase!',
        seededEventsCount: realEvents.length,
        seededNotesCount: realNotes.length,
      });
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Internal Server Error', message: err?.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
