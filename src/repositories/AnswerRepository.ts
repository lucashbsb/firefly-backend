import { BaseRepository } from './base';
import { UserAnswer } from '../models/entities';

interface CreateAnswerData {
  user_id: string;
  exercise_id: string | null;
  lesson_id: string | null;
  answer: string;
  is_correct: boolean;
  is_partial?: boolean;
  feedback: string | null;
  error_type: string | null;
}

export class AnswerRepository extends BaseRepository<UserAnswer> {
  protected tableName = 'user_answers';

  async findByUserAndExercise(userId: string, exerciseId: string): Promise<UserAnswer | null> {
    const result = await this.query<UserAnswer>(
      'SELECT * FROM user_answers WHERE user_id = $1 AND exercise_id = $2',
      [userId, exerciseId]
    );
    return result.rows[0] || null;
  }

  async create(data: CreateAnswerData): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO user_answers (user_id, exercise_id, lesson_id, answer, is_correct, is_partial, feedback, error_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        data.user_id, 
        data.exercise_id, 
        data.lesson_id,
        data.answer, 
        data.is_correct, 
        data.is_partial || false,
        data.feedback,
        data.error_type
      ]
    );
    return result.rows[0].id;
  }

  async countByUser(userId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      'SELECT COUNT(*) FROM user_answers WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  async countCorrectByUser(userId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      'SELECT COUNT(*) FROM user_answers WHERE user_id = $1 AND is_correct = true',
      [userId]
    );
    return parseInt(result.rows[0].count);
  }

  async findByExerciseIds(exerciseIds: string[]): Promise<UserAnswer[]> {
    if (exerciseIds.length === 0) return [];
    
    const placeholders = exerciseIds.map((_, i) => `$${i + 1}`).join(', ');
    const result = await this.query<UserAnswer>(
      `SELECT * FROM user_answers WHERE exercise_id IN (${placeholders})`,
      exerciseIds
    );
    return result.rows;
  }

  async findByUserAndExerciseIds(userId: string, exerciseIds: string[]): Promise<UserAnswer[]> {
    if (exerciseIds.length === 0) return [];
    
    const placeholders = exerciseIds.map((_, i) => `$${i + 2}`).join(', ');
    const result = await this.query<UserAnswer>(
      `SELECT * FROM user_answers WHERE user_id = $1 AND exercise_id IN (${placeholders})`,
      [userId, ...exerciseIds]
    );
    return result.rows;
  }

  async upsert(data: CreateAnswerData): Promise<string> {
    if (!data.exercise_id) {
      return this.create(data);
    }

    const existing = await this.findByUserAndExercise(data.user_id, data.exercise_id);
    
    if (existing) {
      await this.query(
        `UPDATE user_answers SET answer = $1, is_correct = $2, is_partial = $3, feedback = $4, error_type = $5, updated_at = NOW()
         WHERE user_id = $6 AND exercise_id = $7`,
        [data.answer, data.is_correct, data.is_partial || false, data.feedback, data.error_type, data.user_id, data.exercise_id]
      );
      return existing.id;
    }
    
    return this.create(data);
  }

  async updateCorrection(userId: string, exerciseId: string, data: {
    is_correct: boolean;
    is_partial: boolean;
    feedback: string | null;
    error_type: string | null;
  }): Promise<void> {
    await this.query(
      `UPDATE user_answers SET is_correct = $1, is_partial = $2, feedback = $3, error_type = $4, updated_at = NOW()
       WHERE user_id = $5 AND exercise_id = $6`,
      [data.is_correct, data.is_partial, data.feedback, data.error_type, userId, exerciseId]
    );
  }
}

export const answerRepository = new AnswerRepository();
