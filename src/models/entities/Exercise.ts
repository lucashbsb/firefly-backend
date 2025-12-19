export interface Exercise {
  id: string;
  lesson_id: string;
  position: number;
  type: string;
  question: string;
  correct_answer: string | null;
  options: string[] | null;
  hint: string | null;
  explanation: string | null;
  skill_tags: string[] | null;
  difficulty: number;
}
