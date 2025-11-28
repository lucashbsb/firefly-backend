import { Repository } from "typeorm";
import { AppDataSource, initializeDataSource } from "../infrastructure/db/DataSource.js";
import User from "../entity/UserEntity.js";

class UserRepository {
  private repository: Repository<User> | null = null;

  private async getRepository() {
    if (!this.repository) {
      const dataSource = await initializeDataSource();
      this.repository = dataSource.getRepository(User);
    }
    return this.repository;
  }

  async findByEmail(email: string) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { email, isActive: true } });
  }

  async findById(id: string) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { id, isActive: true } });
  }

  async save(user: User) {
    const repo = await this.getRepository();
    return repo.save(user);
  }

  async create(payload: Partial<User>) {
    const repo = await this.getRepository();
    return repo.create(payload);
  }

  async listActive() {
    const repo = await this.getRepository();
    return repo.find({ where: { isActive: true }, order: { createdAt: "DESC" } });
  }

  async updateLastLogin(userId: string) {
    const repo = await this.getRepository();
    await repo.update({ id: userId }, { lastLoginAt: new Date() });
  }
}

export default new UserRepository();
