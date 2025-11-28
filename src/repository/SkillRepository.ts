import { Repository } from "typeorm";
import { AppDataSource, initializeDataSource } from "../infrastructure/db/DataSource.js";
import Skill from "../entity/SkillEntity.js";

class SkillRepository {
  private repository: Repository<Skill> | null = null;

  private async getRepository() {
    if (!this.repository) {
      const dataSource = await initializeDataSource();
      this.repository = dataSource.getRepository(Skill);
    }
    return this.repository;
  }

  async findById(id: string) {
    const repo = await this.getRepository();
    return repo.findOne({ 
      where: { id, isActive: true },
      relations: { category: true, track: true, levelMin: true, levelMax: true }
    });
  }

  async findByCode(code: string) {
    const repo = await this.getRepository();
    return repo.findOne({ where: { code, isActive: true } });
  }

  async save(skill: Skill) {
    const repo = await this.getRepository();
    return repo.save(skill);
  }

  async create(payload: Partial<Skill>) {
    const repo = await this.getRepository();
    return repo.create(payload);
  }

  async listActive() {
    const repo = await this.getRepository();
    return repo.find({ 
      where: { isActive: true },
      relations: { category: true, track: true, levelMin: true, levelMax: true },
      order: { name: "ASC" }
    });
  }
}

export default new SkillRepository();
