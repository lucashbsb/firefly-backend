import { NextFunction, Request, Response } from "express";
import PermissionService from "../service/PermissionService.js";
import { createPermissionSchema, updatePermissionSchema } from "../validation/permissions/permission.schema.js";

class PermissionController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createPermissionSchema.parse(req.body);
      const permission = await PermissionService.createPermission(payload);
      res.status(201).json(permission);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payload = updatePermissionSchema.parse(req.body);
      const permission = await PermissionService.updatePermission(id, payload);
      res.json(permission);
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const permissions = await PermissionService.listPermissions();
      res.json(permissions);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const permission = await PermissionService.getPermission(id);
      res.json(permission);
    } catch (error) {
      next(error);
    }
  }
}

export default new PermissionController();
