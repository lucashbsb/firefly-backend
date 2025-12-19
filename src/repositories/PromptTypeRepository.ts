import { BaseRepository } from './base/BaseRepository';
import { PromptType } from '../models/entities/AdaptiveLearning';
import { SystemPrompt } from '../models/entities';

export class PromptTypeRepository extends BaseRepository<PromptType> {
  protected tableName = 'prompt_types';

  async findByCode(code: string): Promise<PromptType | null> {
    const result = await this.query<PromptType>(
      'SELECT * FROM prompt_types WHERE code = $1',
      [code]
    );
    return result.rows[0] || null;
  }

  async getActivePromptByType(typeCode: string): Promise<SystemPrompt | null> {
    const result = await this.query<SystemPrompt>(
      `SELECT sp.* FROM system_prompts sp
       JOIN prompt_types pt ON sp.prompt_type_id = pt.id
       WHERE pt.code = $1 AND sp.is_active = true
       LIMIT 1`,
      [typeCode]
    );
    return result.rows[0] || null;
  }

  async getAllWithActivePrompts(): Promise<Array<PromptType & { active_prompt?: SystemPrompt }>> {
    const result = await this.query<PromptType & { prompt_content?: string; prompt_id?: string }>(
      `SELECT pt.*, sp.id as prompt_id, sp.content as prompt_content
       FROM prompt_types pt
       LEFT JOIN system_prompts sp ON sp.prompt_type_id = pt.id AND sp.is_active = true`,
      []
    );
    return result.rows;
  }
}

export const promptTypeRepository = new PromptTypeRepository();
