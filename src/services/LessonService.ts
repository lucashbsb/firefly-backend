import crypto from 'crypto';
import { aiService } from './AIService';
import { progressService } from './ProgressService';
import { lessonExerciseService } from './lesson/LessonExerciseService';
import { lessonChatService } from './lesson/LessonChatService';
import { 
  lessonRepository,
  lessonSummaryRepository,
  LessonStatus
} from '../repositories';
import { 
  LessonGenerationResponse, 
  CorrectionResponse, 
  ReportGenerationResponse,
  LessonExercise
} from '../models';
import { getPhaseForDay } from './prompts';

export interface LessonWorkflowState {
  lesson_id: string;
  day: number;
  status: LessonStatus;
  exercises: {
    total: number;
    answered: number;
    remaining: number;
  };
  chat: {
    total: number;
    answered: number;
    remaining: number;
  };
  can_proceed: boolean;
  next_action: string;
}

export class LessonService {
  async getWorkflowState(userId: string, lessonId?: string): Promise<LessonWorkflowState | null> {
    let lesson;
    
    if (lessonId) {
      lesson = await lessonRepository.findById(lessonId);
    } else {
      lesson = await lessonRepository.findActiveByUser(userId);
      if (!lesson) {
        const lastCompleted = await lessonRepository.findLastCompletedByUser(userId);
        if (lastCompleted) lesson = lastCompleted;
      }
    }
    
    if (!lesson) return null;

    const progress = await lessonRepository.getProgress(lesson.id);
    if (!progress) return null;

    const exercisesRemaining = progress.exercises_total - progress.exercises_answered;
    const chatRemaining = progress.chat_questions_total - progress.chat_questions_answered;

    const nextAction = this.getNextAction(progress.status, exercisesRemaining, chatRemaining);

    return {
      lesson_id: lesson.id,
      day: lesson.day,
      status: progress.status,
      exercises: {
        total: progress.exercises_total,
        answered: progress.exercises_answered,
        remaining: exercisesRemaining
      },
      chat: {
        total: progress.chat_questions_total,
        answered: progress.chat_questions_answered,
        remaining: chatRemaining
      },
      can_proceed: true,
      next_action: nextAction
    };
  }

  private getNextAction(status: LessonStatus, exercisesRemaining: number, chatRemaining: number): string {
    switch (status) {
      case 'created':
        return 'answer_exercises';
      case 'in_progress':
        return exercisesRemaining > 0 ? 'answer_exercises' : 'submit_exercises';
      case 'exercises_completed':
        return 'correct_exercises';
      case 'corrected':
        return 'start_chat';
      case 'chat_in_progress':
        return chatRemaining > 0 ? 'answer_chat' : 'finish_chat';
      case 'chat_completed':
        return 'generate_report';
      case 'completed':
        return 'start_new_lesson';
      default:
        return 'unknown';
    }
  }

  async startLesson(userId: string): Promise<LessonGenerationResponse> {
    const activeLesson = await lessonRepository.findActiveByUser(userId);
    if (activeLesson) {
      return this.getLessonData(userId, activeLesson.id);
    }

    const lastCompleted = await lessonRepository.findLastCompletedByUser(userId);
    const nextDay = lastCompleted ? lastCompleted.day + 1 : 1;

    const previousReport = lastCompleted?.report || null;

    const lesson = await aiService.generateLesson({
      user_id: userId,
      day: nextDay,
      previous_report: previousReport as unknown as Record<string, unknown> || undefined
    });

    if (lesson.exercises?.length > 0) {
      lesson.exercises = lesson.exercises.map(ex => ({
        ...ex,
        id: crypto.randomUUID()
      }));
    }

    await this.saveLessonToDatabase(userId, nextDay, lesson);

    return lesson;
  }

