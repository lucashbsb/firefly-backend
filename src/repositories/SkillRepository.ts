import { BaseRepository } from './base';
import { Skill } from '../models/entities';

export class SkillRepository extends BaseRepository<Skill> {
  protected tableName = 'skills';

  async findByCode(code: string): Promise<Skill | null> {
    const result = await this.query<Skill>('SELECT * FROM skills WHERE code = $1', [code]);
    return result.rows[0] || null;
  }

  async findByLevel(level: string): Promise<Skill[]> {
    const result = await this.query<Skill>(
      'SELECT * FROM skills WHERE level = $1 ORDER BY category',
      [level]
    );
    return result.rows;
  }

  async findByIds(ids: string[]): Promise<Skill[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
    const result = await this.query<Skill>(
      `SELECT * FROM skills WHERE id IN (${placeholders})`,
      ids
    );
    return result.rows;
  }

  async findAllOrdered(): Promise<Skill[]> {
    const result = await this.query<Skill>('SELECT * FROM skills ORDER BY level, category');
    return result.rows;
  }

  async upsert(data: { code: string; name: string; category: string; level: string; description?: string }): Promise<string> {
    const existing = await this.findByCode(data.code);
    
    if (existing) {
      await this.query(
        'UPDATE skills SET name = $1, category = $2, level = $3, description = $4 WHERE code = $5',
        [data.name, data.category, data.level, data.description, data.code]
      );
      return existing.id;
    }
    
    const result = await this.query<{ id: string }>(
      'INSERT INTO skills (code, name, category, level, description) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [data.code, data.name, data.category, data.level, data.description]
    );
    return result.rows[0].id;
  }
}

export const skillRepository = new SkillRepository();
