export interface UserAnswer {
  id: string;
  user_id: string;
  exercise_id: string | null;
  lesson_id: string | null;
  day: number | null;
  answer: string | null;
  is_correct: boolean;
  is_partial: boolean;
  feedback: string | null;
  error_type: string | null;
  time_spent_seconds: number | null;
  attempt_number: number;
  created_at: string;
}
