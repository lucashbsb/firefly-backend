import { Repository } from "typeorm";
import { AppDataSource, initializeDataSource } from "../infrastructure/db/DataSource.js";
import SkillTrack from "../entity/SkillTrackEntity.js";

class SkillTrackRepository {
  private repository: Repository<SkillTrack> | null = null;

  private async getRepository() {
    if (!this.repository) {
      const dataSource = await initializeDataSource();
      this.repository = dataSource.getRepository(SkillTrack);
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

  async save(track: SkillTrack) {
    const repo = await this.getRepository();
    return repo.save(track);
  }

  async create(payload: Partial<SkillTrack>) {
    const repo = await this.getRepository();
    return repo.create(payload);
  }

  async listActive() {
    const repo = await this.getRepository();
    return repo.find({ where: { isActive: true }, order: { name: "ASC" } });
  }
}

export default new SkillTrackRepository();
