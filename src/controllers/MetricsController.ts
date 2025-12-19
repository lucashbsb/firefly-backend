import { Request, Response } from 'express';
import { metricsService } from '../services/MetricsService';

export class MetricsController {
  async getWeeklyStats(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const stats = await metricsService.getWeeklyStats(userId);
    res.json({ success: true, data: stats });
  }

  async getMonthlyStats(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const stats = await metricsService.getMonthlyStats(userId);
    res.json({ success: true, data: stats });
  }

  async getProgressTrend(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const trend = await metricsService.getProgressTrend(userId, days);
    res.json({ success: true, data: trend });
  }

  async getErrorPatterns(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const patterns = await metricsService.getErrorPatterns(userId);
    res.json({ success: true, data: patterns });
  }

  async getLessonHistory(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 10;
    const history = await metricsService.getLessonHistory(userId, limit);
    res.json({ success: true, data: history });
  }

  async getLearningContext(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const day = parseInt(req.query.day as string) || 1;
    const context = await metricsService.getLearningContext(userId, day);
    res.json({ success: true, data: context });
  }

  async getDashboard(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const day = parseInt(req.query.day as string) || 1;
    const dashboard = await metricsService.getDashboard(userId, day);
    res.json({ success: true, data: dashboard });
  }
}

export const metricsController = new MetricsController();
