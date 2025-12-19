import { openaiProvider, anthropicProvider, grokProvider, IAIProvider } from './ai';
import { userAISettingsService } from './UserAISettingsService';
import { systemPromptService } from './SystemPromptService';
import { adaptiveLearningService } from './AdaptiveLearningService';
import {
  AIProvider,
  AIMessage,
  AICompletionRequest,
  AICompletionResponse,
  LessonGenerationRequest,
  LessonGenerationResponse,
  CorrectionRequest,
  CorrectionResponse,
  ConversationRequest,
  ConversationResponse,
  ReportGenerationRequest,
  ReportGenerationResponse
} from '../models';
import { buildLessonUserPrompt, buildCorrectionUserPrompt, buildReportUserPrompt } from './prompts';
import { aiPromptLogRepository } from '../repositories';

const providers: Record<AIProvider, IAIProvider> = {
  openai: openaiProvider,
  anthropic: anthropicProvider,
  grok: grokProvider
};

export class AIService {
  private async complete(userId: string, request: AICompletionRequest): Promise<AICompletionResponse> {
    const { provider, model, apiKey, temperature, maxTokens } = await userAISettingsService.getEffectiveApiKey(userId);

    const providerInstance = providers[provider];
    if (!providerInstance) {
      throw new Error(`Unknown AI provider: ${provider}`);
    }

    const finalRequest = {
      ...request,
      temperature: request.temperature ?? temperature,
      max_tokens: request.max_tokens ?? maxTokens
    };

    try {
      const response = await providerInstance.complete(finalRequest, model, apiKey);

      await aiPromptLogRepository.create({
        user_id: userId,
        model,
        provider,
        messages: finalRequest.messages,
        temperature: finalRequest.temperature,
        max_tokens: finalRequest.max_tokens,
        response_content: response.content,
        response_tokens: response.usage
      });

      return response;
    } catch (error: any) {
      await aiPromptLogRepository.create({
        user_id: userId,
        model,
        provider,
        messages: finalRequest.messages,
        temperature: finalRequest.temperature,
        max_tokens: finalRequest.max_tokens,
        error: error.message
      });

      throw error;
    }
  }

  private parseJSON<T>(content: string, context: string): T {
    try {
      return JSON.parse(content);
    } catch {
      throw new Error(`Invalid AI response format for ${context}`);
    }
  }

