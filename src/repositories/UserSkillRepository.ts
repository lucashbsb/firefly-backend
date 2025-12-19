import { BaseRepository } from './base';
import { UserSkill } from '../models/entities';
import { SkillProgressDTO } from '../dto';

interface UserSkillRow {
  skill_code: string;
  skill_name: string;
  skill_category: string;
  skill_level: string;
  proficiency: number;
  times_practiced: number;
  last_practiced: string | null;
}

export class UserSkillRepository extends BaseRepository<UserSkill> {
  protected tableName = 'user_skills';

  async findByUser(userId: string): Promise<(UserSkill & { skill_id: string; mastery_level: number })[]> {
    const result = await this.query<UserSkill & { skill_id: string; mastery_level: number }>(
      'SELECT * FROM user_skills WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  async findByUserAndSkill(userId: string, skillId: string): Promise<(UserSkill & { id: string; times_practiced: number; times_correct: number }) | null> {
    const result = await this.query<UserSkill & { id: string; times_practiced: number; times_correct: number }>(
      'SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2',
      [userId, skillId]
    );
    return result.rows[0] || null;
  }

  async findByUserWithDetails(userId: string): Promise<SkillProgressDTO[]> {
    const result = await this.query<UserSkillRow>(
      `SELECT us.proficiency, us.times_practiced, us.last_practiced,
              s.code as skill_code, s.name as skill_name, s.category as skill_category, s.level as skill_level
       FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = $1`,
      [userId]
    );
    return this.mapToProgress(result.rows);
  }

  async findMastered(userId: string, threshold: number): Promise<SkillProgressDTO[]> {
    const result = await this.query<UserSkillRow>(
      `SELECT us.proficiency, us.times_practiced, us.last_practiced,
              s.code as skill_code, s.name as skill_name, s.category as skill_category, s.level as skill_level
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1 AND us.proficiency >= $2 ORDER BY us.proficiency DESC`,
      [userId, threshold]
    );
    return this.mapToProgress(result.rows);
  }

  async findWeak(userId: string, threshold: number, limit = 10): Promise<SkillProgressDTO[]> {
    const result = await this.query<UserSkillRow>(
      `SELECT us.proficiency, us.times_practiced, us.last_practiced,
              s.code as skill_code, s.name as skill_name, s.category as skill_category, s.level as skill_level
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1 AND us.proficiency < $2 ORDER BY us.proficiency ASC LIMIT $3`,
      [userId, threshold, limit]
    );
    return this.mapToProgress(result.rows);
  }

  async create(data: {
    user_id: string;
    skill_id: string;
    proficiency: number;
    times_practiced: number;
    times_correct: number;
    last_practiced: string;
  }): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO user_skills (user_id, skill_id, proficiency, times_practiced, times_correct, last_practiced)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.user_id, data.skill_id, data.proficiency, data.times_practiced, data.times_correct, data.last_practiced]
    );
    return result.rows[0].id;
  }

  async updateSkill(id: string, data: Partial<UserSkill>): Promise<void> {
    await this.query(
      'UPDATE user_skills SET times_practiced = $1, times_correct = $2, proficiency = $3, last_practiced = $4 WHERE id = $5',
      [data.times_practiced, data.times_correct, data.proficiency, data.last_practiced, id]
    );
  }

  private mapToProgress(rows: UserSkillRow[]): SkillProgressDTO[] {
    return rows.map(r => ({
      code: r.skill_code,
      name: r.skill_name,
      category: r.skill_category,
      level: r.skill_level,
      proficiency: r.proficiency,
      times_practiced: r.times_practiced,
      last_practiced: r.last_practiced
    }));
  }
}

export const userSkillRepository = new UserSkillRepository();
