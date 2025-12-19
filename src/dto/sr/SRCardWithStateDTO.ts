import { SRCard } from '../../models/entities';

export interface SRCardWithStateDTO extends SRCard {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string | null;
  status: 'new' | 'learning' | 'review';
}
