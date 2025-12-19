import { PerceivedLevel } from '../../models/entities';

export interface CreateReportDTO {
  user_id: string;
  lesson_id?: string;
  day: number;
  performance_score: number;
  accuracy_rate?: number;
  exercises_correct?: number;
  exercises_total?: number;
  strengths?: string[];
  weaknesses?: string[];
  error_breakdown?: Record<string, number>;
  skill_scores?: Record<string, number>;
  conversation_notes?: string;
  next_day_focus?: string[];
  perceived_level?: PerceivedLevel;
  motivational_note?: string;
}
