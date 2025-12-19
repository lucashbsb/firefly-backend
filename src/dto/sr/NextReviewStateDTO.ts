export interface NextReviewStateDTO {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  status: 'learning' | 'review';
}
