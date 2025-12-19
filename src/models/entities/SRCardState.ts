export interface SRCardState {
  id: string;
  card_id: string;
  user_id: string;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string | null;
  last_review_date: string | null;
  status: 'new' | 'learning' | 'review';
}
