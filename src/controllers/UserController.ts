import { Request, Response } from 'express';
import { userService } from '../services';
import { userValidation } from '../validations';

export class UserController {
  async getAll(req: Request, res: Response): Promise<void> {
    const users = await userService.findAll();
    res.json(users);
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const user = await userService.findById(id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user);
  }

  async create(req: Request, res: Response): Promise<void> {
    const validation = userValidation.validateCreate(req.body);
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.toResponse() });
      return;
    }

    const { email, name, native_language, target_level, current_level } = req.body;
    const user = await userService.create({ email, name, native_language, target_level, current_level });
    res.status(201).json(user);
  }

  async getStreak(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const streak = await userService.getStreak(id);

    if (!streak) {
      res.status(404).json({ error: 'Streak not found' });
      return;
    }

    res.json(streak);
  }

  async updateStreak(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const streak = await userService.updateStreak(id);
    res.json(streak);
  }

  async getProgress(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const progress = await userService.getProgress(id);
    res.json(progress);
  }

  async updateLevel(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const validation = userValidation.validateUpdate(req.body);
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.toResponse() });
      return;
    }

    const { level, perceived_level } = req.body;
    const user = await userService.updateLevel(id, level, perceived_level);
    res.json(user);
  }

  async getHistory(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const history = await userService.getHistory(id, limit, offset);
    res.json(history);
  }

  async getHabits(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = req.query.month ? parseInt(req.query.month as string) : undefined;
    
    const habits = await userService.getHabitData(id, year, month);
    res.json(habits);
  }
}

export const userController = new UserController();
