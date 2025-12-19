import { LessonStatus } from '../../repositories/LessonRepository';

export interface LessonExercise {
  id: string;
  type: string;
  question: string;
  correct_answer: string;
  options?: string[] | null;
  hint?: string | null;
  explanation?: string | null;
  skill_tags?: string[];
  difficulty: number;
  user_answer?: string | null;
}

export interface LessonCorrection {
  exercise_id: string;
  is_correct: boolean;
  is_partial: boolean;
  feedback: string | null;
  error_type: string | null;
  error_category?: string | null;
  skill_affected?: string | null;
}

export interface LessonCorrections {
  summary: {
    total: number;
    correct: number;
    wrong: number;
    partial: number;
    accuracy_rate: number;
    strengths: string[];
    weaknesses: string[];
    error_patterns: string[];
  };
  corrections: LessonCorrection[];
}

export interface LessonChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  created_at?: string;
}

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

export interface LessonReport {
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

  perceived_level: PerceivedLevelDetailed | null;

  motivational_note?: string | null;
}

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
  exercises_data: LessonExercise[] | null;
  corrections: LessonCorrections | null;
  chat_messages: LessonChatMessage[];
  report: LessonReport | null;
  created_at: string;
}
