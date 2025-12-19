import { aiSettingsRepository } from '../repositories';
import { config } from '../config';
import { UserAISettings, AIProvider, AIModel } from '../models/entities';
import { CreateUserAISettingsDTO, UpdateUserAISettingsDTO } from '../dto';

export class UserAISettingsService {
  async get(userId: string): Promise<UserAISettings | null> {
    return aiSettingsRepository.findByUserId(userId);
  }

  async create(userId: string, settings: CreateUserAISettingsDTO = {}): Promise<UserAISettings> {
    await aiSettingsRepository.upsert(userId, {
      provider: settings.provider || 'openai',
      model: settings.model || 'gpt-4o-mini',
      api_key: settings.apiKey || ''
    });
    return this.get(userId) as Promise<UserAISettings>;
  }

  async update(userId: string, settings: UpdateUserAISettingsDTO): Promise<UserAISettings> {
    await aiSettingsRepository.upsert(userId, {
      provider: settings.provider,
      model: settings.model,
      api_key: settings.apiKey
    });
    return this.get(userId) as Promise<UserAISettings>;
  }

  async getOrCreate(userId: string): Promise<UserAISettings> {
    const existing = await this.get(userId);
    if (existing) return existing;
    return this.create(userId);
  }

  async getEffectiveApiKey(userId: string): Promise<{
    provider: AIProvider;
    model: AIModel;
    apiKey: string;
    temperature: number;
    maxTokens: number;
  }> {
    const settings = await this.getOrCreate(userId);
    const apiKey = settings.api_key || this.getSystemApiKey(settings.provider);

    return {
      provider: settings.provider,
      model: settings.model,
      apiKey,
      temperature: settings.temperature,
      maxTokens: settings.max_tokens
    };
  }

  private getSystemApiKey(provider: AIProvider): string {
    switch (provider) {
      case 'openai': return config.ai.openai.apiKey;
      case 'anthropic': return config.ai.anthropic.apiKey;
      default: return '';
    }
  }
}

export const userAISettingsService = new UserAISettingsService();
