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

  async generateLesson(request: LessonGenerationRequest): Promise<LessonGenerationResponse> {
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
    const systemPrompt = await systemPromptService.getReportPrompt();
    const lesson = request.lesson as any;
    const p = request.preprocessed;
    const stats = p.statsPrecomputed;

    const skillScoresStr = Object.entries(p.skillStats)
      .map(([skill, data]) => {
        const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        return `${skill}: ${data.correct}/${data.total} (${acc}%)`;
      })
      .join('\n');

    const typeStatsStr = Object.entries(p.typeStats)
      .map(([type, data]) => {
        const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        return `${type}: ${data.correct}/${data.total} (${acc}%)`;
      })
      .join('\n');

    const difficultyStr = Object.entries(p.difficultyStats)
      .map(([d, data]) => {
        const label = d === '1' ? 'easy' : d === '2' ? 'medium' : 'hard';
        const acc = data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        return `${label}: ${data.correct}/${data.total} (${acc}%)`;
      })
      .join('\n');

    const errorBreakdownStr = Object.entries(p.errorBreakdown)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ') || 'None';

    const userPrompt = `GENERATE COMPREHENSIVE PROGRESS REPORT FOR DAY ${request.day}

=== LESSON CONTEXT ===
Topic: ${lesson.topic || 'Unknown'}
Level: ${lesson.level || 'Unknown'}
Grammar Focus: ${JSON.stringify(lesson.grammar_focus || [])}
Vocabulary Focus: ${JSON.stringify(lesson.vocabulary_focus || [])}

=== PERFORMANCE METRICS (PRE-CALCULATED) ===
Total Exercises: ${stats.total}
Correct: ${stats.correct}
Partially Correct: ${stats.partial}
Wrong: ${stats.wrong}
Blank/Unanswered: ${stats.blank}
Accuracy Rate: ${stats.accuracyRate}%
Performance Score: ${stats.performanceScore}%

=== ANSWERS OVERVIEW ===
${p.answersCompact}

=== WRONG/PARTIAL ANSWERS (DETAILED) ===
Format: #N|type|difficulty|Q:"question"|A:"user_answer"|C:"correct_answer"|E:error_type|F:"feedback"|S:[skills]
${p.wrongAnswersDetailed || 'All answers correct!'}

=== SKILL BREAKDOWN ===
${skillScoresStr}

=== EXERCISE TYPE BREAKDOWN ===
${typeStatsStr}

=== DIFFICULTY BREAKDOWN ===
${difficultyStr}

=== ERROR BREAKDOWN ===
${errorBreakdownStr}

=== CONVERSATION ===
${p.conversationCompact || 'No conversation this session'}

=== YOUR TASK ===
Analyze ALL data above and generate a JSON report with this EXACT structure:

{
  "performance_score": ${stats.performanceScore},
  "accuracy_rate": ${stats.accuracyRate},
  "exercises_correct": ${stats.correct},
  "exercises_partially_correct": ${stats.partial},
  "exercises_wrong": ${stats.wrong},
  "exercises_blank": ${stats.blank},
  "exercises_total": ${stats.total},

  "strengths": [
    "Specific strength 1 with evidence (e.g., 'Solid verb to be in present - 100% accuracy')",
    "..."
  ],
  "weaknesses": [
    "CRITICAL: Specific weakness with examples from wrong answers",
    "..."
  ],

  "recurring_errors": [
    {
      "error": "Description of recurring error pattern",
      "occurrences": 2,
      "exercises": [1, 5],
      "examples": ["example1", "example2"]
    }
  ],
  "error_breakdown": ${JSON.stringify(p.errorBreakdown)},

  "skill_scores": {
    "skill_name": 85,
    ...
  },
  "skill_analysis": [
    {
      "skill": "skill_name",
      "total": 5,
      "correct": 4,
      "partial": 0,
      "wrong": 1,
      "accuracy": 80,
      "status": "developing",
      "example_errors": ["error example"]
    }
  ],

  "exercise_type_analysis": [
    {
      "type": "fill-blank",
      "total": 10,
      "correct": 9,
      "partial": 0,
      "wrong": 1,
      "accuracy": 90
    }
  ],

  "difficulty_analysis": {
    "easy": { "total": 10, "correct": 10, "accuracy": 100 },
    "medium": { "total": 10, "correct": 8, "accuracy": 80 },
    "hard": { "total": 10, "correct": 6, "accuracy": 60 }
  },

  "conversation_notes": "Analysis of student's conversational English - grammar usage, vocabulary range, common errors in speech, fluency assessment. If no conversation, null.",

  "next_day_focus": [
    "Specific skill or topic to focus on tomorrow",
    "..."
  ],
  "homework": [
    "Write the word 'X' correctly 10 times",
    "Write 5 sentences practicing Y",
    "..."
  ],

  "perceived_level": {
    "overall": "B1",
    "overall_description": "Intermediate - description",
    "skills": {
      "grammar_knowledge": { "level": "B1", "evidence": "Evidence from exercises" },
      "grammar_application": { "level": "A2-B1", "evidence": "Evidence" },
      "vocabulary_recognition": { "level": "B1+", "evidence": "Evidence" },
      "vocabulary_production": { "level": "A2", "evidence": "Spelling issues" },
      "writing_accuracy": { "level": "A2", "evidence": "Evidence" },
      "conversation": { "level": "B1", "evidence": "Evidence from chat" }
    },
    "passive_level": "B1+",
    "active_level": "A2-B1",
    "gap_analysis": "Analysis of gap between passive (reading/listening) and active (writing/speaking) skills",
    "prediction": "If student continues daily practice, prediction for improvement timeline"
  },

  "motivational_note": "Personalized, specific, encouraging but direct. Reference exact scores, specific exercises, concrete improvements needed. No fluff."
}

CRITICAL RULES:
1. Every insight MUST trace back to provided data
2. Reference specific exercise numbers when discussing errors
3. Identify patterns - same error 2+ times = recurring_error
4. Strengths = 90%+ accuracy on a skill
5. Weaknesses = <70% accuracy or repeated errors
6. Be SPECIFIC - quote actual student answers
7. homework should be actionable writing exercises
8. No generic statements`;

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
