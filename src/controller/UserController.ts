import { NextFunction, Request, Response } from "express";
import UserService from "../service/UserService.js";
import { createUserSchema, updateUserSchema } from "../validation/users/user.schema.js";

class UserController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createUserSchema.parse(req.body);
      const user = await UserService.createUser(payload);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payload = updateUserSchema.parse(req.body);
      const user = await UserService.updateUser(id, payload);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.listUsers();
      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await UserService.getUser(id);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
