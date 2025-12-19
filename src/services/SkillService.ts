import { skillRepository, userSkillRepository } from '../repositories';
import { Skill } from '../models/entities';
import { SkillProgressDTO } from '../dto';

export class SkillService {
  async trackPractice(userId: string, skillCode: string, isCorrect: boolean): Promise<{ skill_id: string; proficiency: number } | null> {
    const skill = await skillRepository.findByCode(skillCode);
    if (!skill) return null;

    const existing = await userSkillRepository.findByUserAndSkill(userId, skill.id);

    if (existing) {
      return this.updateExistingSkill(existing, skill.id, isCorrect);
    }

    return this.createNewSkill(userId, skill.id, isCorrect);
  }

  private async updateExistingSkill(
    existing: { id: string; times_practiced: number; times_correct: number },
    skillId: string,
    isCorrect: boolean
  ): Promise<{ skill_id: string; proficiency: number }> {
    const newTimesPracticed = existing.times_practiced + 1;
    const newTimesCorrect = existing.times_correct + (isCorrect ? 1 : 0);
    const newProficiency = Math.round((newTimesCorrect / newTimesPracticed) * 100);

    await userSkillRepository.updateSkill(existing.id, {
      times_practiced: newTimesPracticed,
      times_correct: newTimesCorrect,
      proficiency: newProficiency,
      last_practiced: new Date().toISOString()
    });

    return { skill_id: skillId, proficiency: newProficiency };
  }

  private async createNewSkill(userId: string, skillId: string, isCorrect: boolean): Promise<{ skill_id: string; proficiency: number }> {
    const proficiency = isCorrect ? 100 : 0;

    await userSkillRepository.create({
      user_id: userId,
      skill_id: skillId,
      proficiency,
      times_practiced: 1,
      times_correct: isCorrect ? 1 : 0,
      last_practiced: new Date().toISOString()
    });

    return { skill_id: skillId, proficiency };
  }

  async getUserSkills(userId: string): Promise<SkillProgressDTO[]> {
    return userSkillRepository.findByUserWithDetails(userId);
  }

  async getMastered(userId: string, threshold = 80): Promise<SkillProgressDTO[]> {
    return userSkillRepository.findMastered(userId, threshold);
  }

  async getWeak(userId: string, threshold = 60): Promise<SkillProgressDTO[]> {
    return userSkillRepository.findWeak(userId, threshold);
  }

  async getByCategory(userId: string): Promise<Record<string, SkillProgressDTO[]>> {
    const skills = await this.getUserSkills(userId);
    return this.groupByCategory(skills);
  }

  private groupByCategory(skills: SkillProgressDTO[]): Record<string, SkillProgressDTO[]> {
    const categories: Record<string, SkillProgressDTO[]> = {};
    for (const skill of skills) {
      if (!categories[skill.category]) categories[skill.category] = [];
      categories[skill.category].push(skill);
    }
    return categories;
  }

  async syncFromJson(code: string, name: string, category: string, level: string, description?: string): Promise<string | null> {
    return skillRepository.upsert({ code, name, category, level, description });
  }

  async findAll(): Promise<Skill[]> {
    return skillRepository.findAllOrdered();
  }

  async findByLevel(level: string): Promise<Skill[]> {
    return skillRepository.findByLevel(level.toUpperCase());
  }
}

export const skillService = new SkillService();
