import { skillRepository, userSkillRepository } from '../repositories';
import { SkillProgressDTO } from '../dto';

export class SkillService {
  async trackPractice(userId: string, skillCode: string, isCorrect: boolean): Promise<{ skill_id: string; mastery_level: number } | null> {
    const skill = await skillRepository.findByCode(skillCode);
    if (!skill) return null;

    const existing = await userSkillRepository.findByUserAndSkill(userId, skill.id);

    if (existing) {
      const newPracticeCount = existing.practice_count + 1;
      const newCorrectCount = existing.correct_count + (isCorrect ? 1 : 0);
      const newMastery = Math.round((newCorrectCount / newPracticeCount) * 100);

      await userSkillRepository.updateMastery(userId, skill.id, newMastery);

      return { skill_id: skill.id, mastery_level: newMastery };
    }

    const mastery = isCorrect ? 100 : 0;

    await userSkillRepository.create({
      user_id: userId,
      skill_id: skill.id,
      mastery_level: mastery,
      practice_count: 1,
      correct_count: isCorrect ? 1 : 0
    });

    return { skill_id: skill.id, mastery_level: mastery };
  }

  async getUserSkills(userId: string): Promise<SkillProgressDTO[]> {
    return userSkillRepository.findByUserWithDetails(userId);
  }

  async getMastered(userId: string, threshold = 80): Promise<SkillProgressDTO[]> {
    return userSkillRepository.findMastered(userId, threshold);
  }

  async getWeak(userId: string, threshold = 40, limit = 10): Promise<SkillProgressDTO[]> {
    return userSkillRepository.findWeak(userId, threshold, limit);
  }

  async getAllSkills(): Promise<any[]> {
    return skillRepository.findAll();
  }

  async findAll(): Promise<any[]> {
    return skillRepository.findAll();
  }

  async findByLevel(level: string): Promise<any[]> {
    return skillRepository.findByLevel(level);
  }

  async getByCategory(userId: string): Promise<Record<string, SkillProgressDTO[]>> {
    const skills = await userSkillRepository.findByUserWithDetails(userId);
    const grouped: Record<string, SkillProgressDTO[]> = {};
    
    for (const skill of skills) {
      const category = skill.category || 'uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(skill);
    }
    
    return grouped;
  }
}

export const skillService = new SkillService();
