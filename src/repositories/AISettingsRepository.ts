import { BaseRepository } from './base';
import { UserAISettings } from '../models/entities';

export class AISettingsRepository extends BaseRepository<UserAISettings> {
  protected tableName = 'user_ai_settings';

  async findByUserId(userId: string): Promise<UserAISettings | null> {
    const result = await this.query<UserAISettings>(
      'SELECT * FROM user_ai_settings WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  }

  async upsert(userId: string, data: Partial<UserAISettings>): Promise<string> {
    const existing = await this.findByUserId(userId);
    
    if (existing) {
      await this.update(existing.id, data);
      return existing.id;
    }
    
    return this.create(userId, data);
  }

  private async create(userId: string, data: Partial<UserAISettings>): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO user_ai_settings (user_id, provider, model, api_key, max_tokens)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, data.provider || 'openai', data.model || 'gpt-4o-mini', data.api_key || '', 16384]
    );
    return result.rows[0].id;
  }

  private async update(id: string, data: Partial<UserAISettings>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.provider !== undefined) {
      updates.push(`provider = $${paramIndex++}`);
      values.push(data.provider);
    }
    if (data.model !== undefined) {
      updates.push(`model = $${paramIndex++}`);
      values.push(data.model);
    }
    if (data.api_key !== undefined) {
      updates.push(`api_key = $${paramIndex++}`);
      values.push(data.api_key);
    }

    if (updates.length === 0) return;

    values.push(id);
    await this.query(
      `UPDATE user_ai_settings SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.query('DELETE FROM user_ai_settings WHERE user_id = $1', [userId]);
  }
}

export const aiSettingsRepository = new AISettingsRepository();
