export interface UserConversation {
  id: string;
  user_id: string;
  lesson_id: string | null;
  day: number | null;
  question: string;
  student_response: string | null;
  corrected_response: string | null;
  errors: Record<string, unknown> | null;
  positives: Record<string, unknown> | null;
  created_at: string;
}
