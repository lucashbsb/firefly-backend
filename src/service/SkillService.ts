import AppError from "../exception/AppError.js";
import { CreateSkillDto, UpdateSkillDto } from "../validation/skills/skill.schema.js";
import skillRepository from "../repository/SkillRepository.js";
import cefrLevelRepository from "../repository/CefrLevelRepository.js";
import skillCategoryRepository from "../repository/SkillCategoryRepository.js";
import skillTrackRepository from "../repository/SkillTrackRepository.js";

class SkillService {
  async createSkill(payload: CreateSkillDto) {
    const existing = await skillRepository.findByCode(payload.code);
    if (existing) {
      throw new AppError("Skill already exists", 409);
    }
    await this.validateReferences(payload.categoryId, payload.trackId, payload.levelMinId, payload.levelMaxId);
    const skill = await skillRepository.create(payload);
    return skillRepository.save(skill);
  }

  private async validateReferences(categoryId: number, trackId: number, levelMinId: number, levelMaxId: number) {
    const [category, track, levelMin, levelMax] = await Promise.all([
      skillCategoryRepository.findById(categoryId),
      skillTrackRepository.findById(trackId),
      cefrLevelRepository.findById(levelMinId),
      cefrLevelRepository.findById(levelMaxId)
    ]);
    if (!category || !track || !levelMin || !levelMax) {
      throw new AppError("Invalid references", 400);
    }
  }

  async updateSkill(id: string, payload: UpdateSkillDto) {
    const skill = await skillRepository.findById(id);
    if (!skill) {
      throw new AppError("Skill not found", 404);
    }
    Object.assign(skill, payload);
    return skillRepository.save(skill);
  }

  async listSkills() {
    return skillRepository.listActive();
  }

  async getSkill(id: string) {
    const skill = await skillRepository.findById(id);
    if (!skill) {
      throw new AppError("Skill not found", 404);
    }
    return skill;
  }
}

export default new SkillService();
