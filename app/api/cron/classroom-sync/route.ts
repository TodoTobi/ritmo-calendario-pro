import { NextRequest, NextResponse } from 'next/server';
import { syncClassroomTasks } from '@/lib/classroom/client';
import { createProblemResponse } from '@/lib/rfc7807';

function validateCronAuthorization(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  const masterToken = process.env.RITMO_MASTER_TOKEN;

  const authHeader = req.headers.get('authorization');
  const customSecret = req.headers.get('x-cron-secret');
  const ritmoHeader = req.headers.get('x-ritmo-token');

  const bearerToken = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (cronSecret) {
    if (bearerToken === cronSecret || customSecret === cronSecret) {
      return true;
    }
  }

  if (masterToken && (ritmoHeader === masterToken || bearerToken === masterToken)) {
    return true;
  }

  // If no CRON_SECRET is configured in local development, allow execution
  if (!cronSecret && !masterToken) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  const isAuthorized = validateCronAuthorization(req);

  if (!isAuthorized) {
    return createProblemResponse(
      401,
      'No Autorizado',
      'El token de autorización de Cron es inválido o no fue provisto.',
      'unauthorized-cron-trigger',
      '/api/cron/classroom-sync'
    );
  }

  try {
    const report = await syncClassroomTasks();

    if (!report.success && report.error) {
      return createProblemResponse(
        502,
        'Error de Sincronización con Google Classroom',
        report.error,
        'classroom-sync-upstream-error',
        '/api/cron/classroom-sync'
      );
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      report,
    });
  } catch (error: unknown) {
    const detail = error instanceof Error ? error.message : 'Error inesperado durante Classroom Sync';
    console.error('[ClassroomSyncRoute] Internal error:', error);

    return createProblemResponse(
      500,
      'Error Interno del Servidor',
      detail,
      'classroom-sync-failure',
      '/api/cron/classroom-sync'
    );
  }
}
