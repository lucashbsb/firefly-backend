import { PerceivedLevel } from './PerceivedLevel';

export interface ReportGenerationResponse {
  day: number;
  topic: string;
  phase: number;
  level: string;
  performance_score: number;
  accuracy_rate: number;
  exercises_correct: number;
  exercises_total: number;
  strengths: string[];
  weaknesses: string[];
  error_breakdown: Record<string, number>;
  skill_scores: Record<string, number>;
  conversation_notes: string;
  next_day_focus: string[];
  perceived_level: PerceivedLevel;
  motivational_note: string;
}
