import { AIProvider, AIModel } from '../../models/entities';

export interface UpdateUserAISettingsDTO {
  provider?: AIProvider;
  model?: AIModel;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}
