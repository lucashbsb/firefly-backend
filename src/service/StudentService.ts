import AppError from "../exception/AppError.js";
import { CreateStudentDto, UpdateStudentDto } from "../validation/students/student.schema.js";
import studentRepository from "../repository/StudentRepository.js";
import userRepository from "../repository/UserRepository";

class StudentService {
  async createStudent(payload: CreateStudentDto) {
    const user = await userRepository.findById(payload.userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    const existing = await studentRepository.findByUserId(payload.userId);
    if (existing) {
      throw new AppError("Student already exists for this user", 409);
    }
    const student = await studentRepository.create({ ...payload, user });
    return studentRepository.save(student);
  }

  async updateStudent(id: string, payload: UpdateStudentDto) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Student not found", 404);
    }
    Object.assign(student, payload);
    return studentRepository.save(student);
  }

  async listStudents() {
    return studentRepository.listActive();
  }

  async getStudent(id: string) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Student not found", 404);
    }
    return student;
  }
}

export default new StudentService();
