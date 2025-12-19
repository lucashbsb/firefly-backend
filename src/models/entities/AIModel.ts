import { OpenAIModel } from './OpenAIModel';
import { AnthropicModel } from './AnthropicModel';
import { GrokModel } from './GrokModel';

export type AIModel = OpenAIModel | AnthropicModel | GrokModel;
