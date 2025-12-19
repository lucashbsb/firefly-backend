import { BaseValidation } from './BaseValidation';
import { ValidationResult } from './ValidationResult';
import { AIProvider, AIModel } from '../models/entities';
import { CreateUserAISettingsDTO, UpdateUserAISettingsDTO } from '../dto';

const VALID_PROVIDERS: AIProvider[] = ['openai', 'anthropic', 'grok'];
const VALID_MODELS: AIModel[] = ['gpt-4o', 'gpt-4o-mini', 'claude-3-opus', 'claude-3-sonnet', 'grok-1'];

export class AISettingsValidation extends BaseValidation {
  validateCreate(data: CreateUserAISettingsDTO): ValidationResult {
    this.reset();
    
    if (data.provider !== undefined) {
      this.isIn('provider', data.provider, VALID_PROVIDERS);
    }

    if (data.model !== undefined) {
      this.isIn('model', data.model, VALID_MODELS);
    }

    if (data.apiKey !== undefined && data.apiKey !== '') {
      this.minLength('apiKey', data.apiKey, 10, 'API key is too short');
    }

    return this.getResult();
  }

  validateUpdate(data: UpdateUserAISettingsDTO): ValidationResult {
    this.reset();
    
    if (data.provider !== undefined) {
      this.isIn('provider', data.provider, VALID_PROVIDERS);
    }

    if (data.model !== undefined) {
      this.isIn('model', data.model, VALID_MODELS);
    }

    if (data.apiKey !== undefined && data.apiKey !== '') {
      this.minLength('apiKey', data.apiKey, 10, 'API key is too short');
    }

    return this.getResult();
  }
}

export const aiSettingsValidation = new AISettingsValidation();
