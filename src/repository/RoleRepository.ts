import { Repository } from "typeorm";
import { AppDataSource, initializeDataSource } from "../infrastructure/db/DataSource.js";
import Role from "../entity/RoleEntity.js";

class RoleRepository {
  private repository: Repository<Role> | null = null;

  private async getRepository() {
    if (!this.repository) {
      const dataSource = await initializeDataSource();
      this.repository = dataSource.getRepository(Role);
    }
    return this.repository;
  }

  async findById(id: string) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { id, isActive: true } });
  }

  async findByCode(code: string) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { code, isActive: true } });
  }

  async save(role: Role) {
    const repo = await this.getRepository();
    return repo.save(role);
  }

  async create(data: Partial<Role>) {
    const repo = await this.getRepository();
    return repo.create(data);
  }

  async listActive() {
    const repo = await this.getRepository();
    return repo.find({ where: { isActive: true }, order: { createdAt: "DESC" } });
  }
}

export default new RoleRepository();
