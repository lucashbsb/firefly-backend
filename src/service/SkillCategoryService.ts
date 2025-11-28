import AppError from "../exception/AppError.js";
import { CreateSkillCategoryDto, UpdateSkillCategoryDto } from "../validation/skill-categories/skill-category.schema.js";
import skillCategoryRepository from "../repository/SkillCategoryRepository.js";

class SkillCategoryService {
  async createCategory(payload: CreateSkillCategoryDto) {
    const existing = await skillCategoryRepository.findByCode(payload.code);
    if (existing) {
      throw new AppError("Skill category already exists", 409);
    }
    const category = await skillCategoryRepository.create(payload);
    return skillCategoryRepository.save(category);
  }

  async updateCategory(id: number, payload: UpdateSkillCategoryDto) {
    const category = await skillCategoryRepository.findById(id);
    if (!category) {
      throw new AppError("Skill category not found", 404);
    }
    Object.assign(category, payload);
    return skillCategoryRepository.save(category);
  }

  async listCategories() {
    return skillCategoryRepository.listActive();
  }

  async getCategory(id: number) {
    const category = await skillCategoryRepository.findById(id);
    if (!category) {
      throw new AppError("Skill category not found", 404);
    }
    return category;
  }
}

export default new SkillCategoryService();
