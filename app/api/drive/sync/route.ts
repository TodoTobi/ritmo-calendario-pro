import { NextRequest, NextResponse } from 'next/server';
import { syncUtnNotesToDrive } from '@/lib/drive/sync';
import { createProblemResponse } from '@/lib/rfc7807';

export async function POST(req: NextRequest) {
  try {
    const result = await syncUtnNotesToDrive();
    if (!result.success) {
      return createProblemResponse(
        500,
        'Error de sincronización con Google Drive',
        result.error || 'No se pudieron sincronizar las notas con Google Drive',
        'drive-sync-error',
        '/api/drive/sync'
      );
    }

    return NextResponse.json({
      ok: true,
      syncedCount: result.syncedCount,
      folderId: result.folderId,
      folderUrl: result.folderId ? `https://drive.google.com/drive/folders/${result.folderId}` : null,
      files: result.files,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return createProblemResponse(
      500,
      'Error de sincronización',
      msg,
      'drive-sync-exception',
      '/api/drive/sync'
    );
  }
}

export async function GET() {
  return POST({} as NextRequest);
}
