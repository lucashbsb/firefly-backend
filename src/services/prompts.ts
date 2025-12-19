import { AIMessage } from '../models';
import { promptTemplateService } from './PromptTemplateService';
import {
  phaseConfigRepository,
  curriculumSkillRepository,
  PhaseConfig,
} from '../repositories/PromptTemplateRepository';

export interface LearningContext {
  user_id: string;
  current_day: number;
  current_level: string;
  target_level: string;
  previous_report: any;
  skills_context: {
    mastered: string[];
    learning: string[];
    weak: string[];
    not_started: string[];
    recommended: string[];
  };
  error_patterns: {
    recurring: any[];
    recent: any[];
    by_type: Record<string, number>;
  };
  recent_lessons: any[];
  metrics: {
    weekly: any;
    accuracy_trend: number[];
    streak: number;
  };
  curriculum_skills: any[];
}

interface PhaseConfigLegacy {
  phase: number;
  level: string;
  grammarTarget: string;
  explanationLevel: string;
  focus: string;
  allowedGrammar: string[];
  forbiddenGrammar: string[];
}

async function getPhaseConfigFromDb(day: number): Promise<PhaseConfig> {
  const config = await phaseConfigRepository.findByDay(day);
  if (!config) {
    throw new Error(`No phase configuration found for day ${day}`);
  }
  return config;
}

async function getGrammarUpToLevel(level: string): Promise<string[]> {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const levelIndex = levels.indexOf(level.toUpperCase());
  if (levelIndex === -1) return [];

  const allowedLevels = levels.slice(0, levelIndex + 1);
  const skills = await curriculumSkillRepository.findByLevelRange(allowedLevels);
  return skills.map((s) => s.name);
}

async function getGrammarAboveLevel(level: string): Promise<string[]> {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1'];
  const levelIndex = levels.indexOf(level.toUpperCase());
  if (levelIndex === -1 || levelIndex >= levels.length - 1) return [];

  const forbiddenLevels = levels.slice(levelIndex + 1);
  const skills = await curriculumSkillRepository.findByLevelRange(forbiddenLevels);
  return skills.map((s) => s.name);
}

export async function getPhaseForDay(day: number): Promise<PhaseConfigLegacy> {
  const config = await getPhaseConfigFromDb(day);
  const allowedGrammar = await getGrammarUpToLevel(config.grammar_target);
  const forbiddenGrammar = await getGrammarAboveLevel(config.grammar_target);

  return {
    phase: config.phase,
    level: config.level_name,
    grammarTarget: config.grammar_target,
    explanationLevel: config.explanation_level,
    focus: config.focus,
    allowedGrammar,
    forbiddenGrammar,
  };
}

export async function getCurriculumForDay(day: number): Promise<string> {
  const phase = await getPhaseForDay(day);
  return `Day ${day} - ${phase.level}\nPhase ${phase.phase}\nFocus: ${phase.focus}`;
}

function determineMainTopic(context: LearningContext, phase: PhaseConfigLegacy): string {
  if (context.previous_report?.next_day_focus?.[0]) {
    return context.previous_report.next_day_focus[0];
  }
  if (context.skills_context.weak.length > 0) {
    return context.skills_context.weak[0];
  }
  if (context.skills_context.recommended.length > 0) {
    return context.skills_context.recommended[0];
  }
  return phase.allowedGrammar[0] || 'present_simple';
}

export async function buildLessonSystemPrompt(): Promise<string> {
  return promptTemplateService.buildLessonSystemPrompt();
}

export async function buildLessonUserPrompt(day: number, context: LearningContext): Promise<string> {
  const phase = await getPhaseForDay(day);
  const mainTopic = determineMainTopic(context, phase);

  const weakSkills = context.skills_context.weak.slice(0, 5);
  const recommendedSkills = context.skills_context.recommended.slice(0, 8);
  const recentSkills = context.recent_lessons.flatMap((l) => l.skills_taught || []);
  const skillsToAvoid = [...new Set(recentSkills)].slice(0, 10);

  const hasWeakSkills = weakSkills.length > 0;
  const skillDistribution = hasWeakSkills
    ? '- 50% of exercises (15) should target WEAK_SKILLS\n- 50% of exercises (15) should target RECOMMENDED_SKILLS'
    : '- Distribute exercises evenly across RECOMMENDED_SKILLS\n- No weak skills identified - focus on building new competencies';

  const recentLessonsText =
    context.recent_lessons
      .map((l: any) => `Day ${l.day}: ${l.skills_taught?.join(', ') || 'N/A'}`)
      .join('\n') || 'No previous lessons';

  const errorPatternsText =
    context.error_patterns.recurring.length > 0
      ? context.error_patterns.recurring
          .map((e: any) => `- ${e.error_type}: ${e.occurrence_count} occurrences`)
          .join('\n')
      : 'No error patterns recorded - do not invent errors';

  const previousReportText = context.previous_report
    ? `Score: ${context.previous_report.performance_score}%
Strengths: ${context.previous_report.strengths?.join(', ') || 'Not specified'}
Weaknesses: ${context.previous_report.weaknesses?.join(', ') || 'Not specified'}
Next Focus: ${context.previous_report.next_day_focus?.join(', ') || 'Not specified'}
Perceived Level: ${context.previous_report.perceived_level?.overall || 'Not assessed'}`
    : 'Day 1 - No previous report available';

  return promptTemplateService.buildLessonUserPrompt({
    day,
    mainTopic,
    allowedGrammar: phase.allowedGrammar,
    forbiddenGrammar: phase.forbiddenGrammar,
    weakSkills,
    recommendedSkills,
    skillDistribution,
    skillsToAvoid,
    recentLessons: recentLessonsText,
    errorPatterns: errorPatternsText,
    previousReport: previousReportText,
  });
}

