import { NextFunction, Request, Response } from "express";
import SkillTrackService from "../service/SkillTrackService.js";
import { createSkillTrackSchema, updateSkillTrackSchema } from "../validation/skill-tracks/skill-track.schema.js";

class SkillTrackController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createSkillTrackSchema.parse(req.body);
      const track = await SkillTrackService.createTrack(payload);
      res.status(201).json(track);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const payload = updateSkillTrackSchema.parse(req.body);
      const track = await SkillTrackService.updateTrack(id, payload);
      res.json(track);
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const tracks = await SkillTrackService.listTracks();
      res.json(tracks);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const track = await SkillTrackService.getTrack(id);
      res.json(track);
    } catch (error) {
      next(error);
    }
  }
}

export default new SkillTrackController();
