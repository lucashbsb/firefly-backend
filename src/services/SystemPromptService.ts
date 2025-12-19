import { systemPromptRepository } from '../repositories/SystemPromptRepository';
import { promptTypeRepository } from '../repositories/PromptTypeRepository';
import { SystemPrompt } from '../models/entities';
import { logger } from '../lib/logger';

type PromptTypeCode = 'lesson' | 'correction' | 'report' | 'conversation';

const DEFAULT_PROMPTS: Record<PromptTypeCode, string> = {
  lesson: 'You are an English instructor. Generate a lesson with 30 exercises in JSON format.',
  correction: 'You are an English instructor. Correct the exercises and provide feedback in JSON format.',
  report: 'You are an English assessment system. Generate a learning report in JSON format.',
  conversation: 'You are an English conversation partner. Respond naturally and correct errors.'
};

export class SystemPromptService {
  async getActivePrompt(): Promise<string> {
    return this.getPromptByType('lesson');
  }

  async getPromptByType(type: PromptTypeCode): Promise<string> {
    const prompt = await promptTypeRepository.getActivePromptByType(type);
    
    if (!prompt) {
      logger.warn({ type }, 'No active prompt found for type, using default');
      return DEFAULT_PROMPTS[type];
    }

    return prompt.content;
  }

  async getLessonPrompt(): Promise<string> {
    return this.getPromptByType('lesson');
  }

  async getCorrectionPrompt(): Promise<string> {
    return this.getPromptByType('correction');
  }

  async getReportPrompt(): Promise<string> {
    return this.getPromptByType('report');
  }

  async getConversationPrompt(): Promise<string> {
    return this.getPromptByType('conversation');
  }

  async getPromptByName(name: string): Promise<SystemPrompt | null> {
    return systemPromptRepository.findByName(name);
  }

  async getAllPrompts(): Promise<SystemPrompt[]> {
    return systemPromptRepository.findAll();
  }

  async createPrompt(data: { name: string; content: string; is_active?: boolean; version?: number }): Promise<string> {
    return systemPromptRepository.create({
      name: data.name,
      content: data.content,
      is_active: data.is_active ?? false,
      version: data.version ?? 1
    });
  }

  async updatePrompt(id: string, data: Partial<SystemPrompt>): Promise<void> {
    await systemPromptRepository.update(id, data);
  }

  async activatePrompt(id: string): Promise<void> {
    await systemPromptRepository.activate(id);
  }

  async deactivateAllPrompts(): Promise<void> {
    await systemPromptRepository.deactivateAll();
  }
}

export const systemPromptService = new SystemPromptService();
