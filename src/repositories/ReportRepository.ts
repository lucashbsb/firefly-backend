import { BaseRepository } from './base';
import { DailyReport } from '../models/entities';

export class ReportRepository extends BaseRepository<DailyReport> {
  protected tableName = 'daily_reports';

  async findByUserAndDay(userId: string, day: number): Promise<DailyReport | null> {
    const result = await this.query<DailyReport>(
      'SELECT * FROM daily_reports WHERE user_id = $1 AND day = $2',
      [userId, day]
    );
    return result.rows[0] || null;
  }

  async findLatestByUser(userId: string): Promise<DailyReport | null> {
    const result = await this.query<DailyReport>(
      'SELECT * FROM daily_reports WHERE user_id = $1 ORDER BY day DESC LIMIT 1',
      [userId]
    );
    return result.rows[0] || null;
  }

  async findHistoryByUser(userId: string, limit: number): Promise<DailyReport[]> {
    const result = await this.query<DailyReport>(
      'SELECT * FROM daily_reports WHERE user_id = $1 ORDER BY day DESC LIMIT $2',
      [userId, limit]
    );
    return result.rows;
  }

  async upsert(userId: string, day: number, data: Partial<DailyReport>): Promise<string> {
    const existing = await this.findByUserAndDay(userId, day);
    
    if (existing) {
      await this.updateReport(existing.id, data);
      return existing.id;
    }
    
    return this.createReport(userId, day, data);
  }

  private async createReport(userId: string, day: number, data: Partial<DailyReport>): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO daily_reports (
        user_id, lesson_id, day, performance_score, accuracy_rate,
        exercises_correct, exercises_total, strengths, weaknesses,
        error_breakdown, skill_scores, conversation_notes, next_day_focus,
        perceived_level, motivational_note
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id`,
      [
        userId, data.lesson_id, day, data.performance_score, data.accuracy_rate,
        data.exercises_correct, data.exercises_total,
        JSON.stringify(data.strengths || []), JSON.stringify(data.weaknesses || []),
        JSON.stringify(data.error_breakdown || {}), JSON.stringify(data.skill_scores || {}),
        data.conversation_notes, JSON.stringify(data.next_day_focus || []),
        data.perceived_level ? JSON.stringify(data.perceived_level) : null, data.motivational_note
      ]
    );
    return result.rows[0].id;
  }

  private async updateReport(id: string, data: Partial<DailyReport>): Promise<void> {
    await this.query(
      `UPDATE daily_reports SET
        lesson_id = $1, performance_score = $2, accuracy_rate = $3,
        exercises_correct = $4, exercises_total = $5, strengths = $6,
        weaknesses = $7, error_breakdown = $8, skill_scores = $9,
        conversation_notes = $10, next_day_focus = $11, perceived_level = $12,
        motivational_note = $13
       WHERE id = $14`,
      [
        data.lesson_id, data.performance_score, data.accuracy_rate,
        data.exercises_correct, data.exercises_total,
        JSON.stringify(data.strengths || []), JSON.stringify(data.weaknesses || []),
        JSON.stringify(data.error_breakdown || {}), JSON.stringify(data.skill_scores || {}),
        data.conversation_notes, JSON.stringify(data.next_day_focus || []),
        data.perceived_level ? JSON.stringify(data.perceived_level) : null, data.motivational_note, id
      ]
    );
  }
}

export const reportRepository = new ReportRepository();
