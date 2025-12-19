export interface SRReview {
  id: string;
  card_id: string;
  user_id: string;
  quality: number;
  ease_factor_before: number | null;
  ease_factor_after: number | null;
  interval_before: number | null;
  interval_after: number | null;
  time_spent_ms: number | null;
  reviewed_at: string;
}
