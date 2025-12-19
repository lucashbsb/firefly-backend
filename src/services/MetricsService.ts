import { lessonSummaryRepository, lessonRepository } from '../repositories';
import { adaptiveLearningService, LearningContext } from './AdaptiveLearningService';
import { LessonCorrections } from '../models';

export class MetricsService {
  async getWeeklyStats(userId: string) {
    const summaries = await lessonSummaryRepository.getRecentPerformance(userId, 7);
    const completed = summaries.length;
    const avgAccuracy = completed > 0 
      ? summaries.reduce((sum, s) => sum + s.accuracy_rate, 0) / completed 
      : 0;
    const avgPerformance = completed > 0 
      ? summaries.reduce((sum, s) => sum + s.performance_score, 0) / completed 
      : 0;

    return {
      lessons_completed: completed,
      avg_accuracy: Math.round(avgAccuracy * 100) / 100,
      avg_performance: Math.round(avgPerformance * 100) / 100,
      total_exercises: summaries.reduce((sum, s) => sum + s.exercises_total, 0),
      total_correct: summaries.reduce((sum, s) => sum + s.exercises_correct, 0)
    };
  }

  async getMonthlyStats(userId: string) {
    const summaries = await lessonSummaryRepository.getRecentPerformance(userId, 30);
    const completed = summaries.length;
    const avgAccuracy = completed > 0 
      ? summaries.reduce((sum, s) => sum + s.accuracy_rate, 0) / completed 
      : 0;

    return {
      lessons_completed: completed,
      avg_accuracy: Math.round(avgAccuracy * 100) / 100,
      total_exercises: summaries.reduce((sum, s) => sum + s.exercises_total, 0),
      total_correct: summaries.reduce((sum, s) => sum + s.exercises_correct, 0)
    };
  }

  async getProgressTrend(userId: string, days: number) {
    return lessonSummaryRepository.getAccuracyTrend(userId, days);
  }

  async getErrorPatterns(userId: string) {
    const summaries = await lessonSummaryRepository.getRecentPerformance(userId, 20);
    const lessonIds = summaries.map(s => s.lesson_id);
    
    const errorCounts: Record<string, number> = {};
    
    for (const lessonId of lessonIds) {
      const lesson = await lessonRepository.findById(lessonId);
      if (lesson?.corrections) {
        const corrections = lesson.corrections as LessonCorrections;
        for (const correction of corrections.corrections || []) {
          if (!correction.is_correct && correction.error_type) {
            errorCounts[correction.error_type] = (errorCounts[correction.error_type] || 0) + 1;
          }
        }
      }
    }

    return Object.entries(errorCounts)
      .map(([error_type, count]) => ({ error_type, count }))
      .sort((a, b) => b.count - a.count);
  }

  async getLessonHistory(userId: string, limit: number) {
    return lessonSummaryRepository.findByUser(userId, limit, 0);
  }

  async getLearningContext(userId: string, day: number): Promise<LearningContext> {
    return adaptiveLearningService.buildLearningContext(userId, day);
  }

  async getDashboard(userId: string, day: number) {
    const [weekly, monthly, context] = await Promise.all([
      this.getWeeklyStats(userId),
      this.getMonthlyStats(userId),
      adaptiveLearningService.buildLearningContext(userId, day)
    ]);

    return {
      weekly,
      monthly,
      errors: context.error_patterns,
      skills: context.skills_context,
      metrics: context.metrics,
      recentLessons: context.recent_lessons
    };
  }
}

export const metricsService = new MetricsService();
