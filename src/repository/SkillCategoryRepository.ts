import { Repository } from "typeorm";
import { AppDataSource, initializeDataSource } from "../infrastructure/db/DataSource.js";
import SkillCategory from "../entity/SkillCategoryEntity.js";

class SkillCategoryRepository {
  private repository: Repository<SkillCategory> | null = null;

  private async getRepository() {
    if (!this.repository) {
      const dataSource = await initializeDataSource();
      this.repository = dataSource.getRepository(SkillCategory);
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

  async save(category: SkillCategory) {
    const repo = await this.getRepository();
    return repo.save(category);
  }

  async create(payload: Partial<SkillCategory>) {
    const repo = await this.getRepository();
    return repo.create(payload);
  }

  async listActive() {
    const repo = await this.getRepository();
    return repo.find({ where: { isActive: true }, order: { name: "ASC" } });
  }
}

export default new SkillCategoryRepository();
