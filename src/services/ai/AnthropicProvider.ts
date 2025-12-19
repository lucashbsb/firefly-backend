import { BaseAIProvider } from './BaseProvider';
import { AICompletionRequest, AICompletionResponse, AIModel, AIProvider } from '../../models';

export class AnthropicProvider extends BaseAIProvider {
  provider: AIProvider = 'anthropic';

  async complete(_request: AICompletionRequest, _model: AIModel, _apiKey: string): Promise<AICompletionResponse> {
    throw new Error('Anthropic provider not implemented yet');
  }
}

export const anthropicProvider = new AnthropicProvider();