  private countExerciseTypes(exercises: any[]): Record<string, number> {
    const counts: Record<string, number> = {};
    exercises?.forEach(e => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });
    return counts;
  }

  async generateLesson(request: LessonGenerationRequest): Promise<LessonGenerationResponse> {
    const startTime = Date.now();

    const [systemPrompt, context] = await Promise.all([
      systemPromptService.getLessonPrompt(),
      adaptiveLearningService.buildLearningContext(request.user_id, request.day)
    ]);

    const userPrompt = await buildLessonUserPrompt(request.day, context);

    const response = await this.complete(request.user_id, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      json_mode: true
    });

    const lesson = this.parseJSON<LessonGenerationResponse>(response.content, 'lesson generation');

    const toArray = (v: string | string[] | undefined): string[] => 
      Array.isArray(v) ? v : v ? [v] : [];

    await adaptiveLearningService.logLessonContent({
      user_id: request.user_id,
      day: request.day,
      skills_taught: lesson.skills_covered || [],
      skills_practiced: context.skills_context.learning,
      exercise_types: this.countExerciseTypes(lesson.exercises),
      theory_topics: toArray(lesson.grammar_focus),
      vocabulary: toArray(lesson.vocabulary_focus),
      grammar: toArray(lesson.grammar_focus),
      ai_model: response.model,
      ai_provider: response.provider,
      tokens: response.usage?.total_tokens,
      time_ms: Date.now() - startTime,
      recommendations: lesson.ai_recommendations
    });

    return lesson;
  }

  async correctAnswers(request: CorrectionRequest): Promise<CorrectionResponse> {
    const systemPrompt = await systemPromptService.getCorrectionPrompt();
    const userPrompt = await buildCorrectionUserPrompt(request.exercises, {
      skills_taught: [],
      day: 0
    });

    const response = await this.complete(request.user_id, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      json_mode: true
    });

    const corrections = this.parseJSON<CorrectionResponse>(response.content, 'correction');

    const correct = corrections.corrections?.filter((c: any) => c.is_correct).length || 0;
    const partial = corrections.corrections?.filter((c: any) => c.is_partial).length || 0;
    const wrong = corrections.corrections?.filter((c: any) => !c.is_correct && !c.is_partial).length || 0;

    await adaptiveLearningService.updateMetricsFromAnswers(request.user_id, correct, partial, wrong);

    for (const c of corrections.corrections || []) {
      if (!c.is_correct && c.error_type) {
        await adaptiveLearningService.logError({
          user_id: request.user_id,
          day: 0,
          exercise_type: c.exercise_type || 'unknown',
          error_type: c.error_type,
          error_category: c.error_category || 'unknown',
          user_answer: c.user_answer || c.student_answer,
          correct_answer: c.correct_answer
        });
      }
    }

    return corrections;
  }

  async chat(request: ConversationRequest): Promise<ConversationResponse> {
    const systemMessage = await systemPromptService.getConversationPrompt();

    const messages: AIMessage[] = [
      { role: 'system', content: systemMessage },
      ...request.history,
      { role: 'user', content: request.student_message }
    ];

    const response = await this.complete(request.user_id, {
      messages,
      json_mode: true
    });

    return this.parseJSON<ConversationResponse>(response.content, 'chat');
  }

  async generateReport(request: ReportGenerationRequest): Promise<ReportGenerationResponse> {
    const [systemPrompt, context] = await Promise.all([
      systemPromptService.getReportPrompt(),
      adaptiveLearningService.buildLearningContext(request.user_id, request.day)
    ]);

    const correct = request.answers.filter(a => a.is_correct).length;
    const wrong = request.answers.filter(a => !a.is_correct).length;

    const userPrompt = await buildReportUserPrompt(
      request.day,
      {
        topic: (request.lesson as any).topic || 'Unknown',
        skills_taught: (request.lesson as any).skills_covered || [],
        exercise_count: request.answers.length
      },
      {
        correct,
        partial: 0,
        wrong,
        details: request.answers.map((a, i) => ({
          id: i + 1,
          is_correct: a.is_correct,
          error_type: a.error_type
        }))
      },
      context,
      request.conversation_history
    );

    const response = await this.complete(request.user_id, {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      json_mode: true
    });

    return this.parseJSON<ReportGenerationResponse>(response.content, 'report generation');
  }

  async generateChatQuestions(request: {
    user_id: string;
    day: number;
    lesson_topic: string;
    lesson_theory: string;
    exercises_summary: Array<{
      question: string;
      user_answer: string;
      correct_answer: string;
      is_correct: boolean;
    }>;
    question_number: number;
    previous_messages?: Array<{ role: string; content: string }>;
  }): Promise<{ message: string; question_number: number }> {
    const systemPrompt = `You are conducting a brief conversational practice session after an English lesson.

CONTEXT:
- The student just completed exercises on: ${request.lesson_topic}
- This is question ${request.question_number} of 3

RULES:
- Ask ONE clear, conversational question related to the lesson topic
- Question should be open-ended to encourage the student to practice English
- Keep the question natural and friendly
- If this is question 1: introduce yourself briefly and ask about the topic
- If this is question 2 or 3: build on previous responses if available
- Be encouraging but don't over-praise
- Match difficulty to the student's demonstrated level

RESPOND WITH JSON:
{
  "message": "<your question or response + question>",
  "question_number": ${request.question_number}
}`;

    const messages: AIMessage[] = [
      { role: 'system', content: systemPrompt }
    ];

    if (request.previous_messages && request.previous_messages.length > 0) {
      messages.push(...request.previous_messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content
      })));
    } else {
      const exerciseSummary = request.exercises_summary
        .filter(e => !e.is_correct)
        .slice(0, 3)
        .map(e => `- Q: "${e.question}" | Student: "${e.user_answer}" | Correct: "${e.correct_answer}"`)
        .join('\n');

      messages.push({
        role: 'user',
        content: `Start the conversation. Topic: ${request.lesson_topic}
${exerciseSummary ? `\nSome errors to consider:\n${exerciseSummary}` : ''}`
      });
    }

    const response = await this.complete(request.user_id, {
      messages,
      json_mode: true
    });

    return this.parseJSON<{ message: string; question_number: number }>(response.content, 'chat questions');
  }

  async rawCompletion(userId: string, messages: AIMessage[], jsonMode = false): Promise<AICompletionResponse> {
    return this.complete(userId, { messages, json_mode: jsonMode });
  }
}

export const aiService = new AIService();
