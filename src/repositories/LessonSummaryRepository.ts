import { BaseRepository } from './base';
import { LessonSummary } from '../models/entities/LessonSummary';

export class LessonSummaryRepository extends BaseRepository<LessonSummary> {
  protected tableName = 'lesson_summary';

  async findByUser(userId: string, limit = 20, offset = 0): Promise<LessonSummary[]> {
    const result = await this.query<LessonSummary>(
      `SELECT * FROM lesson_summary 
       WHERE user_id = $1 
       ORDER BY day DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  async findByUserAndDay(userId: string, day: number): Promise<LessonSummary | null> {
    const result = await this.query<LessonSummary>(
      `SELECT * FROM lesson_summary WHERE user_id = $1 AND day = $2`,
      [userId, day]
    );
    return result.rows[0] || null;
  }

  async findByLessonId(lessonId: string): Promise<LessonSummary | null> {
    const result = await this.query<LessonSummary>(
      `SELECT * FROM lesson_summary WHERE lesson_id = $1`,
      [lessonId]
    );
    return result.rows[0] || null;
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM lesson_summary WHERE user_id = $1`,
      [userId]
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  async countCompletedByUser(userId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM lesson_summary WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    return parseInt(result.rows[0]?.count || '0', 10);
  }

  async getAverageAccuracy(userId: string): Promise<number> {
    const result = await this.query<{ avg: string }>(
      `SELECT COALESCE(AVG(accuracy_rate), 0) as avg 
       FROM lesson_summary 
       WHERE user_id = $1 AND status = 'completed'`,
      [userId]
    );
    return parseFloat(result.rows[0]?.avg || '0');
  }

  async getRecentPerformance(userId: string, days = 7): Promise<LessonSummary[]> {
    const result = await this.query<LessonSummary>(
      `SELECT * FROM lesson_summary 
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY day DESC 
       LIMIT $2`,
      [userId, days]
    );
    return result.rows;
  }

  async getAccuracyTrend(userId: string, limit = 10): Promise<number[]> {
    const result = await this.query<{ accuracy_rate: string }>(
      `SELECT accuracy_rate FROM lesson_summary 
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY day DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows.map(r => parseFloat(r.accuracy_rate)).reverse();
  }
}

export const lessonSummaryRepository = new LessonSummaryRepository();
