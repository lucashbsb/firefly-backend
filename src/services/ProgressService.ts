import { DailyReport, CreateReportDTO, ReportSummary } from '../models';
import { 
  reportRepository, 
  lessonProgressRepository, 
  answerRepository, 
  conversationRepository 
} from '../repositories';

interface AnswerFeedback {
  is_correct?: boolean;
  is_partial?: boolean;
  feedback?: string;
  error_type?: string;
}

interface ConversationExchange {
  question: string;
  student_response?: string;
  corrected_response?: string;
  errors?: Record<string, unknown>;
  positives?: Record<string, unknown>;
}

export class ProgressService {
  async recordAnswer(
    userId: string,
    exerciseId: string | null,
    lessonId: string | null,
    answer: string,
    feedback: AnswerFeedback
  ): Promise<string> {
    return answerRepository.create({
      user_id: userId,
      exercise_id: exerciseId || '',
      lesson_id: lessonId || '',
      answer,
      is_correct: feedback.is_correct || false,
      is_partial: feedback.is_partial || false,
      feedback: feedback.feedback || null,
      error_type: feedback.error_type || null
    });
  }

  async recordConversation(
    userId: string, 
    lessonId: string | null, 
    day: number,
    exchange: ConversationExchange
  ): Promise<string> {
    return conversationRepository.create({
      user_id: userId,
      lesson_id: lessonId,
      day,
      question: exchange.question,
      student_response: exchange.student_response || null,
      corrected_response: exchange.corrected_response || null,
      errors: exchange.errors || null,
      positives: exchange.positives || null
    });
  }

  async saveReport(
    userId: string, 
    lessonId: string | null, 
    day: number, 
    report: Partial<CreateReportDTO>
  ): Promise<string> {
    return reportRepository.upsert(userId, day, {
      lesson_id: lessonId,
      performance_score: report.performance_score || 0,
      accuracy_rate: report.accuracy_rate || 0,
      exercises_correct: report.exercises_correct || 0,
      exercises_total: report.exercises_total || 0,
      strengths: report.strengths || [],
      weaknesses: report.weaknesses || [],
      error_breakdown: report.error_breakdown || {},
      skill_scores: report.skill_scores || {},
      conversation_notes: report.conversation_notes || null,
      next_day_focus: report.next_day_focus || [],
      perceived_level: report.perceived_level || null,
      motivational_note: report.motivational_note || null
    });
  }

  async getReport(userId: string, day: number): Promise<DailyReport | null> {
    return reportRepository.findByUserAndDay(userId, day);
  }

  async getReportHistory(userId: string, limit = 30): Promise<ReportSummary[]> {
    const reports = await reportRepository.findHistoryByUser(userId, limit);
    return reports.map(r => ({
      day: r.day,
      performance_score: r.performance_score,
      created_at: r.created_at
    }));
  }

  async getLatestReport(userId: string): Promise<DailyReport | null> {
    return reportRepository.findLatestByUser(userId);
  }

  async updateLessonProgress(
    userId: string,
    lessonId: string | null,
    day: number,
    status: 'not_started' | 'in_progress' | 'completed',
    score?: number,
    correct?: number,
    total?: number
  ): Promise<string> {
    return lessonProgressRepository.upsert({
      user_id: userId,
      lesson_id: lessonId,
      day,
      status,
      score: score ?? null,
      correct_count: correct ?? null,
      total_count: total ?? null
    });
  }

  async getActiveProgress(userId: string) {
    return lessonProgressRepository.findActiveByUser(userId);
  }
}

export const progressService = new ProgressService();
