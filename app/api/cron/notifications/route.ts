import { NextRequest, NextResponse } from 'next/server';
import { dispatchPendingAlerts } from '@/lib/scheduler/notificationDispatcher';
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

  // If neither CRON_SECRET nor RITMO_MASTER_TOKEN is configured in local dev, allow
  if (!cronSecret && !masterToken) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest) {
  return handleDispatch(req);
}

export async function POST(req: NextRequest) {
  return handleDispatch(req);
}

async function handleDispatch(req: NextRequest) {
  const isAuthorized = validateCronAuthorization(req);

  if (!isAuthorized) {
    return createProblemResponse(
      401,
      'No Autorizado',
      'El token de autorización de Cron es inválido o no fue provisto.',
      'unauthorized-cron-trigger',
      '/api/cron/notifications'
    );
  }

  try {
    const result = await dispatchPendingAlerts();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error: unknown) {
    const detail =
      error instanceof Error ? error.message : 'Error al procesar despacho de notificaciones';
    console.error('[NotificationsCronRoute] Error:', error);

    return createProblemResponse(
      500,
      'Error Interno del Servidor',
      detail,
      'notifications-cron-failure',
      '/api/cron/notifications'
    );
  }
}
