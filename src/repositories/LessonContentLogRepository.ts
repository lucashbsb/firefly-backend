import { BaseRepository } from './base/BaseRepository';
import { LessonContentLog } from '../models/entities/AdaptiveLearning';

export class LessonContentLogRepository extends BaseRepository<LessonContentLog> {
  protected tableName = 'lesson_content_log';

  async findByUserDay(userId: string, day: number): Promise<LessonContentLog | null> {
    const result = await this.query<LessonContentLog>(
      'SELECT * FROM lesson_content_log WHERE user_id = $1 AND day = $2',
      [userId, day]
    );
    return result.rows[0] || null;
  }

  async findLastByUser(userId: string): Promise<LessonContentLog | null> {
    const result = await this.query<LessonContentLog>(
      'SELECT * FROM lesson_content_log WHERE user_id = $1 ORDER BY day DESC LIMIT 1',
      [userId]
    );
    return result.rows[0] || null;
  }

  async findRecentByUser(userId: string, limit = 5): Promise<LessonContentLog[]> {
    const result = await this.query<LessonContentLog>(
      'SELECT * FROM lesson_content_log WHERE user_id = $1 ORDER BY day DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  }

  async create(data: Omit<LessonContentLog, 'id' | 'created_at'>): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO lesson_content_log 
       (user_id, day, skills_taught, skills_practiced, skills_introduced, exercise_types, 
        exercise_count, theory_topics, vocabulary_introduced, grammar_focus, 
        ai_model, ai_provider, generation_tokens, generation_time_ms, ai_recommendations) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
       RETURNING id`,
      [
        data.user_id,
        data.day,
        JSON.stringify(data.skills_taught),
        JSON.stringify(data.skills_practiced),
        JSON.stringify(data.skills_introduced),
        JSON.stringify(data.exercise_types),
        data.exercise_count,
        JSON.stringify(data.theory_topics),
        JSON.stringify(data.vocabulary_introduced),
        JSON.stringify(data.grammar_focus),
        data.ai_model || null,
        data.ai_provider || null,
        data.generation_tokens || null,
        data.generation_time_ms || null,
        JSON.stringify(data.ai_recommendations)
      ]
    );
    return result.rows[0].id;
  }

  async getSkillsHistory(userId: string, days = 30): Promise<string[]> {
    const result = await this.query<{ skills_taught: string[] }>(
      `SELECT skills_taught FROM lesson_content_log 
       WHERE user_id = $1 ORDER BY day DESC LIMIT $2`,
      [userId, days]
    );
    const allSkills = result.rows.flatMap(r => r.skills_taught || []);
    return [...new Set(allSkills)];
  }
}

export const lessonContentLogRepository = new LessonContentLogRepository();
