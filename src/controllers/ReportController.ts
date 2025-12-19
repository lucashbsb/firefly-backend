import { Request, Response } from 'express';
import { progressService } from '../services';
import { reportValidation } from '../validations';

export class ReportController {
  async getLatest(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const report = await progressService.getLatestReport(userId);

    if (!report) {
      res.status(404).json({ error: 'No reports found' });
      return;
    }

    res.json(report);
  }

  async getByDay(req: Request, res: Response): Promise<void> {
    const { userId, day } = req.params;
    const validation = reportValidation.validateDay(parseInt(day));
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.toResponse() });
      return;
    }

    const report = await progressService.getReport(userId, parseInt(day));

    if (!report) {
      res.status(404).json({ error: 'Report not found' });
      return;
    }

    res.json(report);
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;
    const history = await progressService.getReportHistory(userId, limit);
    res.json(history);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { lesson_id, day, ...reportData } = req.body;

    const validation = reportValidation.validateCreate({ 
      user_id: userId, 
      day, 
      performance_score: reportData.performance_score 
    });
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.toResponse() });
      return;
    }

    const id = await progressService.saveReport(userId, lesson_id, day, reportData);
    res.status(201).json({ id });
  }

  async updateLessonProgress(req: Request, res: Response): Promise<void> {
    const { userId, day } = req.params;
    const { lesson_id, status, score, correct, total } = req.body;

    const id = await progressService.updateLessonProgress(
      userId,
      lesson_id,
      parseInt(day),
      status,
      score,
      correct,
      total
    );

    res.json({ id });
  }
}

export const reportController = new ReportController();
