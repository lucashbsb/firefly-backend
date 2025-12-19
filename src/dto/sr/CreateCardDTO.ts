export interface CreateCardDTO {
  card_type: 'vocabulary' | 'error_correction' | 'grammar';
  front: string;
  back: string;
  context?: string;
  source_type?: string;
  source_id?: string;
  skill_tags?: string[];
}
