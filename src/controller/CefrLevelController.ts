import { NextFunction, Request, Response } from "express";
import CefrLevelService from "../service/CefrLevelService.js";
import { createCefrLevelSchema, updateCefrLevelSchema } from "../validation/cefr-levels/cefr-level.schema.js";

class CefrLevelController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createCefrLevelSchema.parse(req.body);
      const level = await CefrLevelService.createLevel(payload);
      res.status(201).json(level);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const payload = updateCefrLevelSchema.parse(req.body);
      const level = await CefrLevelService.updateLevel(id, payload);
      res.json(level);
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const levels = await CefrLevelService.listLevels();
      res.json(levels);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const level = await CefrLevelService.getLevel(id);
      res.json(level);
    } catch (error) {
      next(error);
    }
  }
}

export default new CefrLevelController();
