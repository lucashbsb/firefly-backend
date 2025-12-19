export interface GeneratedExercise {
  id: number | string;
  db_id?: string;
  type: string;
  instruction?: string;
  question: string;
  correct_answer: string;
  options?: string[] | null;
  hint?: string | null;
  explanation?: string;
  skill_tags?: string[];
  targets_skill?: string;
  difficulty?: number;
  user_answer?: string | null;
  is_correct?: boolean | null;
  is_partial?: boolean | null;
  feedback?: string | null;
  error_type?: string | null;
}
