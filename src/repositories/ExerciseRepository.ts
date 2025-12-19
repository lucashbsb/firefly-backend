import { BaseRepository } from './base';
import { Exercise } from '../models/entities';

export class ExerciseRepository extends BaseRepository<Exercise> {
  protected tableName = 'exercises';

  async findByLessonId(lessonId: string): Promise<Exercise[]> {
    const result = await this.query<Exercise>(
      'SELECT * FROM exercises WHERE lesson_id = $1 ORDER BY position',
      [lessonId]
    );
    return result.rows;
  }

  async deleteByLessonId(lessonId: string): Promise<void> {
    await this.query('DELETE FROM exercises WHERE lesson_id = $1', [lessonId]);
  }

  async createMany(lessonId: string, exercises: Array<Partial<Exercise>>): Promise<void> {
    for (let i = 0; i < exercises.length; i++) {
      await this.createExercise(lessonId, i + 1, exercises[i]);
    }
  }

  private async createExercise(lessonId: string, position: number, data: Partial<Exercise>): Promise<void> {
    await this.query(
      `INSERT INTO exercises (lesson_id, position, type, question, correct_answer, options, hint, explanation, skill_tags, difficulty)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        lessonId, position, data.type, data.question, data.correct_answer || null,
        data.options ? JSON.stringify(data.options) : null, data.hint, data.explanation,
        data.skill_tags ? JSON.stringify(data.skill_tags) : null, data.difficulty || 1
      ]
    );
  }

  async updateCorrectAnswer(exerciseId: string, correctAnswer: string): Promise<void> {
    await this.query(
      'UPDATE exercises SET correct_answer = $1 WHERE id = $2',
      [correctAnswer, exerciseId]
    );
  }
}

export const exerciseRepository = new ExerciseRepository();
