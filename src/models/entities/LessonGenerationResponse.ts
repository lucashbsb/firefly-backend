import { GeneratedExercise } from './GeneratedExercise';

export interface LessonGenerationResponse {
  day: number;
  topic: string;
  main_topic?: string;
  phase: number | string;
  level: string;
  grammar_target_level?: string;
  explanation_level?: string;
  grammar_focus: string | string[];
  vocabulary_focus: string | string[];
  theory: string;
  exercises: GeneratedExercise[];
  skills_covered?: string[];
  ai_recommendations?: string[];
  validation?: {
    exercise_count: number;
    difficulty_distribution: Record<string, number>;
    all_grammar_allowed: boolean;
    no_repetition_from_recent: boolean;
  };
}
