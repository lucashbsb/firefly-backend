import { AIMessage } from './AIMessage';

export interface ReportGenerationRequest {
  user_id: string;
  day: number;
  lesson: Record<string, unknown>;
  answers: Array<{
    question: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    feedback?: string;
    error_type?: string;
  }>;
  conversation_history?: AIMessage[];
}
