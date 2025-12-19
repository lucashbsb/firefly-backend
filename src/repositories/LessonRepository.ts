import { BaseRepository } from './base';
import { Lesson } from '../models/entities';

export type LessonStatus = 'created' | 'in_progress' | 'exercises_completed' | 'corrected' | 'chat_in_progress' | 'chat_completed' | 'completed';

export class LessonRepository extends BaseRepository<Lesson> {
  protected tableName = 'lessons';

  async findById(id: string): Promise<Lesson | null> {
    const result = await this.query<Lesson>('SELECT * FROM lessons WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByDay(day: number): Promise<Lesson | null> {
    const result = await this.query<Lesson>('SELECT * FROM lessons WHERE day = $1', [day]);
    return result.rows[0] || null;
  }

  async findByUserAndDay(userId: string, day: number): Promise<Lesson | null> {
    const result = await this.query<Lesson>(
      'SELECT * FROM lessons WHERE user_id = $1 AND day = $2',
      [userId, day]
    );
    return result.rows[0] || null;
  }

  async findActiveByUser(userId: string): Promise<Lesson | null> {
    const result = await this.query<Lesson>(
      `SELECT * FROM lessons 
       WHERE user_id = $1 AND status != 'completed'
       ORDER BY day DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async findLastCompletedByUser(userId: string): Promise<Lesson | null> {
    const result = await this.query<Lesson>(
      `SELECT * FROM lessons 
       WHERE user_id = $1 AND status = 'completed'
       ORDER BY day DESC LIMIT 1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  async upsert(userId: string, day: number, data: Partial<Lesson>): Promise<string> {
    const existing = await this.findByUserAndDay(userId, day);
    
    if (existing) {
      await this.updateLesson(existing.id, data);
      return existing.id;
    }
    
    return this.createLesson(userId, day, data);
  }

  private async createLesson(userId: string, day: number, data: Partial<Lesson>): Promise<string> {
    const exercisesTotal = data.exercises_total || 30;
    const result = await this.query<{ id: string }>(
      `INSERT INTO lessons (user_id, day, phase, level, topic, theory, grammar_focus, vocabulary_focus, status, exercises_total, exercises_answered, chat_questions_total, chat_questions_answered)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'created', $9, 0, 3, 0) RETURNING id`,
      [userId, day, data.phase, data.level, data.topic, data.theory, JSON.stringify(data.grammar_focus), JSON.stringify(data.vocabulary_focus), exercisesTotal]
    );
    return result.rows[0].id;
  }

  private async updateLesson(id: string, data: Partial<Lesson>): Promise<void> {
    await this.query(
      'UPDATE lessons SET topic = $1, phase = $2, level = $3, theory = $4, grammar_focus = $5, vocabulary_focus = $6 WHERE id = $7',
      [data.topic, data.phase, data.level, data.theory, JSON.stringify(data.grammar_focus), JSON.stringify(data.vocabulary_focus), id]
    );
  }

  async updateStatus(lessonId: string, status: LessonStatus): Promise<void> {
    await this.query('UPDATE lessons SET status = $1 WHERE id = $2', [status, lessonId]);
  }

  async saveCorrections(lessonId: string, corrections: unknown): Promise<void> {
    await this.query('UPDATE lessons SET corrections = $1 WHERE id = $2', [JSON.stringify(corrections), lessonId]);
  }

  async saveExercisesData(lessonId: string, exercises: unknown[]): Promise<void> {
    await this.query('UPDATE lessons SET exercises_data = $1 WHERE id = $2', [JSON.stringify(exercises), lessonId]);
  }

  async updateExerciseAnswer(lessonId: string, exerciseId: string, answer: string): Promise<void> {
    await this.query(
      `UPDATE lessons SET exercises_data = (
        SELECT jsonb_agg(
          CASE WHEN elem->>'id' = $2 
          THEN elem || jsonb_build_object('user_answer', $3)
          ELSE elem END
        )
        FROM jsonb_array_elements(exercises_data) elem
      ) WHERE id = $1`,
      [lessonId, exerciseId, answer]
    );
  }

  async saveChatMessages(lessonId: string, messages: unknown[]): Promise<void> {
    await this.query('UPDATE lessons SET chat_messages = $1 WHERE id = $2', [JSON.stringify(messages), lessonId]);
  }

  async addChatMessage(lessonId: string, message: { role: string; content: string }): Promise<void> {
    await this.query(
      `UPDATE lessons SET chat_messages = chat_messages || $1::jsonb WHERE id = $2`,
      [JSON.stringify(message), lessonId]
    );
  }

  async saveReport(lessonId: string, report: unknown): Promise<void> {
    await this.query('UPDATE lessons SET report = $1 WHERE id = $2', [JSON.stringify(report), lessonId]);
  }

  async incrementExercisesAnswered(lessonId: string): Promise<{ answered: number; total: number }> {
    const result = await this.query<{ exercises_answered: number; exercises_total: number }>(
      `UPDATE lessons SET exercises_answered = exercises_answered + 1 
       WHERE id = $1 
       RETURNING exercises_answered, exercises_total`,
      [lessonId]
    );
    return { answered: result.rows[0].exercises_answered, total: result.rows[0].exercises_total };
  }

  async incrementChatQuestionsAnswered(lessonId: string): Promise<{ answered: number; total: number }> {
    const result = await this.query<{ chat_questions_answered: number; chat_questions_total: number }>(
      `UPDATE lessons SET chat_questions_answered = chat_questions_answered + 1 
       WHERE id = $1 
       RETURNING chat_questions_answered, chat_questions_total`,
      [lessonId]
    );
    return { answered: result.rows[0].chat_questions_answered, total: result.rows[0].chat_questions_total };
  }

  async getProgress(lessonId: string): Promise<{
    status: LessonStatus;
    exercises_answered: number;
    exercises_total: number;
    chat_questions_answered: number;
    chat_questions_total: number;
  } | null> {
    const result = await this.query<any>(
      'SELECT status, exercises_answered, exercises_total, chat_questions_answered, chat_questions_total FROM lessons WHERE id = $1',
      [lessonId]
    );
    return result.rows[0] || null;
  }

  async findAllByUser(userId: string, limit = 50): Promise<Lesson[]> {
    const result = await this.query<Lesson>(
      `SELECT * FROM lessons 
       WHERE user_id = $1 
       ORDER BY day DESC 
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }

  async findHistoryByUser(userId: string, page = 1, limit = 20): Promise<{ rows: any[]; total: number }> {
    const offset = (page - 1) * limit;
    
    const [dataResult, countResult] = await Promise.all([
      this.query<any>(
        `SELECT * FROM lesson_history_view
         WHERE user_id = $1 
         ORDER BY day DESC 
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      ),
      this.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM lessons WHERE user_id = $1`,
        [userId]
      )
    ]);

    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10)
    };
  }
}

export const lessonRepository = new LessonRepository();
