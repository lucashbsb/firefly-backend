import { aiService } from '../AIService';
import { 
  lessonRepository, 
  exerciseRepository, 
  answerRepository,
  LessonStatus
} from '../../repositories';
import { CorrectionResponse } from '../../models';

export class LessonExerciseService {
  async answerExercise(
    userId: string,
    exerciseIndex: number,
    answer: string
  ): Promise<{ success: boolean; exercises_answered: number; exercises_total: number; all_answered: boolean }> {
    const lesson = await lessonRepository.findActiveByUser(userId);
    if (!lesson) {
      throw new Error('No active lesson. Start a lesson first.');
    }

    if (lesson.status !== 'created' && lesson.status !== 'in_progress') {
      throw new Error(`Cannot answer exercises in status: ${lesson.status}`);
    }

    const exercises = await exerciseRepository.findByLessonId(lesson.id);
    const exercise = exercises[exerciseIndex - 1];
    
    if (!exercise) {
      throw new Error(`Exercise ${exerciseIndex} not found.`);
    }

    const existing = await answerRepository.findByUserAndExercise(userId, exercise.id);
    
    if (!existing) {
      await answerRepository.upsert({
        user_id: userId,
        exercise_id: exercise.id,
        lesson_id: lesson.id,
        answer,
        is_correct: false,
        is_partial: false,
        feedback: null,
        error_type: null
      });

      await lessonRepository.incrementExercisesAnswered(lesson.id);
    } else {
      await answerRepository.upsert({
        user_id: userId,
        exercise_id: exercise.id,
        lesson_id: lesson.id,
        answer,
        is_correct: existing.is_correct,
        is_partial: existing.is_partial,
        feedback: existing.feedback,
        error_type: existing.error_type
      });
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

    const exercises = await exerciseRepository.findByLessonId(lesson.id);
    const userAnswers = await answerRepository.findByUserAndExerciseIds(userId, exercises.map(e => e.id));

    const exercisesWithAnswers = exercises.map((ex, idx) => {
      const answer = userAnswers.find(a => a.exercise_id === ex.id);
      return {
        id: idx + 1,
        db_id: ex.id,
        type: ex.type,
        question: ex.question,
        correct_answer: ex.correct_answer || '',
        student_answer: answer?.answer || ''
      };
    }).filter(e => e.student_answer);

    const corrections = await aiService.correctAnswers({
      user_id: userId,
      day: lesson.day,
      exercises: exercisesWithAnswers
    });

    for (const c of corrections.corrections) {
      const exercise = exercises[c.id - 1];
      if (!exercise) continue;

      await answerRepository.updateCorrection(userId, exercise.id, {
        is_correct: c.is_correct,
        is_partial: c.is_partial || false,
        feedback: c.feedback || null,
        error_type: c.error_type || null
      });
    }

    await lessonRepository.updateStatus(lesson.id, 'corrected');

    return corrections;
  }
}

export const lessonExerciseService = new LessonExerciseService();
