export interface UserLessonProgress {
  id: string;
  user_id: string;
  lesson_id: string | null;
  day: number;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number | null;
  correct_count: number | null;
  total_count: number | null;
  started_at: string | null;
  completed_at: string | null;
}
