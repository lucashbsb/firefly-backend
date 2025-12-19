import { Request, Response } from 'express';
import { skillService } from '../services';
import { skillValidation } from '../validations';

export class SkillController {
  async getAll(req: Request, res: Response): Promise<void> {
    const { level } = req.query;

    if (level) {
      const validation = skillValidation.validateLevel(level as string);
      if (!validation.isValid) {
        res.status(400).json({ errors: validation.toResponse() });
        return;
      }
    }

    const skills = level 
      ? await skillService.findByLevel(level as string)
      : await skillService.findAll();

    res.json(skills);
  }

  async getUserSkills(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const skills = await skillService.getUserSkills(userId);
    res.json(skills);
  }

  async getMastered(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const threshold = parseInt(req.query.threshold as string) || 80;
    const skills = await skillService.getMastered(userId, threshold);
    res.json(skills);
  }

  async getWeak(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const threshold = parseInt(req.query.threshold as string) || 60;
    const skills = await skillService.getWeak(userId, threshold);
    res.json(skills);
  }

  async getByCategory(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const categories = await skillService.getByCategory(userId);
    res.json(categories);
  }

  async trackPractice(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { skill_code, is_correct } = req.body;

    const validation = skillValidation.validateCode(skill_code);
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.toResponse() });
      return;
    }

    const result = await skillService.trackPractice(userId, skill_code, is_correct);

    if (!result) {
      res.status(404).json({ error: 'Skill not found' });
      return;
    }

    res.json(result);
  }
}

export const skillController = new SkillController();
