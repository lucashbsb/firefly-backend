import { aiService } from '../AIService';
import { progressService } from '../ProgressService';
import { lessonRepository, LessonStatus } from '../../repositories';
import { CorrectionResponse, LessonExercise } from '../../models';

export class LessonExerciseService {
  async answerExercise(
    userId: string,
    exerciseId: string | undefined,
    answer: string,
    exerciseIndex?: number
  ): Promise<{ success: boolean; exercises_answered: number; exercises_total: number; all_answered: boolean }> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) {
      throw new Error('No active lesson. Start a lesson first.');
    }

    const allowedStatuses = ['created', 'in_progress', 'exercises_completed', 'corrected'];
    if (!allowedStatuses.includes(lesson.status)) {
      throw new Error(`Cannot answer exercises in status: ${lesson.status}`);
    }

    const exercises = lesson.exercises_data as LessonExercise[] || [];
    
    let exercise: LessonExercise | undefined;
    if (exerciseId) {
      exercise = exercises.find(e => e.id === exerciseId);
    } else if (exerciseIndex !== undefined && exerciseIndex >= 0 && exerciseIndex < exercises.length) {
      exercise = exercises[exerciseIndex];
    }
    
    if (!exercise) {
      throw new Error(exerciseId ? `Exercise ${exerciseId} not found.` : `Exercise at index ${exerciseIndex} not found.`);
    }

    const isNewAnswer = !exercise.user_answer;
    exercise.user_answer = answer;
    await lessonRepository.saveExercisesData(lesson.id, exercises);

    if (isNewAnswer) {
      await lessonRepository.incrementExercisesAnswered(lesson.id);
    }

    if (lesson.status === 'created') {
      await lessonRepository.updateStatus(lesson.id, 'in_progress');
    }

    const progress = await lessonRepository.getProgress(lesson.id);
    const allAnswered = progress!.exercises_answered >= progress!.exercises_total;

    return {
      success: true,
      exercises_answered: progress!.exercises_answered,
      exercises_total: progress!.exercises_total,
      all_answered: allAnswered
    };
  }

  async submitExercises(userId: string): Promise<{ success: boolean; message: string }> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) {
      throw new Error('No active lesson.');
    }

    const progress = await lessonRepository.getProgress(lesson.id);
    if (progress!.exercises_answered < progress!.exercises_total) {
      throw new Error(`Please answer all exercises. ${progress!.exercises_answered}/${progress!.exercises_total} answered.`);
    }

    await lessonRepository.updateStatus(lesson.id, 'exercises_completed');

    return { success: true, message: 'Exercises submitted. Ready for correction.' };
  }

  async correctExercises(userId: string): Promise<CorrectionResponse> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) {
      throw new Error('No active lesson.');
    }

    if (lesson.status !== 'exercises_completed') {
      throw new Error(`Cannot correct exercises in status: ${lesson.status}. Submit exercises first.`);
    }

    const exercises = lesson.exercises_data as LessonExercise[] || [];

    const exercisesWithAnswers = exercises.map((ex) => ({
      id: ex.id,
      type: ex.type,
      question: ex.question,
      correct_answer: ex.correct_answer || '',
      student_answer: ex.user_answer || ''
    })).filter(e => e.student_answer);

    const corrections = await aiService.correctAnswers({
      user_id: userId,
      day: lesson.day,
      exercises: exercisesWithAnswers
    });

    let correct = 0;
    let partial = 0;
    let wrong = 0;
    const errorBreakdown: Record<string, number> = {};

    for (const c of corrections.corrections) {
      if (c.is_correct) {
        correct++;
      } else if (c.is_partial) {
        partial++;
      } else {
        wrong++;
      }
      if (!c.is_correct && c.error_type) {
        errorBreakdown[c.error_type] = (errorBreakdown[c.error_type] || 0) + 1;
      }
    }

    const total = corrections.corrections.length;
    const accuracyRate = total > 0 ? Math.round((correct / total) * 100) : 0;

    corrections.summary = {
      total,
      correct,
      partial,
      wrong,
      accuracy_rate: accuracyRate,
      strengths: corrections.summary?.strengths || [],
      weaknesses: corrections.summary?.weaknesses || [],
      error_patterns: corrections.summary?.error_patterns || []
    };

    await lessonRepository.saveCorrections(lesson.id, corrections);
    await lessonRepository.updateStatus(lesson.id, 'corrected');

    return corrections;
  }
}

export const lessonExerciseService = new LessonExerciseService();
