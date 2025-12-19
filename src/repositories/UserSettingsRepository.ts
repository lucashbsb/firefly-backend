import { BaseRepository } from './base';
import { UserSettings } from '../models/entities';

export class UserSettingsRepository extends BaseRepository<UserSettings> {
  protected tableName = 'user_settings';

  async createDefault(userId: string): Promise<void> {
    await this.query('INSERT INTO user_settings (user_id) VALUES ($1)', [userId]);
  }

  async findByUserId(userId: string): Promise<UserSettings | null> {
    const result = await this.query<UserSettings>(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }
}

export const userSettingsRepository = new UserSettingsRepository();
