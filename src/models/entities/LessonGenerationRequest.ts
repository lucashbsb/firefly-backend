export interface LessonGenerationRequest {
  user_id: string;
  day: number;
  previous_report?: Record<string, unknown>;
}
