import { aiService } from './AIService';
import { progressService } from './ProgressService';
import { lessonExerciseService } from './lesson/LessonExerciseService';
import { lessonChatService } from './lesson/LessonChatService';
import { 
  lessonRepository, 
  exerciseRepository, 
  reportRepository, 
  answerRepository,
  lessonChatRepository,
  LessonStatus
} from '../repositories';
import { 
  LessonGenerationResponse, 
  CorrectionResponse, 
  ReportGenerationResponse, 
  Exercise 
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
  async getWorkflowState(userId: string): Promise<LessonWorkflowState | null> {
    const lesson = await lessonRepository.findActiveByUser(userId);
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

    const previousReport = lastCompleted 
      ? await reportRepository.findByUserAndDay(userId, lastCompleted.day)
      : null;

    const lesson = await aiService.generateLesson({
      user_id: userId,
      day: nextDay,
      previous_report: previousReport as unknown as Record<string, unknown> || undefined
    });

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

    await exerciseRepository.deleteByLessonId(lessonId);
    
    if (lesson.exercises?.length > 0) {
      await exerciseRepository.createMany(lessonId, lesson.exercises.map(ex => ({
        type: ex.type,
        question: ex.question,
        correct_answer: ex.correct_answer,
        options: ex.options,
        hint: ex.hint,
        explanation: ex.explanation,
        skill_tags: ex.targets_skill ? [ex.targets_skill] : ex.skill_tags,
        difficulty: ex.difficulty
      })));
    }

    return lessonId;
  }

  async answerExercise(
    userId: string,
    exerciseIndex: number,
    answer: string
  ): Promise<{ success: boolean; exercises_answered: number; exercises_total: number; all_answered: boolean }> {
    return lessonExerciseService.answerExercise(userId, exerciseIndex, answer);
  }

  async submitExercises(userId: string): Promise<{ success: boolean; message: string }> {
    return lessonExerciseService.submitExercises(userId);
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

  async generateReport(userId: string): Promise<ReportGenerationResponse> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) {
      throw new Error('No active lesson.');
    }

    if (lesson.status !== 'chat_completed' && lesson.status !== 'corrected') {
      throw new Error(`Cannot generate report in status: ${lesson.status}.`);
    }

    const exercises = await exerciseRepository.findByLessonId(lesson.id);
    const userAnswers = await answerRepository.findByUserAndExerciseIds(userId, exercises.map(e => e.id));
    const chatMessages = await lessonChatRepository.findByLesson(lesson.id);

    const answersData = exercises.map((ex) => {
      const answer = userAnswers.find(a => a.exercise_id === ex.id);
      return {
        question: ex.question,
        student_answer: answer?.answer || '',
        correct_answer: ex.correct_answer || '',
        is_correct: answer?.is_correct || false,
        feedback: answer?.feedback || undefined,
        error_type: answer?.error_type || undefined
      };
    }).filter(a => a.student_answer);

    const lessonData = await this.getLessonData(userId, lesson.id);

    const report = await aiService.generateReport({
      user_id: userId,
      day: lesson.day,
      lesson: lessonData as unknown as Record<string, unknown>,
      answers: answersData,
      conversation_history: chatMessages.map(m => ({ role: m.role, content: m.content }))
    });

    await progressService.saveReport(userId, lesson.id, lesson.day, {
      performance_score: report.performance_score,
      accuracy_rate: report.accuracy_rate,
      exercises_correct: report.exercises_correct,
      exercises_total: report.exercises_total,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      error_breakdown: report.error_breakdown,
      skill_scores: report.skill_scores,
      next_day_focus: report.next_day_focus,
      perceived_level: report.perceived_level,
      motivational_note: report.motivational_note
    });

    await lessonRepository.updateStatus(lesson.id, 'completed');

    return report;
  }

  async getLessonData(userId: string, lessonId: string): Promise<LessonGenerationResponse> {
    const lesson = await lessonRepository.findById(lessonId);
    if (!lesson) {
      throw new Error('Lesson not found.');
    }

    const exercises = await exerciseRepository.findByLessonId(lesson.id);
    const answers = await this.getAnswersForExercises(userId, exercises);

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
      exercises: exercises.map((ex, idx) => ({
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
        user_answer: answers[ex.id]?.answer || null,
        is_correct: answers[ex.id]?.is_correct ?? null,
        feedback: answers[ex.id]?.feedback || null
      })),
      skills_covered: [...new Set(exercises.flatMap(e => e.skill_tags || []))],
      validation: {
        exercise_count: exercises.length,
        difficulty_distribution: this.getDifficultyDistribution(exercises),
        all_grammar_allowed: true,
        no_repetition_from_recent: true
      }
    } as LessonGenerationResponse;
  }

  async getSession(userId: string, day: number): Promise<LessonGenerationResponse | null> {
    const lesson = await lessonRepository.findByUserAndDay(userId, day);
    if (!lesson) return null;

    return this.getLessonData(userId, lesson.id);
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

  private getDifficultyDistribution(exercises: Exercise[]): Record<string, number> {
    const dist: Record<string, number> = { '1': 0, '2': 0, '3': 0 };
    exercises.forEach(e => {
      const d = String(e.difficulty || 1);
      dist[d] = (dist[d] || 0) + 1;
    });
    return dist;
  }

  private async getAnswersForExercises(
    userId: string, 
    exercises: Exercise[]
  ): Promise<Record<string, { answer: string; is_correct: boolean; feedback: string | null }>> {
    const exerciseIds = exercises.map(e => e.id);
    if (exerciseIds.length === 0) return {};

    const answers = await answerRepository.findByUserAndExerciseIds(userId, exerciseIds);
    const map: Record<string, { answer: string; is_correct: boolean; feedback: string | null }> = {};
    
    answers.forEach(a => {
      if (a.exercise_id) {
        map[a.exercise_id] = {
          answer: a.answer || '',
          is_correct: a.is_correct,
          feedback: a.feedback || null
        };
      }
    });
    
    return map;
  }
}

export const lessonService = new LessonService();
