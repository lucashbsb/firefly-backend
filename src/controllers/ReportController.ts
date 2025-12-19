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
}

export const reportController = new ReportController();
