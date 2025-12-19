export interface CorrectionRequest {
  user_id: string;
  day: number;
  exercises: Array<{
    id: string;
    type: string;
    question: string;
    correct_answer: string;
    student_answer: string;
  }>;
}
