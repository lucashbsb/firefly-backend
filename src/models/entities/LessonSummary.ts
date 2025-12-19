export interface LessonSummary {
  id: string;
  lesson_id: string;
  user_id: string;
  day: number;
  topic: string;
  level: string;
  phase: number;
  status: string;
  exercises_total: number;
  exercises_answered: number;
  exercises_correct: number;
  exercises_partial: number;
  exercises_wrong: number;
  chat_total: number;
  chat_answered: number;
  accuracy_rate: number;
  performance_score: number;
  perceived_level: string | null;
  time_spent_seconds: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
