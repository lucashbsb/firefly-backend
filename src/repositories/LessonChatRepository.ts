import { BaseRepository } from './base';

export interface LessonChatMessage {
  id: string;
  lesson_id: string;
  user_id: string;
  role: 'system' | 'assistant' | 'user';
  content: string;
  question_number: number | null;
  is_user_response: boolean;
  created_at: Date;
}

export class LessonChatRepository extends BaseRepository<LessonChatMessage> {
  protected tableName = 'lesson_chat_messages';

  async findByLesson(lessonId: string): Promise<LessonChatMessage[]> {
    const result = await this.query<LessonChatMessage>(
      'SELECT * FROM lesson_chat_messages WHERE lesson_id = $1 ORDER BY created_at ASC',
      [lessonId]
    );
    return result.rows;
  }

  async addMessage(data: {
    lesson_id: string;
    user_id: string;
    role: 'system' | 'assistant' | 'user';
    content: string;
    question_number?: number;
    is_user_response?: boolean;
  }): Promise<string> {
    const result = await this.query<{ id: string }>(
      `INSERT INTO lesson_chat_messages (lesson_id, user_id, role, content, question_number, is_user_response)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [data.lesson_id, data.user_id, data.role, data.content, data.question_number || null, data.is_user_response || false]
    );
    return result.rows[0].id;
  }

  async countUserResponses(lessonId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      'SELECT COUNT(*) FROM lesson_chat_messages WHERE lesson_id = $1 AND is_user_response = true',
      [lessonId]
    );
    return parseInt(result.rows[0].count);
  }

  async getLastAssistantQuestion(lessonId: string): Promise<LessonChatMessage | null> {
    const result = await this.query<LessonChatMessage>(
      `SELECT * FROM lesson_chat_messages 
       WHERE lesson_id = $1 AND role = 'assistant' AND question_number IS NOT NULL
       ORDER BY created_at DESC LIMIT 1`,
      [lessonId]
    );
    return result.rows[0] || null;
  }
}

export const lessonChatRepository = new LessonChatRepository();
