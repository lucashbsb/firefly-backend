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
}

export const lessonRepository = new LessonRepository();
