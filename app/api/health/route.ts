import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ritmo-core-engine',
    version: '1.0.0-PROD',
  });
}
