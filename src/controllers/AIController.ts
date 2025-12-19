import { Request, Response } from 'express';
import { aiService, userAISettingsService } from '../services';
import { aiSettingsValidation, lessonValidation } from '../validations';

export class AIController {
  async getSettings(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const settings = await userAISettingsService.getOrCreate(userId);
    res.json({ success: true, data: settings });
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const validation = aiSettingsValidation.validateUpdate(req.body);
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.toResponse() });
      return;
    }

    const settings = await userAISettingsService.update(userId, req.body);
    res.json({ success: true, data: settings });
  }

  async generateLesson(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { day, previous_report } = req.body;

    const validation = lessonValidation.validateDay(day);
    if (!validation.isValid) {
      res.status(400).json({ success: false, errors: validation.toResponse() });
      return;
    }

    const lesson = await aiService.generateLesson({
      user_id: userId,
      day: parseInt(day, 10),
      previous_report
    });

    res.json({ success: true, data: lesson });
  }

  async correctAnswers(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { day, exercises } = req.body;

    const validation = lessonValidation.validateDay(day);
    if (!validation.isValid || !exercises) {
      res.status(400).json({ success: false, error: 'day and exercises are required' });
      return;
    }

    const corrections = await aiService.correctAnswers({
      user_id: userId,
      day: parseInt(day, 10),
      exercises
    });

    res.json({ success: true, data: corrections });
  }

  async chat(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { day, history, message } = req.body;

    if (!message) {
      res.status(400).json({ success: false, error: 'message is required' });
      return;
    }

    const response = await aiService.chat({
      user_id: userId,
      day: day ? parseInt(day, 10) : 0,
      history: history || [],
      student_message: message
    });

    res.json({ success: true, data: response });
  }

  async rawCompletion(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { messages, json_mode } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ success: false, error: 'messages array is required' });
      return;
    }

    const response = await aiService.rawCompletion(userId, messages, json_mode || false);

    res.json({ success: true, data: response });
  }
}

export const aiController = new AIController();
