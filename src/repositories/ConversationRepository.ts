import { BaseRepository } from './base';
import { UserConversation } from '../models/entities';

export class ConversationRepository extends BaseRepository<UserConversation> {
  protected tableName = 'user_conversations';

  async findByUserAndDay(userId: string, day: number): Promise<UserConversation[]> {
    const result = await this.query<UserConversation>(
      'SELECT * FROM user_conversations WHERE user_id = $1 AND day = $2 ORDER BY created_at',
      [userId, day]
    );
    return result.rows;
  }

  async create(data: Omit<UserConversation, 'id' | 'created_at'>): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO user_conversations (user_id, lesson_id, day, question, student_response, corrected_response, errors, positives)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        data.user_id,
        data.lesson_id,
        data.day,
        data.question,
        data.student_response,
        data.corrected_response,
        data.errors ? JSON.stringify(data.errors) : null,
        data.positives ? JSON.stringify(data.positives) : null
      ]
    );
    return result.rows[0].id;
  }

  async deleteByUserAndDay(userId: string, day: number): Promise<void> {
    await this.query(
      'DELETE FROM user_conversations WHERE user_id = $1 AND day = $2',
      [userId, day]
    );
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      'SELECT COUNT(*) FROM user_conversations WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }
}

export const conversationRepository = new ConversationRepository();
