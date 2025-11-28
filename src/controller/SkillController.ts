import { NextFunction, Request, Response } from "express";
import SkillService from "../service/SkillService.js";
import { createSkillSchema, updateSkillSchema } from "../validation/skills/skill.schema.js";

class SkillController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createSkillSchema.parse(req.body);
      const skill = await SkillService.createSkill(payload);
      res.status(201).json(skill);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payload = updateSkillSchema.parse(req.body);
      const skill = await SkillService.updateSkill(id, payload);
      res.json(skill);
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const skills = await SkillService.listSkills();
      res.json(skills);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const skill = await SkillService.getSkill(id);
      res.json(skill);
    } catch (error) {
      next(error);
    }
  }
}

export default new SkillController();
