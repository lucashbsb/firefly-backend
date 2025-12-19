import OpenAI from 'openai';
import { BaseAIProvider } from './BaseProvider';
import { AICompletionRequest, AICompletionResponse, AIModel, AIProvider } from '../../models';
import { logger } from '../../lib/logger';

export class OpenAIProvider extends BaseAIProvider {
  provider: AIProvider = 'openai';

  async complete(request: AICompletionRequest, model: AIModel, apiKey: string): Promise<AICompletionResponse> {
    this.validateApiKey(apiKey);

    const client = new OpenAI({ apiKey, timeout: 120000 });

    try {
      const response = await client.chat.completions.create({
        model,
        messages: request.messages.map(m => ({ role: m.role, content: m.content })),
        temperature: Number(request.temperature ?? 0.5),
        max_completion_tokens: Number(request.max_tokens ?? 16384),
        ...(request.json_mode && { response_format: { type: 'json_object' } })
      });

      const choice = response.choices[0];

      return {
        content: choice.message.content || '',
        provider: this.provider,
        model: model,
        usage: {
          prompt_tokens: response.usage?.prompt_tokens || 0,
          completion_tokens: response.usage?.completion_tokens || 0,
          total_tokens: response.usage?.total_tokens || 0
        }
      };
    } catch (error: any) {
      logger.error({ error: error.message, model, provider: this.provider }, 'OpenAI API error');
      
      if (error.status === 401) {
        throw new Error('Invalid OpenAI API key');
      }
      if (error.status === 429) {
        throw new Error('OpenAI rate limit exceeded. Try again later.');
      }
      if (error.status === 500 || error.status === 503) {
        throw new Error('OpenAI service temporarily unavailable');
      }
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
        throw new Error('OpenAI request timed out. Try again.');
      }
      
      throw new Error(`AI generation failed: ${error.message}`);
    }
  }
}

export const openaiProvider = new OpenAIProvider();
