import { NextFunction, Request, Response } from "express";
import RoleService from "../service/RoleService.js";
import { createRoleSchema, updateRoleSchema } from "../validation/roles/role.schema.js";

class RoleController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createRoleSchema.parse(req.body);
      const role = await RoleService.createRole(payload);
      res.status(201).json(role);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payload = updateRoleSchema.parse(req.body);
      const role = await RoleService.updateRole(id, payload);
      res.json(role);
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const roles = await RoleService.listRoles();
      res.json(roles);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const role = await RoleService.getRole(id);
      res.json(role);
    } catch (error) {
      next(error);
    }
  }
}

export default new RoleController();
