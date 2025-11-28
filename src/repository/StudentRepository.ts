import { Repository } from "typeorm";
import { AppDataSource, initializeDataSource } from "../infrastructure/db/DataSource.js";
import Student from "../entity/StudentEntity.js";

class StudentRepository {
  private repository: Repository<Student> | null = null;

  private async getRepository() {
    if (!this.repository) {
      const dataSource = await initializeDataSource();
      this.repository = dataSource.getRepository(Student);
    }
    return this.repository;
  }

  async findById(id: string) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { id, isActive: true }, relations: { user: true, initialLevel: true, currentLevel: true } });
  }

  async findByUserId(userId: string) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { user: { id: userId }, isActive: true } });
  }

  async save(student: Student) {
    const repo = await this.getRepository();
    return repo.save(student);
  }

  async create(payload: Partial<Student>) {
    const repo = await this.getRepository();
    return repo.create(payload);
  }

  async listActive() {
    const repo = await this.getRepository();
    return repo.find({ where: { isActive: true }, relations: { user: true, currentLevel: true }, order: { createdAt: "DESC" } });
  }
}

export default new StudentRepository();
