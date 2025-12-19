import { BaseRepository } from './base/BaseRepository';
import { UserLearningMetrics } from '../models/entities/AdaptiveLearning';

export class UserLearningMetricsRepository extends BaseRepository<UserLearningMetrics> {
  protected tableName = 'user_learning_metrics';

  async findByUserDate(userId: string, date: Date): Promise<UserLearningMetrics | null> {
    const result = await this.query<UserLearningMetrics>(
      'SELECT * FROM user_learning_metrics WHERE user_id = $1 AND date = $2::date',
      [userId, date.toISOString().split('T')[0]]
    );
    return result.rows[0] || null;
  }

  async getOrCreate(userId: string, date: Date): Promise<UserLearningMetrics> {
    const existing = await this.findByUserDate(userId, date);
    if (existing) return existing;

    const result = await this.query<UserLearningMetrics>(
      `INSERT INTO user_learning_metrics (user_id, date) VALUES ($1, $2::date) 
       ON CONFLICT (user_id, date) DO UPDATE SET updated_at = NOW()
       RETURNING *`,
      [userId, date.toISOString().split('T')[0]]
    );
    return result.rows[0];
  }

  async increment(userId: string, field: keyof UserLearningMetrics, value = 1): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    await this.query(
      `INSERT INTO user_learning_metrics (user_id, date, ${field}) 
       VALUES ($1, $2::date, $3)
       ON CONFLICT (user_id, date) DO UPDATE SET ${field} = user_learning_metrics.${field} + $3, updated_at = NOW()`,
      [userId, date, value]
    );
  }

  async updateAccuracy(userId: string): Promise<void> {
    const date = new Date().toISOString().split('T')[0];
    await this.query(
      `UPDATE user_learning_metrics 
       SET accuracy_rate = CASE 
         WHEN exercises_attempted > 0 THEN ROUND((exercises_correct::numeric / exercises_attempted) * 100, 2)
         ELSE 0 
       END,
       updated_at = NOW()
       WHERE user_id = $1 AND date = $2::date`,
      [userId, date]
    );
  }

  async getWeeklyStats(userId: string): Promise<any> {
    const result = await this.query(
      `SELECT 
        SUM(study_time_minutes) as total_minutes,
        SUM(exercises_attempted) as total_exercises,
        SUM(exercises_correct) as total_correct,
        ROUND(AVG(accuracy_rate), 2) as avg_accuracy,
        COUNT(DISTINCT date) as days_studied
       FROM user_learning_metrics 
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'`,
      [userId]
    );
    return result.rows[0];
  }

  async getMonthlyStats(userId: string): Promise<any> {
    const result = await this.query(
      `SELECT 
        SUM(study_time_minutes) as total_minutes,
        SUM(exercises_attempted) as total_exercises,
        SUM(exercises_correct) as total_correct,
        ROUND(AVG(accuracy_rate), 2) as avg_accuracy,
        COUNT(DISTINCT date) as days_studied,
        SUM(skills_mastered) as skills_mastered,
        SUM(vocabulary_learned) as vocabulary_learned
       FROM user_learning_metrics 
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'`,
      [userId]
    );
    return result.rows[0];
  }

  async getProgressTrend(userId: string, days = 30): Promise<UserLearningMetrics[]> {
    const result = await this.query<UserLearningMetrics>(
      `SELECT * FROM user_learning_metrics 
       WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date ASC`,
      [userId]
    );
    return result.rows;
  }
}

export const userLearningMetricsRepository = new UserLearningMetricsRepository();
