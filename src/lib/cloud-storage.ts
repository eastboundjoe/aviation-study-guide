import { getSupabase } from '@/lib/supabase';
import { UserProgress, StudySession } from '@/types';

export async function saveProgressToCloud(
  userId: string,
  progress: UserProgress
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('study_progress')
    .upsert(
      {
        user_id: userId,
        completed_chapters: progress.completedChapters,
        review_dates: progress.reviewDates,
        review_levels: progress.reviewLevels,
        quiz_scores: progress.quizScores,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
}

export async function getProgressFromCloud(
  userId: string
): Promise<UserProgress | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('study_progress')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // no rows
    throw error;
  }

  if (!data) return null;

  return {
    completedChapters: data.completed_chapters as Record<string, boolean>,
    reviewDates: data.review_dates as Record<string, string>,
    reviewLevels: data.review_levels as Record<string, number>,
    quizScores: data.quiz_scores as Record<string, number>,
    studyHistory: [], // loaded separately from study_history table
  };
}

export async function saveStudySessionToCloud(
  userId: string,
  session: StudySession
): Promise<void> {
  const supabase = getSupabase();

  const { error } = await supabase.from('study_history').insert({
    user_id: userId,
    date: session.date,
    book_title: session.bookTitle,
    chapter_id: session.chapterId,
    success: session.success,
  });

  if (error) throw error;
}

export async function getStudyHistoryFromCloud(
  userId: string
): Promise<StudySession[]> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('study_history')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    date: row.date,
    bookTitle: row.book_title,
    chapterId: row.chapter_id,
    success: row.success,
  }));
}

export async function migrateLocalProgressToCloud(
  userId: string
): Promise<void> {
  const raw = localStorage.getItem('aviation-study-progress');
  if (!raw) return;

  let local: UserProgress;
  try {
    local = JSON.parse(raw);
  } catch {
    return;
  }

  // Check if user already has cloud data
  const existing = await getProgressFromCloud(userId);
  if (existing && Object.keys(existing.completedChapters).length > 0) {
    // Cloud already has data — don't overwrite
    return;
  }

  // Save progress (without studyHistory — that goes to study_history table)
  await saveProgressToCloud(userId, local);

  // Migrate study history entries
  if (local.studyHistory && local.studyHistory.length > 0) {
    const supabase = getSupabase();
    const rows = local.studyHistory.map((s) => ({
      user_id: userId,
      date: s.date,
      book_title: s.bookTitle,
      chapter_id: s.chapterId,
      success: s.success,
    }));

    const { error } = await supabase.from('study_history').insert(rows);
    if (error) throw error;
  }

  // Clear localStorage after successful migration
  localStorage.removeItem('aviation-study-progress');
}
