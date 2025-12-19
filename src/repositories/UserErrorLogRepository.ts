import { BaseRepository } from './base/BaseRepository';
import { UserErrorLog } from '../models/entities/AdaptiveLearning';

export class UserErrorLogRepository extends BaseRepository<UserErrorLog> {
  protected tableName = 'user_error_log';

  async logError(data: Omit<UserErrorLog, 'id' | 'created_at' | 'is_recurring' | 'occurrence_count'>): Promise<string> {
    const existing = await this.findSimilarError(data.user_id, data.error_type, data.skill_id);
    
    if (existing) {
      await this.query(
        `UPDATE user_error_log SET occurrence_count = occurrence_count + 1, is_recurring = true 
         WHERE id = $1`,
        [existing.id]
      );
      return existing.id;
    }

    const result = await this.query<{ id: string }>(
      `INSERT INTO user_error_log 
       (user_id, day, skill_id, exercise_type, error_type, error_category, user_answer, correct_answer, context) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id`,
      [
        data.user_id,
        data.day,
        data.skill_id || null,
        data.exercise_type || null,
        data.error_type,
        data.error_category || null,
        data.user_answer || null,
        data.correct_answer || null,
        data.context || null
      ]
    );
    return result.rows[0].id;
  }

  async findSimilarError(userId: string, errorType: string, skillId?: string): Promise<UserErrorLog | null> {
    const result = await this.query<UserErrorLog>(
      `SELECT * FROM user_error_log 
       WHERE user_id = $1 AND error_type = $2 AND ($3::uuid IS NULL OR skill_id = $3)
       AND created_at > NOW() - INTERVAL '30 days'
       ORDER BY created_at DESC LIMIT 1`,
      [userId, errorType, skillId || null]
    );
    return result.rows[0] || null;
  }

  async getRecurringErrors(userId: string, limit = 10): Promise<UserErrorLog[]> {
    const result = await this.query<UserErrorLog>(
      `SELECT * FROM user_error_log 
       WHERE user_id = $1 AND is_recurring = true
       ORDER BY occurrence_count DESC LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  async getRecentErrors(userId: string, days = 7): Promise<UserErrorLog[]> {
    const result = await this.query<UserErrorLog>(
      `SELECT * FROM user_error_log 
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  async getErrorsByType(userId: string): Promise<Record<string, number>> {
    const result = await this.query<{ error_type: string; count: string }>(
      `SELECT error_type, COUNT(*) as count FROM user_error_log 
       WHERE user_id = $1 GROUP BY error_type ORDER BY count DESC`,
      [userId]
    );
    return result.rows.reduce((acc, row) => {
      acc[row.error_type] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);
  }

  async getErrorsByCategory(userId: string): Promise<Record<string, number>> {
    const result = await this.query<{ error_category: string; count: string }>(
      `SELECT error_category, COUNT(*) as count FROM user_error_log 
       WHERE user_id = $1 AND error_category IS NOT NULL
       GROUP BY error_category ORDER BY count DESC`,
      [userId]
    );
    return result.rows.reduce((acc, row) => {
      acc[row.error_category] = parseInt(row.count);
      return acc;
    }, {} as Record<string, number>);
  }
}

export const userErrorLogRepository = new UserErrorLogRepository();
