import { BaseRepository } from './base';
import { UserLessonProgress } from '../models/entities';

export class LessonProgressRepository extends BaseRepository<UserLessonProgress> {
  protected tableName = 'user_lesson_progress';

  async findByUserAndDay(userId: string, day: number): Promise<UserLessonProgress | null> {
    const result = await this.query<UserLessonProgress>(
      'SELECT * FROM user_lesson_progress WHERE user_id = $1 AND day = $2',
      [userId, day]
    );
    return result.rows[0] || null;
  }

  async findActiveByUser(userId: string): Promise<UserLessonProgress | null> {
    const result = await this.query<UserLessonProgress>(
      `SELECT * FROM user_lesson_progress 
       WHERE user_id = $1 AND status = 'in_progress' 
       ORDER BY day DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async countCompleted(userId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM user_lesson_progress WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  async getScores(userId: string): Promise<number[]> {
    const result = await this.query<{ score: number }>(
      'SELECT score FROM user_lesson_progress WHERE user_id = $1 AND score IS NOT NULL',
      [userId]
    );
    return result.rows.map(r => r.score);
  }

  async getLatestCompletedDay(userId: string): Promise<number> {
    const result = await this.query<{ day: number }>(
      `SELECT day FROM user_lesson_progress WHERE user_id = $1 AND status = 'completed' ORDER BY day DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0]?.day || 0;
  }

  async upsert(data: Partial<UserLessonProgress>): Promise<string> {
    const existing = await this.findByUserAndDay(data.user_id!, data.day!);
    
    if (existing) {
      await this.updateProgress(existing.id, data);
      return existing.id;
    }
    
    return this.createProgress(data);
  }

  private async createProgress(data: Partial<UserLessonProgress>): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO user_lesson_progress (user_id, lesson_id, day, status, score, correct_count, total_count, started_at, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [
        data.user_id, data.lesson_id, data.day, data.status,
        data.score, data.correct_count, data.total_count,
        new Date().toISOString(), data.status === 'completed' ? new Date().toISOString() : null
      ]
    );
    return result.rows[0].id;
  }

  private async updateProgress(id: string, data: Partial<UserLessonProgress>): Promise<void> {
    const completedAt = data.status === 'completed' ? new Date().toISOString() : null;
    await this.query(
      `UPDATE user_lesson_progress SET
        lesson_id = $1, status = $2, score = $3, correct_count = $4, total_count = $5, completed_at = COALESCE($6, completed_at)
       WHERE id = $7`,
      [data.lesson_id, data.status, data.score, data.correct_count, data.total_count, completedAt, id]
    );
  }

  async getHistory(userId: string, limit = 50, offset = 0): Promise<{
    data: Array<{
      day: number;
      status: string;
      score: number | null;
      correct_count: number | null;
      total_count: number | null;
      started_at: string;
      completed_at: string | null;
    }>;
    total: number;
  }> {
    const countResult = await this.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM user_lesson_progress WHERE user_id = $1',
      [userId]
    );

    const result = await this.query<{
      day: number;
      status: string;
      score: number | null;
      correct_count: number | null;
      total_count: number | null;
      started_at: string;
      completed_at: string | null;
    }>(
      `SELECT day, status, score, correct_count, total_count, started_at, completed_at
       FROM user_lesson_progress 
       WHERE user_id = $1 
       ORDER BY day DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return {
      data: result.rows,
      total: parseInt(countResult.rows[0]?.count || '0', 10)
    };
  }

  async getCompletedDates(userId: string, startDate: string, endDate: string): Promise<string[]> {
    const result = await this.query<{ completed_at: string }>(
      `SELECT DATE(completed_at) as completed_at
       FROM user_lesson_progress 
       WHERE user_id = $1 
         AND status = 'completed'
         AND completed_at >= $2 
         AND completed_at < $3
       GROUP BY DATE(completed_at)
       ORDER BY DATE(completed_at)`,
      [userId, startDate, endDate]
    );
    return result.rows.map(r => r.completed_at);
  }
}

export const lessonProgressRepository = new LessonProgressRepository();
