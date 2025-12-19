export interface LessonContentLog {
  id: string;
  user_id: string;
  day: number;
  skills_taught: string[];
  skills_practiced: string[];
  skills_introduced: string[];
  exercise_types: Record<string, number>;
  exercise_count: number;
  theory_topics: string[];
  vocabulary_introduced: string[];
  grammar_focus: string[];
  ai_model?: string;
  ai_provider?: string;
  generation_tokens?: number;
  generation_time_ms?: number;
  ai_recommendations: {
    next_day_focus?: string[];
    skills_to_review?: string[];
    suggested_difficulty?: string;
    notes?: string;
  };
  created_at: Date;
}

export interface UserLearningMetrics {
  id: string;
  user_id: string;
  date: Date;
  study_time_minutes: number;
  exercises_attempted: number;
  exercises_correct: number;
  exercises_partial: number;
  exercises_wrong: number;
  accuracy_rate: number;
  avg_response_time_ms?: number;
  fastest_response_ms?: number;
  slowest_response_ms?: number;
  skills_practiced: number;
  skills_mastered: number;
  skills_regressed: number;
  new_skills_introduced: number;
  vocabulary_learned: number;
  vocabulary_reviewed: number;
  conversation_turns: number;
  conversation_errors: number;
  hints_used: number;
  explanations_viewed: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserLevelProgression {
  id: string;
  user_id: string;
  day: number;
  perceived_level: string;
  confidence_score?: number;
  grammar_level?: string;
  vocabulary_level?: string;
  fluency_level?: string;
  listening_level?: string;
  reading_level?: string;
  writing_level?: string;
  speaking_level?: string;
  level_breakdown: Record<string, any>;
  assessment_notes?: string;
  created_at: Date;
}

export interface UserErrorLog {
  id: string;
  user_id: string;
  day: number;
  skill_id?: string;
  exercise_type?: string;
  error_type: string;
  error_category?: string;
  user_answer?: string;
  correct_answer?: string;
  context?: string;
  is_recurring: boolean;
  occurrence_count: number;
  created_at: Date;
}

export interface UserCurriculumProgress {
  id: string;
  user_id: string;
  curriculum_item_code: string;
  level: string;
  category: string;
  status: 'not_started' | 'introduced' | 'practicing' | 'mastered';
  first_seen_day?: number;
  mastered_day?: number;
  practice_count: number;
  mastery_score: number;
  created_at: Date;
  updated_at: Date;
}

export interface UserVocabularyLog {
  id: string;
  user_id: string;
  word: string;
  definition?: string;
  example_sentence?: string;
  context?: string;
  category?: string;
  level?: string;
  first_seen_day?: number;
  times_seen: number;
  times_correct: number;
  times_wrong: number;
  mastery_score: number;
  status: 'new' | 'learning' | 'known' | 'mastered';
  created_at: Date;
  updated_at: Date;
}

export interface PromptType {
  id: string;
  code: 'lesson' | 'correction' | 'report' | 'conversation';
  name: string;
  description?: string;
  created_at: Date;
}
