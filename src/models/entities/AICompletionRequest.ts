import { AIMessage } from './AIMessage';

export interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  max_tokens?: number;
  json_mode?: boolean;
}
