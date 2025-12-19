import { AIMessage } from './AIMessage';

export interface AIPromptLog {
  id: string;
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
  created_at: Date;
}
