import { AIProvider, AIModel } from '../../models/entities';

export interface CreateUserAISettingsDTO {
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}
