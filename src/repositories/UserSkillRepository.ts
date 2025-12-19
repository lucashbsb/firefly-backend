import { BaseRepository } from './base';
import { UserSkill } from '../models/entities';
import { SkillProgressDTO } from '../dto';

interface UserSkillRow {
  skill_code: string;
  skill_name: string;
  skill_category: string;
  skill_level: string;
  mastery_level: number;
  practice_count: number;
  last_practiced_at: string | null;
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

  async findByUserAndSkill(userId: string, skillId: string): Promise<UserSkill | null> {
    const result = await this.query<UserSkill>(
      'SELECT * FROM user_skills WHERE user_id = $1 AND skill_id = $2',
      [userId, skillId]
    );
    return result.rows[0] || null;
  }

  async findByUserWithDetails(userId: string): Promise<SkillProgressDTO[]> {
    const result = await this.query<UserSkillRow>(
      `SELECT us.mastery_level, us.practice_count, us.last_practiced_at,
              s.code as skill_code, s.name as skill_name, s.category as skill_category, s.level as skill_level
       FROM user_skills us JOIN skills s ON s.id = us.skill_id WHERE us.user_id = $1`,
      [userId]
    );
    return this.mapToProgress(result.rows);
  }

  async findMastered(userId: string, threshold: number): Promise<SkillProgressDTO[]> {
    const result = await this.query<UserSkillRow>(
      `SELECT us.mastery_level, us.practice_count, us.last_practiced_at,
              s.code as skill_code, s.name as skill_name, s.category as skill_category, s.level as skill_level
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1 AND us.mastery_level >= $2 ORDER BY us.mastery_level DESC`,
      [userId, threshold]
    );
    return this.mapToProgress(result.rows);
  }

  async findWeak(userId: string, threshold: number, limit = 10): Promise<SkillProgressDTO[]> {
    const result = await this.query<UserSkillRow>(
      `SELECT us.mastery_level, us.practice_count, us.last_practiced_at,
              s.code as skill_code, s.name as skill_name, s.category as skill_category, s.level as skill_level
       FROM user_skills us JOIN skills s ON s.id = us.skill_id
       WHERE us.user_id = $1 AND us.mastery_level < $2 ORDER BY us.mastery_level ASC LIMIT $3`,
      [userId, threshold, limit]
    );
    return this.mapToProgress(result.rows);
  }

  async create(data: {
    user_id: string;
    skill_id: string;
    mastery_level: number;
    practice_count: number;
    correct_count: number;
  }): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO user_skills (user_id, skill_id, mastery_level, practice_count, correct_count, last_practiced_at)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING id`,
      [data.user_id, data.skill_id, data.mastery_level, data.practice_count, data.correct_count]
    );
    return result.rows[0].id;
  }

  async updateMastery(userId: string, skillId: string, mastery: number): Promise<void> {
    await this.query(
      'UPDATE user_skills SET mastery_level = $1, practice_count = practice_count + 1, last_practiced_at = NOW() WHERE user_id = $2 AND skill_id = $3',
      [mastery, userId, skillId]
    );
  }

  private mapToProgress(rows: UserSkillRow[]): SkillProgressDTO[] {
    return rows.map(r => ({
      code: r.skill_code,
      name: r.skill_name,
      category: r.skill_category,
      level: r.skill_level,
      proficiency: r.mastery_level,
      times_practiced: r.practice_count,
      last_practiced: r.last_practiced_at
    }));
  }
}

export const userSkillRepository = new UserSkillRepository();
