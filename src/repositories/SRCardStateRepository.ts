import { BaseRepository } from './base';
import { SRCardState } from '../models';

export class SRCardStateRepository extends BaseRepository<SRCardState> {
  protected tableName = 'sr_card_state';

  async findByCardAndUser(cardId: string, userId: string): Promise<SRCardState | null> {
    const result = await this.query<SRCardState>(
      'SELECT * FROM sr_card_state WHERE card_id = $1 AND user_id = $2',
      [cardId, userId]
    );
    return result.rows[0] || null;
  }

  async createDefault(cardId: string, userId: string): Promise<void> {
    await this.query(
      `INSERT INTO sr_card_state (card_id, user_id, next_review_date, status)
       VALUES ($1, $2, $3, $4)`,
      [cardId, userId, new Date().toISOString().split('T')[0], 'new']
    );
  }

  async updateState(cardId: string, userId: string, data: Partial<SRCardState>): Promise<void> {
    await this.query(
      `UPDATE sr_card_state SET
        ease_factor = $1, interval_days = $2, repetitions = $3,
        next_review_date = $4, last_review_date = $5, status = $6
       WHERE card_id = $7 AND user_id = $8`,
      [
        data.ease_factor,
        data.interval_days,
        data.repetitions,
        data.next_review_date,
        new Date().toISOString().split('T')[0],
        data.status,
        cardId,
        userId
      ]
    );
  }

  async getAllByUser(userId: string): Promise<Array<{ status: string; next_review_date: string }>> {
    const result = await this.query<{ status: string; next_review_date: string }>(
      'SELECT status, next_review_date FROM sr_card_state WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }
}

export const srCardStateRepository = new SRCardStateRepository();
