import { BaseRepository } from './base';
import { SystemPrompt } from '../models/entities';

export class SystemPromptRepository extends BaseRepository<SystemPrompt> {
  protected tableName = 'system_prompts';

  async findActive(): Promise<SystemPrompt | null> {
    const result = await this.query<SystemPrompt>(
      'SELECT * FROM system_prompts WHERE is_active = true LIMIT 1'
    );
    return result.rows[0] || null;
  }

  async findByName(name: string): Promise<SystemPrompt | null> {
    const result = await this.query<SystemPrompt>(
      'SELECT * FROM system_prompts WHERE name = $1',
      [name]
    );
    return result.rows[0] || null;
  }

  async findAll(): Promise<SystemPrompt[]> {
    const result = await this.query<SystemPrompt>(
      'SELECT * FROM system_prompts ORDER BY created_at DESC'
    );
    return result.rows;
  }

  async create(data: Omit<SystemPrompt, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO system_prompts (name, content, is_active, version)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [data.name, data.content, data.is_active, data.version]
    );
    return result.rows[0].id;
  }

  async update(id: string, data: Partial<SystemPrompt>): Promise<void> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex++}`);
      values.push(data.content);
    }
    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }
    if (data.version !== undefined) {
      updates.push(`version = $${paramIndex++}`);
      values.push(data.version);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) return;

    values.push(id);
    await this.query(
      `UPDATE system_prompts SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }

  async activate(id: string): Promise<void> {
    await this.query('UPDATE system_prompts SET is_active = true WHERE id = $1', [id]);
  }

  async deactivateAll(): Promise<void> {
    await this.query('UPDATE system_prompts SET is_active = false');
  }
}

export const systemPromptRepository = new SystemPromptRepository();
