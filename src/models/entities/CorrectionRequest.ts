export interface CorrectionRequest {
  user_id: string;
  day: number;
  exercises: Array<{
    id: number;
    type: string;
    question: string;
    correct_answer: string;
    student_answer: string;
  }>;
}
