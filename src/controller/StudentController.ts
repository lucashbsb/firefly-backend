import { NextFunction, Request, Response } from "express";
import StudentService from "../service/StudentService.js";
import { createStudentSchema, updateStudentSchema } from "../validation/students/student.schema.js";

class StudentController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = createStudentSchema.parse(req.body);
      const student = await StudentService.createStudent(payload);
      res.status(201).json(student);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const payload = updateStudentSchema.parse(req.body);
      const student = await StudentService.updateStudent(id, payload);
      res.json(student);
    } catch (error) {
      next(error);
    }
  }

  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const students = await StudentService.listStudents();
      res.json(students);
    } catch (error) {
      next(error);
    }
  }

  async get(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const student = await StudentService.getStudent(id);
      res.json(student);
    } catch (error) {
      next(error);
    }
  }
}

export default new StudentController();
