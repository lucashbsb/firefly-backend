import { Repository } from "typeorm";
import { AppDataSource, initializeDataSource } from "../infrastructure/db/DataSource.js";
import CefrLevel from "../entity/CefrLevelEntity.js";

class CefrLevelRepository {
  private repository: Repository<CefrLevel> | null = null;

  private async getRepository() {
    if (!this.repository) {
      const dataSource = await initializeDataSource();
      this.repository = dataSource.getRepository(CefrLevel);
    }
    return this.repository;
  }

  async findById(id: number) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { id, isActive: true } });
  }

  async findByCode(code: string) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { code, isActive: true } });
  }

  async save(level: CefrLevel) {
    const repo = await this.getRepository();
    return repo.save(level);
  }

  async create(payload: Partial<CefrLevel>) {
    const repo = await this.getRepository();
    return repo.create(payload);
  }

  async listActive() {
    const repo = await this.getRepository();
    return repo.find({ where: { isActive: true }, order: { id: "ASC" } });
  }
}

export default new CefrLevelRepository();
