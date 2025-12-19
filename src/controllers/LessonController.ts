import { Request, Response } from 'express';
import { lessonService } from '../services';

export class LessonController {
  async getWorkflowState(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const state = await lessonService.getWorkflowState(userId);

    if (!state) {
      res.json({ 
        success: true, 
        data: { 
          has_active_lesson: false, 
          next_action: 'start_lesson' 
        } 
      });
      return;
    }

    res.json({ success: true, data: { has_active_lesson: true, ...state } });
  }

  async startLesson(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const lesson = await lessonService.startLesson(userId);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        lesson,
        workflow: state
      } 
    });
  }

  async answerExercise(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { exercise_id, answer } = req.body;

    if (!exercise_id || !answer) {
      res.status(400).json({ 
        success: false, 
        error: 'exercise_id and answer are required' 
      });
      return;
    }

    const result = await lessonService.answerExercise(userId, exercise_id, answer);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        ...result,
        workflow: state
      } 
    });
  }

  async submitExercises(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const result = await lessonService.submitExercises(userId);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        ...result,
        workflow: state
      } 
    });
  }

  async correctExercises(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const corrections = await lessonService.correctExercises(userId);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        corrections,
        workflow: state
      } 
    });
  }

  async startChat(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const chat = await lessonService.startChat(userId);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        ...chat,
        workflow: state
      } 
    });
  }

  async answerChat(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { message } = req.body;

    if (!message) {
      res.status(400).json({ 
        success: false, 
        error: 'message is required' 
      });
      return;
    }

    const result = await lessonService.answerChat(userId, message);
    const state = await lessonService.getWorkflowState(userId);

    res.json({ 
      success: true, 
      data: { 
        ...result,
        workflow: state
      } 
    });
  }

  async getSession(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const day = parseInt(req.query.day as string);

    if (!day) {
      res.status(400).json({ success: false, error: 'day is required' });
      return;
    }

    const session = await lessonService.getSession(userId, day);
    const state = await lessonService.getWorkflowState(userId);

    if (!session) {
      res.status(404).json({ success: false, error: 'No session found for this day' });
      return;
    }

    res.json({ 
      success: true, 
      data: { 
        lesson: session,
        workflow: state
      } 
    });
  }

  async getReport(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const report = await lessonService.generateReport(userId);

    res.json({ success: true, data: report });
  }
}

export const lessonController = new LessonController();