export async function getLessonPrompt(
  day: number,
  curriculum: string,
  previousReport?: Record<string, unknown>
): Promise<string> {
  const phase = await getPhaseForDay(day);
  const reportContext = previousReport
    ? `\n\nPREVIOUS REPORT DATA:\n${JSON.stringify(previousReport, null, 2)}\n\nTarget weaknesses from this report.`
    : '';

  return `Generate a complete lesson for Day ${day}.

GRAMMAR_TARGET_LEVEL: ${phase.grammarTarget}
ALLOWED_GRAMMAR_STRUCTURES: ${phase.allowedGrammar.join(', ')}
FORBIDDEN_GRAMMAR_STRUCTURES: ${phase.forbiddenGrammar.join(', ') || 'None'}

CURRICULUM CONTEXT:
${curriculum}
${reportContext}

Generate exactly 30 exercises:
- Exercises 1-10: difficulty = 1
- Exercises 11-20: difficulty = 2  
- Exercises 21-30: difficulty = 3

Return a JSON object with the lesson structure.`;
}

export async function buildCorrectionSystemPrompt(): Promise<string> {
  return promptTemplateService.buildCorrectionSystemPrompt();
}

export async function buildCorrectionUserPrompt(
  exercises: Array<{
    id: string;
    type: string;
    question: string;
    correct_answer: string;
    student_answer: string;
    targets_skill?: string;
  }>,
  context?: { skills_taught: string[]; day: number; allowed_grammar?: string[] }
): Promise<string> {
  const phase = context?.day ? await getPhaseForDay(context.day) : null;

  return promptTemplateService.buildCorrectionUserPrompt({
    day: context?.day || 0,
    skillsTaught: context?.skills_taught || [],
    grammarLevel: phase?.grammarTarget || 'B1',
    exercises: exercises.map((e) => ({
      id: e.id,
      type: e.type,
      question: e.question,
      correct_answer: e.correct_answer,
      student_answer: e.student_answer,
      targets_skill: e.targets_skill || 'unknown',
    })),
  });
}

export function getCorrectionPrompt(
  exercises: Array<{
    id: string;
    type: string;
    question: string;
    correct_answer: string;
    student_answer: string;
  }>
): Promise<string> {
  return buildCorrectionUserPrompt(exercises);
}

export async function buildConversationSystemPrompt(): Promise<string> {
  return promptTemplateService.buildConversationSystemPrompt();
}

export async function getConversationPrompt(): Promise<string> {
  return promptTemplateService.buildConversationSystemPrompt();
}

export async function buildReportSystemPrompt(): Promise<string> {
  return promptTemplateService.buildReportSystemPrompt();
}

export async function buildReportUserPrompt(
  day: number,
  lessonData: {
    topic: string;
    skills_taught: string[];
    exercise_count: number;
  },
  corrections: {
    correct: number;
    partial: number;
    wrong: number;
    details: Array<{
      id: number;
      is_correct: boolean;
      error_type?: string;
      skill?: string;
    }>;
  },
  context?: LearningContext,
  conversationHistory?: AIMessage[]
): Promise<string> {
  const errorBreakdown: Record<string, number> = {};
  const skillErrors: Record<string, number> = {};
  const skillCorrect: Record<string, number> = {};

  corrections.details.forEach((c) => {
    if (c.error_type) {
      errorBreakdown[c.error_type] = (errorBreakdown[c.error_type] || 0) + 1;
    }
    if (c.skill) {
      if (c.is_correct) {
        skillCorrect[c.skill] = (skillCorrect[c.skill] || 0) + 1;
      } else {
        skillErrors[c.skill] = (skillErrors[c.skill] || 0) + 1;
      }
    }
  });

  const total = lessonData.exercise_count || corrections.details.length;
  const accuracyRate = total > 0 ? Math.round((corrections.correct / total) * 100) : 0;

  return promptTemplateService.buildReportUserPrompt({
    day,
    topic: lessonData.topic,
    skillsTaught: lessonData.skills_taught,
    totalExercises: total,
    correct: corrections.correct,
    partial: corrections.partial,
    wrong: corrections.wrong,
    errorBreakdown,
    skillCorrect,
    skillErrors,
    currentLevel: context?.current_level || 'Unknown',
    streak: context?.metrics.streak || 0,
    accuracyTrend: context?.metrics.accuracy_trend?.length
      ? context.metrics.accuracy_trend.join('% → ') + '%'
      : 'N/A',
    conversationData: conversationHistory?.length
      ? `${conversationHistory.length} turns completed`
      : 'No conversation practice this session',
  });
}

export async function getReportPrompt(
  day: number,
  lesson: Record<string, unknown>,
  answers: Array<{
    question: string;
    student_answer: string;
    correct_answer: string;
    is_correct: boolean;
    feedback?: string;
    error_type?: string;
  }>,
  conversationHistory?: AIMessage[]
): Promise<string> {
  const correct = answers.filter((a) => a.is_correct).length;
  const wrong = answers.filter((a) => !a.is_correct).length;

  return buildReportUserPrompt(
    day,
    {
      topic: (lesson as any).topic || 'Unknown',
      skills_taught: (lesson as any).skills_covered || [],
      exercise_count: answers.length,
    },
    {
      correct,
      partial: 0,
      wrong,
      details: answers.map((a, i) => ({
        id: i + 1,
        is_correct: a.is_correct,
        error_type: a.error_type,
      })),
    },
    undefined,
    conversationHistory
  );
}
