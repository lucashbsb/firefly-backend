import { BaseRepository } from './base';
import { SRCard, SRCardWithState, CreateCardDTO } from '../models';

export class SRCardRepository extends BaseRepository<SRCard> {
  protected tableName = 'sr_cards';

  async create(userId: string, data: CreateCardDTO): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO sr_cards (user_id, card_type, front, back, context, source_type, source_id, skill_tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        userId,
        data.card_type,
        data.front,
        data.back,
        data.context || null,
        data.source_type || null,
        data.source_id || null,
        data.skill_tags ? JSON.stringify(data.skill_tags) : null
      ]
    );
    return result.rows[0].id;
  }

  async getCardsForReview(userId: string, limit: number): Promise<SRCardWithState[]> {
    const today = new Date().toISOString().split('T')[0];
    const result = await this.query<SRCardWithState>(
      `SELECT c.*, s.ease_factor, s.interval_days, s.repetitions, s.next_review_date, s.status
       FROM sr_cards c
       JOIN sr_card_state s ON s.card_id = c.id
       WHERE c.user_id = $1 AND (s.next_review_date <= $2 OR s.status = 'new')
       ORDER BY s.next_review_date ASC
       LIMIT $3`,
      [userId, today, limit]
    );
    return result.rows;
  }
}

export const srCardRepository = new SRCardRepository();
