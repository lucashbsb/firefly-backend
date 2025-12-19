export interface UserSkill {
  id: string;
  user_id: string;
  skill_id: string;
  mastery_level: number;
  practice_count: number;
  correct_count: number;
  last_practiced_at: string | null;
  created_at: string;
}
