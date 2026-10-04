import { getGoogleAccessToken } from '@/lib/google/auth';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface ClassroomCourse {
  id: string;
  name: string;
  section?: string;
  courseState?: string;
}

export interface ClassroomCourseWork {
  id: string;
  title: string;
  description?: string;
  state: string;
  alternateLink?: string;
  dueDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  dueTime?: {
    hours?: number;
    minutes?: number;
  };
}

export interface SyncReportItem {
  courseworkId: string;
  courseName: string;
  title: string;
  dueDate: string | null;
  difficultyScore: number;
}

export interface ClassroomSyncResult {
  success: boolean;
  coursesFound: number;
  tasksSyncedCount: number;
  items: SyncReportItem[];
  error?: string;
}

/**
 * Estimates assignment difficulty (1-5) using deterministic semantic heuristics.
 */
export function estimateAssignmentDifficulty(title: string, description?: string): number {
  const combined = `${title} ${description || ''}`.toLowerCase();

  // Tier 1 / Maximum Complexity
  if (
    combined.includes('parcial') ||
    combined.includes('evaluación') ||
    combined.includes('evaluacion') ||
    combined.includes('proyecto final') ||
    combined.includes('examen') ||
    combined.includes('corte transversal')
  ) {
    return 5;
  }

  // High Technical Demand
  if (
    combined.includes('tp') ||
    combined.includes('trabajo práctico') ||
    combined.includes('trabajo practico') ||
    combined.includes('informe') ||
    combined.includes('ejercicios') ||
    combined.includes('lámina') ||
    combined.includes('lamina') ||
    combined.includes('integrador')
  ) {
    return 4;
  }

  // Medium Difficulty
  if (
    combined.includes('cuestionario') ||
    combined.includes('guía') ||
    combined.includes('guia') ||
    combined.includes('investigación') ||
    combined.includes('investigacion')
  ) {
    return 3;
  }

  // Low Difficulty / Quick Reading
  if (
    combined.includes('lectura') ||
    combined.includes('resumen') ||
    combined.includes('consulta') ||
    combined.includes('foro')
  ) {
    return 2;
  }

  return 3;
}

/**
 * Normalizes Classroom dueDate and dueTime structures into an ISO 8601 string.
 */
export function parseClassroomDueDate(
  dueDate?: { year?: number; month?: number; day?: number },
  dueTime?: { hours?: number; minutes?: number }
): string | null {
  if (!dueDate?.year || !dueDate?.month || !dueDate?.day) {
    return null;
  }

  const y = dueDate.year;
  const m = String(dueDate.month).padStart(2, '0');
  const d = String(dueDate.day).padStart(2, '0');
  const h = String(dueTime?.hours ?? 23).padStart(2, '0');
  const min = String(dueTime?.minutes ?? 59).padStart(2, '0');

  return new Date(`${y}-${m}-${d}T${h}:${min}:00.000Z`).toISOString();
}

/**
 * Synchronizes pending Google Classroom assignments into Supabase `tasks` and `classroom_sync` tables.
 */
export async function syncClassroomTasks(): Promise<ClassroomSyncResult> {
  const supabase = getSupabaseServerClient();

  let accessToken: string;
  try {
    accessToken = await getGoogleAccessToken();
  } catch (authError) {
    const errorMsg = authError instanceof Error ? authError.message : 'Google OAuth failed';
    console.warn('[ClassroomClient] OAuth credentials not available or failed:', errorMsg);

    return {
      success: false,
      coursesFound: 0,
      tasksSyncedCount: 0,
      items: [],
      error: errorMsg,
    };
  }

  // 1. Fetch active courses
  const coursesRes = await fetch(
    'https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE',
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!coursesRes.ok) {
    const errText = await coursesRes.text();
    throw new Error(`Failed to fetch Classroom courses (${coursesRes.status}): ${errText}`);
  }

  const coursesData = await coursesRes.json();
  const courses: ClassroomCourse[] = coursesData.courses || [];
  const syncedItems: SyncReportItem[] = [];

  // 2. Fetch courseWork assignments for each active course
  for (const course of courses) {
    const workRes = await fetch(
      `https://classroom.googleapis.com/v1/courses/${course.id}/courseWork`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!workRes.ok) {
      console.warn(`[ClassroomClient] Could not fetch work for course "${course.name}": ${workRes.status}`);
      continue;
    }

    const workData = await workRes.json();
    const courseWorkList: ClassroomCourseWork[] = workData.courseWork || [];

    for (const work of courseWorkList) {
      // Only process published courseWork
      if (work.state !== 'PUBLISHED') {
        continue;
      }

      const isoDueDate = parseClassroomDueDate(work.dueDate, work.dueTime);
      const difficulty = estimateAssignmentDifficulty(work.title, work.description);

      // A. Upsert into classroom_sync table
      await supabase.from('classroom_sync').upsert(
        {
          course_id: course.id,
          course_name: course.name,
          coursework_id: work.id,
          title: work.title,
          description: work.description || null,
          due_date: isoDueDate,
          alternate_link: work.alternateLink || null,
          state: work.state,
          last_synced_at: new Date().toISOString(),
        },
        { onConflict: 'coursework_id' }
      );

      // B. Upsert into tasks table as Tier 3 tasks
      await supabase.from('tasks').upsert(
        {
          title: `[${course.name}] ${work.title}`,
          description: work.description || null,
          status: 'pending',
          priority_tier: 'tier_3',
          due_date: isoDueDate,
          difficulty_score: difficulty,
          classroom_coursework_id: work.id,
        },
        { onConflict: 'classroom_coursework_id' }
      );

      syncedItems.push({
        courseworkId: work.id,
        courseName: course.name,
        title: work.title,
        dueDate: isoDueDate,
        difficultyScore: difficulty,
      });
    }
  }

  return {
    success: true,
    coursesFound: courses.length,
    tasksSyncedCount: syncedItems.length,
    items: syncedItems,
  };
}
