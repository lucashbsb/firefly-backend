export interface PerceivedLevel {
  overall: string;
  overall_description: string;
  skills: Record<string, { level: string; evidence: string }>;
  passive_level: string;
  active_level: string;
  gap_analysis: string;
  prediction: string;
}
