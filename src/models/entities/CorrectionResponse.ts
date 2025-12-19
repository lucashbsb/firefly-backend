export interface CorrectionItem {
  exercise_id: string;
  is_correct: boolean;
  is_partial?: boolean;
  student_answer?: string;
  user_answer?: string;
  correct_answer: string;
  feedback: string;
  error_type?: string;
  error_category?: string;
  skill_affected?: string;
  is_l1_interference?: boolean;
  exercise_type?: string;
}

export interface CorrectionResponse {
  corrections: CorrectionItem[];
  summary: {
    total: number;
    correct: number;
    wrong?: number;
    partial?: number;
    accuracy?: number;
    accuracy_rate?: number;
    strengths?: string[];
    weaknesses?: string[];
    error_patterns?: string[];
  };
  conversation_starter?: string;
}
