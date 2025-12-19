import { BaseAIProvider } from './BaseProvider';
import { AICompletionRequest, AICompletionResponse, AIModel, AIProvider } from '../../models';

export class GrokProvider extends BaseAIProvider {
  provider: AIProvider = 'grok';

  async complete(_request: AICompletionRequest, _model: AIModel, _apiKey: string): Promise<AICompletionResponse> {
    throw new Error('Grok provider not implemented yet');
  }
}

export const grokProvider = new GrokProvider();