  private async saveLessonToDatabase(userId: string, day: number, lesson: LessonGenerationResponse): Promise<string> {
    const rawPhase = lesson.phase;
    const phase = typeof rawPhase === 'string' 
      ? (parseInt(rawPhase, 10) || 0)
      : (typeof rawPhase === 'number' ? rawPhase : 0);
    const grammarFocus = Array.isArray(lesson.grammar_focus) 
      ? lesson.grammar_focus
      : (typeof lesson.grammar_focus === 'string' ? [lesson.grammar_focus] : []);
    const vocabularyFocus = Array.isArray(lesson.vocabulary_focus) 
      ? lesson.vocabulary_focus
      : (typeof lesson.vocabulary_focus === 'string' ? [lesson.vocabulary_focus] : []);

    const phaseConfig = await getPhaseForDay(day);
    const level = lesson.level 
      || (lesson as any).grammar_target_level 
      || phaseConfig.grammarTarget 
      || 'B1';

    const lessonId = await lessonRepository.upsert(userId, day, {
      topic: lesson.main_topic || lesson.topic || 'English Lesson',
      phase,
      level,
      theory: lesson.theory || '',
      grammar_focus: grammarFocus,
      vocabulary_focus: vocabularyFocus,
      exercises_total: lesson.exercises?.length || 30
    });

    if (lesson.exercises?.length > 0) {
      const exercisesData = lesson.exercises.map(ex => ({
        id: ex.id,
        type: ex.type,
        question: ex.question,
        correct_answer: ex.correct_answer,
        options: ex.options || null,
        hint: ex.hint || null,
        explanation: ex.explanation || null,
        skill_tags: ex.targets_skill ? [ex.targets_skill] : (ex.skill_tags || []),
        difficulty: ex.difficulty || 1,
        user_answer: null
      }));
      await lessonRepository.saveExercisesData(lessonId, exercisesData);
    }

    return lessonId;
  }

  async answerExercise(
    userId: string,
    exerciseId: string | undefined,
    answer: string,
    exerciseIndex?: number
  ): Promise<{ success: boolean; exercises_answered: number; exercises_total: number; all_answered: boolean }> {
    return lessonExerciseService.answerExercise(userId, exerciseId, answer, exerciseIndex);
  }

  async submitExercises(userId: string): Promise<{ success: boolean; message: string }> {
    return lessonExerciseService.submitExercises(userId);
  }

