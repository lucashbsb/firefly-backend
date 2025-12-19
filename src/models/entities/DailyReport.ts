import { PerceivedLevel } from './PerceivedLevel';

export interface DailyReport {
  id: string;
  user_id: string;
  lesson_id: string | null;
  day: number;
  performance_score: number | null;
  accuracy_rate: number | null;
  exercises_correct: number | null;
  exercises_total: number | null;
  strengths: string[];
  weaknesses: string[];
  error_breakdown: Record<string, number>;
  skill_scores: Record<string, number>;
  conversation_notes: string | null;
  next_day_focus: string[];
  perceived_level: PerceivedLevel | null;
  motivational_note: string | null;
  created_at: string;
}
