export interface RecurringError {
  error: string;
  occurrences: number;
  exercises: (string | number)[];
  examples?: string[];
}

export interface SkillScore {
  level: string;
  evidence: string;
}

export interface PerceivedLevelDetailed {
  overall: string;
  overall_description: string;
  skills: Record<string, SkillScore>;
  passive_level: string;
  active_level: string;
  gap_analysis: string;
  prediction: string;
}

export interface SkillAnalysis {
  skill: string;
  total: number;
  correct: number;
  partial: number;
  wrong: number;
  accuracy: number;
  status: 'mastered' | 'developing' | 'needs_work' | 'struggling';
  example_errors: string[];
}

export interface ExerciseTypeAnalysis {
  type: string;
  total: number;
  correct: number;
  partial: number;
  wrong: number;
  accuracy: number;
}

export interface DifficultyAnalysis {
  easy: { total: number; correct: number; accuracy: number };
  medium: { total: number; correct: number; accuracy: number };
  hard: { total: number; correct: number; accuracy: number };
}

export interface ReportGenerationResponse {
  performance_score: number;
  accuracy_rate: number;
  exercises_correct: number;
  exercises_partially_correct: number;
  exercises_wrong: number;
  exercises_blank: number;
  exercises_total: number;

  strengths: string[];
  weaknesses: string[];

  recurring_errors: RecurringError[];
  error_breakdown: Record<string, number>;

  skill_scores: Record<string, number>;
  skill_analysis: SkillAnalysis[];

  exercise_type_analysis: ExerciseTypeAnalysis[];
  difficulty_analysis: DifficultyAnalysis | null;

  conversation_notes: string | null;

  next_day_focus: string[];
  homework: string[];

  perceived_level: PerceivedLevelDetailed;

  motivational_note: string;
}

