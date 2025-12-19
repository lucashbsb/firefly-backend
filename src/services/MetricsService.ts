import {
  userLearningMetricsRepository,
  userErrorLogRepository,
  lessonContentLogRepository
} from '../repositories';
import { adaptiveLearningService, LearningContext } from './AdaptiveLearningService';

export class MetricsService {
  async getWeeklyStats(userId: string) {
    return userLearningMetricsRepository.getWeeklyStats(userId);
  }

  async getMonthlyStats(userId: string) {
    return userLearningMetricsRepository.getMonthlyStats(userId);
  }

  async getProgressTrend(userId: string, days: number) {
    return userLearningMetricsRepository.getProgressTrend(userId, days);
  }

  async getErrorPatterns(userId: string) {
    const [recurring, byType, byCategory] = await Promise.all([
      userErrorLogRepository.getRecurringErrors(userId),
      userErrorLogRepository.getErrorsByType(userId),
      userErrorLogRepository.getErrorsByCategory(userId)
    ]);
    return { recurring, byType, byCategory };
  }

  async getLessonHistory(userId: string, limit: number) {
    return lessonContentLogRepository.findRecentByUser(userId, limit);
  }

  async getLearningContext(userId: string, day: number): Promise<LearningContext> {
    return adaptiveLearningService.buildLearningContext(userId, day);
  }

  async getDashboard(userId: string, day: number) {
    const [weekly, monthly, errors, context] = await Promise.all([
      userLearningMetricsRepository.getWeeklyStats(userId),
      userLearningMetricsRepository.getMonthlyStats(userId),
      userErrorLogRepository.getErrorsByType(userId),
      adaptiveLearningService.buildLearningContext(userId, day)
    ]);

    return {
      weekly,
      monthly,
      errors,
      skills: context.skills_context,
      metrics: context.metrics,
      recentLessons: context.recent_lessons
    };
  }
}

export const metricsService = new MetricsService();
