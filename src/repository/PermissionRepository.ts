import { Repository } from "typeorm";
import { AppDataSource, initializeDataSource } from "../infrastructure/db/DataSource.js";
import Permission from "../entity/PermissionEntity.js";

class PermissionRepository {
  private repository: Repository<Permission> | null = null;

  private async getRepository() {
    if (!this.repository) {
      const dataSource = await initializeDataSource();
      this.repository = dataSource.getRepository(Permission);
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

  async save(permission: Permission) {
    const repo = await this.getRepository();
    return repo.save(permission);
  }

  async create(data: Partial<Permission>) {
    const repo = await this.getRepository();
    return repo.create(data);
  }

  async listActive() {
    const repo = await this.getRepository();
    return repo.find({ where: { isActive: true }, order: { createdAt: "DESC" } });
  }
}

export default new PermissionRepository();
