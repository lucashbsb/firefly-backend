import { BaseRepository } from './base';
import { SRReview } from '../models';

export class SRReviewRepository extends BaseRepository<SRReview> {
  protected tableName = 'sr_reviews';

  async create(
    cardId: string, 
    userId: string, 
    quality: number, 
    easeBefore: number, 
    easeAfter: number, 
    intervalBefore: number, 
    intervalAfter: number
  ): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO sr_reviews (card_id, user_id, quality, ease_factor_before, ease_factor_after, interval_before, interval_after)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [cardId, userId, quality, easeBefore, easeAfter, intervalBefore, intervalAfter]
    );
    return result.rows[0].id;
  }

  async countTodayByUser(userId: string): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sr_reviews WHERE user_id = $1 AND reviewed_at >= $2`,
      [userId, `${today}T00:00:00`]
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }
}

export const srReviewRepository = new SRReviewRepository();
