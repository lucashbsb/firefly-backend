export interface PreprocessedReportData {
  answersCompact: string;
  wrongAnswersDetailed: string;
  statsPrecomputed: {
    correct: number;
    partial: number;
    wrong: number;
    blank: number;
    total: number;
    accuracyRate: number;
    performanceScore: number;
  };
  skillStats: Record<string, { total: number; correct: number; partial: number; wrong: number }>;
  typeStats: Record<string, { total: number; correct: number; partial: number; wrong: number }>;
  difficultyStats: Record<number, { total: number; correct: number }>;
  errorBreakdown: Record<string, number>;
  conversationCompact: string;
}

export interface ReportGenerationRequest {
  user_id: string;
  day: number;
  lesson: Record<string, unknown>;
  preprocessed: PreprocessedReportData;
}
