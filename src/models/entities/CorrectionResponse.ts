export interface CorrectionItem {
  id: number;
  is_correct: boolean;
  is_partial?: boolean;
  student_answer: string;
  user_answer?: string;
  correct_answer: string;
  feedback: string;
  error_type?: string;
  error_category?: string;
  exercise_type?: string;
}

export interface CorrectionResponse {
  corrections: CorrectionItem[];
  summary: {
    total: number;
    correct: number;
    accuracy: number;
  };
  conversation_starter: string;
}
