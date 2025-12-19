import { BaseRepository } from './base';
import { UserStreak } from '../models/entities';

export class UserStreakRepository extends BaseRepository<UserStreak> {
  protected tableName = 'user_streaks';

  async createDefault(userId: string): Promise<void> {
    await this.query('INSERT INTO user_streaks (user_id) VALUES ($1)', [userId]);
  }

  async findByUserId(userId: string): Promise<UserStreak | null> {
    const result = await this.query<UserStreak>(
      'SELECT * FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  async getCurrentStreak(userId: string): Promise<number> {
    const result = await this.query<{ current_streak: number }>(
      'SELECT current_streak FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    return result.rows[0]?.current_streak || 0;
  }

  async update(userId: string, data: Partial<UserStreak>): Promise<void> {
    await this.query(
      'UPDATE user_streaks SET current_streak = $1, longest_streak = $2, last_study_date = $3 WHERE user_id = $4',
      [data.current_streak, data.longest_streak, data.last_study_date, userId]
    );
  }
}

export const userStreakRepository = new UserStreakRepository();
