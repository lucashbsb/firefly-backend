export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  proficiency: number;
  mastery_level: number;
  times_practiced: number;
  times_correct: number;
  times_partial: number;
  last_practiced: string | null;
  status: 'not_started' | 'learning' | 'mastered' | 'needs_review';
  consecutive_correct: number;
  consecutive_wrong: number;
  error_patterns: Record<string, number>;
}
