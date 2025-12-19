export interface GeneratedExercise {
  id: number;
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
  feedback?: string | null;
}
