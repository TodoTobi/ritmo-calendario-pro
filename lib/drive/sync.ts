import { getGoogleAccessToken } from '@/lib/google/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { NoteItem } from '@/types/database.types';

export interface DriveSyncResult {
  success: boolean;
  notesFound: number;
  syncedCount: number;
  folderId?: string;
  files: Array<{
    noteId: string;
    title: string;
    driveFileId: string;
    status: 'created' | 'updated';
  }>;
  error?: string;
}

function sanitizeFileName(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'Nota_UTN';
}

/**
 * Resolves or creates the Google Drive folder for NotebookLM feeds.
 */
export async function getOrCreateDriveFolder(
  accessToken: string,
  folderName = 'Ritmo - UTN Apuntes'
): Promise<string> {
  const envFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (envFolderId) {
    return envFolderId;
  }

  // Search if folder already exists
  const query = encodeURIComponent(
    `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Drive folder "${folderName}": ${errText}`);
  }

  const createdData = await createRes.json();
  return createdData.id;
}

/**
 * Uploads or updates a single note as a Markdown file in Google Drive.
 */
export async function syncSingleNoteToDrive(
  accessToken: string,
  folderId: string,
  note: NoteItem
): Promise<{ driveFileId: string; action: 'created' | 'updated' }> {
  const fileName = `${sanitizeFileName(note.title)}.md`;
  const fileContent = `# ${note.title}

> **Fuente:** Ritmo — Apuntes UTN
> **Etiqueta:** ${note.category_tag}
> **Fecha Vinculada:** ${note.linked_date || 'Sin fecha fija'}
> **Sincronizado:** ${new Date().toISOString()}

---

${note.content_markdown}
`;

  // 1. If drive_file_id exists, attempt to update content
  if (note.drive_file_id) {
    const updateRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${note.drive_file_id}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'text/markdown; charset=utf-8',
        },
        body: fileContent,
      }
    );

    if (updateRes.ok) {
      return {
        driveFileId: note.drive_file_id,
        action: 'updated',
      };
    }
  }

  // 2. Otherwise create a new file via multipart upload
  const boundary = `-------RitmoDriveSyncBoundary${Date.now()}`;
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: 'text/markdown',
  };

  const multipartBody =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    '\r\n' +
    `--${boundary}\r\n` +
    'Content-Type: text/markdown; charset=UTF-8\r\n\r\n' +
    fileContent +
    '\r\n' +
    `--${boundary}--`;

  const createRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to upload note "${note.title}" to Drive: ${errText}`);
  }

  const resultData = await createRes.json();
  return {
    driveFileId: resultData.id,
    action: 'created',
  };
}

/**
 * Scans Supabase for #utn notes and synchronizes them to Google Drive for NotebookLM ingestion.
 */
export async function syncUtnNotesToDrive(): Promise<DriveSyncResult> {
  const supabase = getSupabaseServerClient();

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken();
  } catch (authError) {
    const msg = authError instanceof Error ? authError.message : 'Google OAuth failed';
    console.warn('[DriveSync] OAuth credentials not available:', msg);
    return {
      success: false,
      notesFound: 0,
      syncedCount: 0,
      files: [],
      error: msg,
    };
  }

  const folderId = await getOrCreateDriveFolder(accessToken);

  // Fetch all #utn notes
  const { data: utnNotes, error: notesError } = await supabase
    .from('notes')
    .select('*')
    .eq('category_tag', '#utn');

  if (notesError) {
    throw new Error(`Database error querying notes: ${notesError.message}`);
  }

  const notesList: NoteItem[] = (utnNotes as NoteItem[]) || [];
  const syncedFiles: DriveSyncResult['files'] = [];

  for (const note of notesList) {
    try {
      const syncResult = await syncSingleNoteToDrive(accessToken, folderId, note);

      // Update Supabase note record
      await supabase
        .from('notes')
        .update({
          synced_to_drive: true,
          drive_file_id: syncResult.driveFileId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', note.id);

      syncedFiles.push({
        noteId: note.id,
        title: note.title,
        driveFileId: syncResult.driveFileId,
        status: syncResult.action,
      });
    } catch (noteErr) {
      console.error(`[DriveSync] Error syncing note "${note.title}":`, noteErr);
    }
  }

  return {
    success: true,
    notesFound: notesList.length,
    syncedCount: syncedFiles.length,
    folderId,
    files: syncedFiles,
  };
}
