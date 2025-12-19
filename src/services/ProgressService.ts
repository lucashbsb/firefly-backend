import { lessonRepository, lessonSummaryRepository } from '../repositories';
import { LessonSummary } from '../models/entities/LessonSummary';

export interface ReportSummary {
  day: number;
  performance_score: number;
  accuracy_rate: number;
  perceived_level: string | null;
  completed_at: string | null;
}

export class ProgressService {
  async getReport(userId: string, day: number): Promise<any | null> {
    const lesson = await lessonRepository.findByUserAndDay(userId, day);
    return lesson?.report || null;
  }

  async getReportHistory(userId: string, limit = 30): Promise<ReportSummary[]> {
    const summaries = await lessonSummaryRepository.findByUser(userId, limit, 0);
    return summaries
      .filter(s => s.status === 'completed')
      .map(s => ({
        day: s.day,
        performance_score: s.performance_score,
        accuracy_rate: s.accuracy_rate,
        perceived_level: s.perceived_level,
        completed_at: s.completed_at
      }));
  }

  async getLatestReport(userId: string): Promise<any | null> {
    const lesson = await lessonRepository.findLastCompletedByUser(userId);
    return lesson?.report || null;
  }

  async getUserProgress(userId: string): Promise<{
    lessons_completed: number;
    avg_accuracy: number;
    avg_performance: number;
    accuracy_trend: number[];
  }> {
    const completed = await lessonSummaryRepository.countCompletedByUser(userId);
    const avgAccuracy = await lessonSummaryRepository.getAverageAccuracy(userId);
    const trend = await lessonSummaryRepository.getAccuracyTrend(userId, 10);
    
    const summaries = await lessonSummaryRepository.findByUser(userId, 10, 0);
    const avgPerformance = summaries.length > 0
      ? summaries.reduce((sum, s) => sum + s.performance_score, 0) / summaries.length
      : 0;

    return {
      lessons_completed: completed,
      avg_accuracy: Math.round(avgAccuracy * 100) / 100,
      avg_performance: Math.round(avgPerformance * 100) / 100,
      accuracy_trend: trend
    };
  }

  async getLessonSummary(userId: string, day: number): Promise<LessonSummary | null> {
    return lessonSummaryRepository.findByUserAndDay(userId, day);
  }
}

export const progressService = new ProgressService();
