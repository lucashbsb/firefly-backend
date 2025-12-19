import { AIProvider } from './AIProvider';
import { AIModel } from './AIModel';

export interface UserAISettings {
  id: string;
  user_id: string;
  provider: AIProvider;
  model: AIModel;
  api_key: string | null;
  temperature: number;
  max_tokens: number;
  created_at: string;
  updated_at: string;
}
