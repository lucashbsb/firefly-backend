import { AICompletionRequest, AICompletionResponse, AIProvider, AIModel } from '../../models';

export interface IAIProvider {
  provider: AIProvider;
  complete(request: AICompletionRequest, model: AIModel, apiKey: string): Promise<AICompletionResponse>;
}

export abstract class BaseAIProvider implements IAIProvider {
  abstract provider: AIProvider;
  abstract complete(request: AICompletionRequest, model: AIModel, apiKey: string): Promise<AICompletionResponse>;
  
  protected validateApiKey(apiKey: string): void {
    if (!apiKey) {
      throw new Error(`API key is required for ${this.provider}`);
    }
  }
}