  async resetLessonFlow(userId: string): Promise<void> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) return;

    if (lesson.status !== 'created' && lesson.status !== 'in_progress') {
      await lessonRepository.updateStatus(lesson.id, 'in_progress');
    }
  }

  async correctExercises(userId: string): Promise<CorrectionResponse> {
    return lessonExerciseService.correctExercises(userId);
  }

  async startChat(userId: string): Promise<{ message: string; question_number: number }> {
    return lessonChatService.startChat(userId);
  }

  async answerChat(userId: string, message: string): Promise<{
    response: string;
    question_number: number;
    is_complete: boolean;
  }> {
    return lessonChatService.answerChat(userId, message, (u) => this.generateReport(u));
  }

  private preprocessReportData(
    exercises: any[],
    correctionsData: any[],
    chatMessages: any[]
  ): {
    answersCompact: string;
    wrongAnswersDetailed: string;
    statsPrecomputed: {
      correct: number;
      partial: number;
      wrong: number;
      blank: number;
      total: number;
      accuracyRate: number;
      performanceScore: number;
    };
    skillStats: Record<string, { total: number; correct: number; partial: number; wrong: number }>;
    typeStats: Record<string, { total: number; correct: number; partial: number; wrong: number }>;
    difficultyStats: Record<number, { total: number; correct: number }>;
    errorBreakdown: Record<string, number>;
    conversationCompact: string;
  } {
    const correctionMap = new Map(correctionsData.map(c => [c.exercise_id, c]));

    let correct = 0;
    let partial = 0;
    let wrong = 0;
    let blank = 0;
    const skillStats: Record<string, { total: number; correct: number; partial: number; wrong: number }> = {};
    const typeStats: Record<string, { total: number; correct: number; partial: number; wrong: number }> = {};
    const difficultyStats: Record<number, { total: number; correct: number }> = { 1: { total: 0, correct: 0 }, 2: { total: 0, correct: 0 }, 3: { total: 0, correct: 0 } };
    const errorBreakdown: Record<string, number> = {};
    const wrongDetails: string[] = [];

    exercises.forEach((ex, idx) => {
      const correction = correctionMap.get(ex.id);
      const answered = ex.user_answer && ex.user_answer.trim() !== '';
      const isCorrect = correction?.is_correct ?? false;
      const isPartial = correction?.is_partial ?? false;
      const errorType = correction?.error_type || null;

      if (!answered) {
        blank++;
      } else if (isCorrect) {
        correct++;
      } else if (isPartial) {
        partial++;
      } else {
        wrong++;
      }

      const difficulty = ex.difficulty || 1;
      difficultyStats[difficulty] = difficultyStats[difficulty] || { total: 0, correct: 0 };
      difficultyStats[difficulty].total++;
      if (isCorrect) difficultyStats[difficulty].correct++;

      const type = ex.type || 'unknown';
      typeStats[type] = typeStats[type] || { total: 0, correct: 0, partial: 0, wrong: 0 };
      typeStats[type].total++;
      if (isCorrect) typeStats[type].correct++;
      else if (isPartial) typeStats[type].partial++;
      else if (answered) typeStats[type].wrong++;

      (ex.skill_tags || []).forEach((skill: string) => {
        skillStats[skill] = skillStats[skill] || { total: 0, correct: 0, partial: 0, wrong: 0 };
        skillStats[skill].total++;
        if (isCorrect) skillStats[skill].correct++;
        else if (isPartial) skillStats[skill].partial++;
        else if (answered) skillStats[skill].wrong++;
      });

      if (errorType) {
        errorBreakdown[errorType] = (errorBreakdown[errorType] || 0) + 1;
      }

      if (!isCorrect && answered) {
        wrongDetails.push(`#${idx + 1}|${ex.type}|D${difficulty}|Q:"${ex.question}"|A:"${ex.user_answer}"|C:"${ex.correct_answer}"|E:${errorType || 'none'}|F:"${correction?.feedback || ''}"|S:[${(ex.skill_tags || []).join(',')}]`);
      }
    });

    const total = exercises.length;
    const answered = total - blank;
    const accuracyRate = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const performanceScore = total > 0 ? Math.round(((correct + partial * 0.5) / total) * 100) : 0;

    const answersCompact = exercises.map((ex, idx) => {
      const correction = correctionMap.get(ex.id);
      const result = !ex.user_answer ? 'BLANK' : correction?.is_correct ? 'OK' : correction?.is_partial ? 'PARTIAL' : 'WRONG';
      return `${idx + 1}:${result}`;
    }).join(' ');

    const conversationCompact = chatMessages
      .filter(m => m.role !== 'system')
      .map(m => `${m.role === 'user' ? 'S' : 'T'}: ${m.content}`)
      .join('\n');

    return {
      answersCompact,
      wrongAnswersDetailed: wrongDetails.join('\n'),
      statsPrecomputed: { correct, partial, wrong, blank, total, accuracyRate, performanceScore },
      skillStats,
      typeStats,
      difficultyStats,
      errorBreakdown,
      conversationCompact
    };
  }

  async generateReport(userId: string): Promise<ReportGenerationResponse> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) {
      throw new Error('No active lesson.');
    }

    if (lesson.status !== 'chat_completed' && lesson.status !== 'corrected') {
      throw new Error(`Cannot generate report in status: ${lesson.status}.`);
    }

    const exercises = lesson.exercises_data || [];
    const correctionsData = lesson.corrections?.corrections || [];
    const chatMessages = lesson.chat_messages || [];

    const preprocessed = this.preprocessReportData(exercises, correctionsData, chatMessages);

    const report = await aiService.generateReport({
      user_id: userId,
      day: lesson.day,
      lesson: {
        topic: lesson.topic,
        level: lesson.level,
        grammar_focus: lesson.grammar_focus,
        vocabulary_focus: lesson.vocabulary_focus
      } as unknown as Record<string, unknown>,
      preprocessed
    });

    const fullReport = {
      performance_score: report.performance_score,
      accuracy_rate: report.accuracy_rate,
      exercises_correct: report.exercises_correct,
      exercises_partially_correct: report.exercises_partially_correct || 0,
      exercises_wrong: report.exercises_wrong || 0,
      exercises_blank: report.exercises_blank || 0,
      exercises_total: report.exercises_total,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      recurring_errors: report.recurring_errors || [],
      error_breakdown: report.error_breakdown,
      skill_scores: report.skill_scores,
      skill_analysis: report.skill_analysis || [],
      exercise_type_analysis: report.exercise_type_analysis || [],
      difficulty_analysis: report.difficulty_analysis || null,
      conversation_notes: report.conversation_notes || null,
      next_day_focus: report.next_day_focus,
      homework: report.homework || [],
      perceived_level: report.perceived_level,
      motivational_note: report.motivational_note
    };

    await lessonRepository.saveReport(lesson.id, fullReport);
    await lessonRepository.updateStatus(lesson.id, 'completed');

    return report;
  }

  async regenerateReport(userId: string, day: number): Promise<ReportGenerationResponse> {
    const lesson = await lessonRepository.findByUserAndDay(userId, day);
    if (!lesson) {
      throw new Error(`Lesson for day ${day} not found.`);
    }

    if (!lesson.corrections) {
      throw new Error('Cannot regenerate report: lesson has no corrections.');
    }

    const exercises = lesson.exercises_data || [];
    const correctionsData = lesson.corrections?.corrections || [];
    const chatMessages = lesson.chat_messages || [];

    const preprocessed = this.preprocessReportData(exercises, correctionsData, chatMessages);

    const report = await aiService.generateReport({
      user_id: userId,
      day: lesson.day,
      lesson: {
        topic: lesson.topic,
        level: lesson.level,
        grammar_focus: lesson.grammar_focus,
        vocabulary_focus: lesson.vocabulary_focus
      } as unknown as Record<string, unknown>,
      preprocessed
    });

    const fullReport = {
      performance_score: report.performance_score,
      accuracy_rate: report.accuracy_rate,
      exercises_correct: report.exercises_correct,
      exercises_partially_correct: report.exercises_partially_correct || 0,
      exercises_wrong: report.exercises_wrong || 0,
      exercises_blank: report.exercises_blank || 0,
      exercises_total: report.exercises_total,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      recurring_errors: report.recurring_errors || [],
      error_breakdown: report.error_breakdown,
      skill_scores: report.skill_scores,
      skill_analysis: report.skill_analysis || [],
      exercise_type_analysis: report.exercise_type_analysis || [],
      difficulty_analysis: report.difficulty_analysis || null,
      conversation_notes: report.conversation_notes || null,
      next_day_focus: report.next_day_focus,
      homework: report.homework || [],
      perceived_level: report.perceived_level,
      motivational_note: report.motivational_note
    };

    await lessonRepository.saveReport(lesson.id, fullReport);

    return report;
  }

  async getLessonData(userId: string, lessonId: string): Promise<LessonGenerationResponse> {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found.');
    }

    const exercises = lesson.exercises_data || [];
    const corrections = this.parseCorrections(lesson.corrections);

    return {
      day: lesson.day,
      main_topic: lesson.topic,
      topic: lesson.topic,
      phase: lesson.phase,
      level: lesson.level,
      grammar_target_level: lesson.level,
      explanation_level: lesson.level,
      theory: lesson.theory,
      grammar_focus: lesson.grammar_focus || [],
      vocabulary_focus: lesson.vocabulary_focus || [],
      exercises: exercises.map((ex, idx) => {
        const correction = corrections[idx + 1];
        return {
          id: idx + 1,
          db_id: ex.id,
          type: ex.type,
          instruction: this.getInstructionForType(ex.type),
          question: ex.question,
          correct_answer: ex.correct_answer || '',
          options: ex.options,
          hint: ex.hint,
          explanation: ex.explanation,
          targets_skill: ex.skill_tags?.[0] || '',
          skill_tags: ex.skill_tags,
          difficulty: ex.difficulty,
          user_answer: ex.user_answer || null,
          is_correct: correction?.is_correct ?? null,
          is_partial: correction?.is_partial ?? null,
          feedback: correction?.feedback || null,
          error_type: correction?.error_type || null
        };
      }),
      skills_covered: [...new Set(exercises.flatMap(e => e.skill_tags || []))],
      validation: {
        exercise_count: exercises.length,
        difficulty_distribution: this.getDifficultyDistribution(exercises),
        all_grammar_allowed: true,
        no_repetition_from_recent: true
      }
    } as LessonGenerationResponse;
  }

  async getSession(userId: string, day: number): Promise<{
    id: string;
    day: number;
    phase: number;
    level: string;
    topic: string;
    theory: string | null;
    grammar_focus: string[] | null;
    vocabulary_focus: string[] | null;
    status: LessonStatus;
    progress: {
      exercises_answered: number;
      exercises_total: number;
      chat_questions_answered: number;
      chat_questions_total: number;
    };
    exercises: unknown[] | null;
    corrections: unknown;
    chat_messages: unknown[];
    report: unknown;
  } | null> {
    const lesson = await lessonRepository.findByUserAndDay(userId, day);
    if (!lesson) return null;

    return {
      id: lesson.id,
      day: lesson.day,
      phase: lesson.phase,
      level: lesson.level,
      topic: lesson.topic,
      theory: lesson.theory,
      grammar_focus: lesson.grammar_focus,
      vocabulary_focus: lesson.vocabulary_focus,
      status: lesson.status,
      progress: {
        exercises_answered: lesson.exercises_answered,
        exercises_total: lesson.exercises_total,
        chat_questions_answered: lesson.chat_questions_answered,
        chat_questions_total: lesson.chat_questions_total
      },
      exercises: lesson.exercises_data,
      corrections: lesson.corrections,
      chat_messages: lesson.chat_messages || [],
      report: lesson.report
    };
  }

  private getInstructionForType(type: string): string {
    const instructions: Record<string, string> = {
      'fill-blank': 'Complete the blank.',
      'rewrite': 'Rewrite the sentence.',
      'multiple-choice': 'Choose the correct option.',
      'error-correction': 'Correct the error in the sentence.',
      'translation-pt-en': 'Translate to English.'
    };
    return instructions[type] || 'Complete the exercise.';
  }

  private getDifficultyDistribution(exercises: LessonExercise[]): Record<string, number> {
    const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0 };
    exercises.forEach(e => {
      const d = String(e.difficulty || 1);
      dist[d] = (dist[d] || 0) + 1;
    });
    return dist;
  }

  private parseCorrections(corrections: unknown): Record<number, { is_correct: boolean; is_partial: boolean; feedback: string | null; error_type: string | null }> {
    if (!corrections) return {};
    
    const data = typeof corrections === 'string' ? JSON.parse(corrections) : corrections;
    const map: Record<number, { is_correct: boolean; is_partial: boolean; feedback: string | null; error_type: string | null }> = {};
    
    if (data?.corrections && Array.isArray(data.corrections)) {
      for (const c of data.corrections) {
        const id = c.id || c.exercise_id;
        map[id] = {
          is_correct: c.is_correct,
          is_partial: c.is_partial || false,
          feedback: c.feedback || null,
          error_type: c.error_type || null
        };
      }
    }
    
    return map;
  }

  async getHistory(userId: string, page = 1, limit = 20): Promise<{
    data: Array<{
      lesson_id: string;
      day: number;
      topic: string;
      level: string;
      phase: number;
      status: string;
      completed: boolean;
      exercises_total: number;
      exercises_answered: number;
      exercises_correct: number;
      accuracy_rate: number;
      performance_score: number;
      perceived_level: string | null;
      started_at: string | null;
      completed_at: string | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const offset = (page - 1) * limit;
    const summaries = await lessonSummaryRepository.findByUser(userId, limit, offset);
    const total = await lessonSummaryRepository.countByUser(userId);
    
    const data = summaries.map((s) => ({
      lesson_id: s.lesson_id,
      day: s.day,
      topic: s.topic,
      level: s.level,
      phase: s.phase,
      status: s.status,
      completed: s.status === 'completed',
      exercises_total: s.exercises_total,
      exercises_answered: s.exercises_answered,
      exercises_correct: s.exercises_correct,
      accuracy_rate: s.accuracy_rate,
      performance_score: s.performance_score,
      perceived_level: s.perceived_level,
      started_at: s.started_at,
      completed_at: s.completed_at
    }));

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const lessonService = new LessonService();
