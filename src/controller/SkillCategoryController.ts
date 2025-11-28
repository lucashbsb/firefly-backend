import { NextFunction, Request, Response } from "express";
import SkillCategoryService from "../service/SkillCategoryService.js";
import { createSkillCategorySchema, updateSkillCategorySchema } from "../validation/skill-categories/skill-category.schema.js";

class SkillCategoryController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createSkillCategorySchema.parse(req.body);
      const category = await SkillCategoryService.createCategory(payload);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const payload = updateSkillCategorySchema.parse(req.body);
      const category = await SkillCategoryService.updateCategory(id, payload);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await SkillCategoryService.listCategories();
      res.json(categories);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const category = await SkillCategoryService.getCategory(id);
      res.json(category);
    } catch (error) {
      next(error);
    }
  }
}

export default new SkillCategoryController();
