export interface SRCard {
  id: string;
  user_id: string;
  card_type: 'vocabulary' | 'error_correction' | 'grammar';
  front: string;
  back: string;
  context: string | null;
  source_type: string | null;
  source_id: string | null;
  skill_tags: string[] | null;
  created_at: string;
}
