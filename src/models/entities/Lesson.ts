import { LessonStatus } from '../../repositories/LessonRepository';

export interface Lesson {
  id: string;
  user_id: string;
  day: number;
  phase: number;
  level: string;
  topic: string;
  theory: string | null;
  grammar_focus: string[] | null;
  vocabulary_focus: string[] | null;
  status: LessonStatus;
  exercises_answered: number;
  exercises_total: number;
  chat_questions_answered: number;
  chat_questions_total: number;
  created_at: string;
}
