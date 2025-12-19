import { BaseRepository } from './base/BaseRepository';
import { AIPromptLog } from '../models/entities/AIPromptLog';
import { AIMessage } from '../models';

export class AIPromptLogRepository extends BaseRepository<AIPromptLog> {
  protected tableName = 'ai_prompt_logs';

  async create(data: {
    user_id?: string;
    model: string;
    provider: string;
    messages: AIMessage[];
    temperature?: number;
    max_tokens?: number;
    response_content?: string;
    response_tokens?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    error?: string;
  }): Promise<string> {
    const result = await this.query(
      `INSERT INTO ai_prompt_logs 
       (user_id, model, provider, messages, temperature, max_tokens, response_content, response_tokens, error) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING id`,
      [
        data.user_id || null,
        data.model,
        data.provider,
        JSON.stringify(data.messages),
        data.temperature || null,
        data.max_tokens || null,
        data.response_content || null,
        data.response_tokens ? JSON.stringify(data.response_tokens) : null,
        data.error || null
      ]
    );

    return result.rows[0].id;
  }
}

export const aiPromptLogRepository = new AIPromptLogRepository();
