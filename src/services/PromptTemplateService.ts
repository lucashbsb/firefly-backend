import {
  promptTemplateRepository,
  phaseConfigRepository,
  curriculumSkillRepository,
  PromptTemplate,
  PhaseConfig,
  CurriculumSkill,
} from '../repositories/PromptTemplateRepository';

interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

interface LessonPromptContext {
  day: number;
  mainTopic: string;
  allowedGrammar: string[];
  forbiddenGrammar: string[];
  weakSkills: string[];
  recommendedSkills: string[];
  skillDistribution: string;
  skillsToAvoid: string[];
  recentLessons: string;
  errorPatterns: string;
  previousReport: string;
}

interface CorrectionPromptContext {
  day: number;
  skillsTaught: string[];
  grammarLevel: string;
  exercises: Array<{
    id: string;
    type: string;
    question: string;
    correct_answer: string;
    student_answer: string;
    targets_skill: string;
  }>;
}

interface ReportPromptContext {
  day: number;
  topic: string;
  skillsTaught: string[];
  totalExercises: number;
  correct: number;
  partial: number;
  wrong: number;
  errorBreakdown: Record<string, number>;
  skillCorrect: Record<string, number>;
  skillErrors: Record<string, number>;
  currentLevel: string;
  streak: number;
  accuracyTrend: string;
  conversationData: string;
}

interface ConversationPromptContext {
  lessonTopic: string;
  lessonTheory: string;
  questionNumber: number;
  previousMessages: Array<{ role: string; content: string }>;
}

class PromptTemplateService {
  private templateCache: Map<string, PromptTemplate[]> = new Map();
  private phaseCache: PhaseConfig[] | null = null;
  private skillCache: Map<string, CurriculumSkill[]> = new Map();

  async getPhaseConfig(day: number): Promise<PhaseConfig> {
    const config = await phaseConfigRepository.findByDay(day);
    if (!config) {
      throw new Error(`No phase configuration found for day ${day}`);
    }
    return config;
  }

  async getSkillsByLevel(level: string): Promise<CurriculumSkill[]> {
    const cacheKey = `level:${level}`;
    if (this.skillCache.has(cacheKey)) {
      return this.skillCache.get(cacheKey)!;
    }

    const skills = await curriculumSkillRepository.findByLevelMax(level);
    this.skillCache.set(cacheKey, skills);
    return skills;
  }

  async getSkillsByLevelRange(levels: string[]): Promise<CurriculumSkill[]> {
    return curriculumSkillRepository.findByLevelRange(levels);
  }

  async getAllowedGrammarForPhase(phase: PhaseConfig): Promise<string[]> {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const targetIndex = levelOrder.indexOf(phase.grammar_target);
    const allowedLevels = levelOrder.slice(0, targetIndex + 1);

    const skills = await curriculumSkillRepository.findByLevelRange(allowedLevels);
    return skills.map((s) => s.name);
  }

  async getForbiddenGrammarForPhase(phase: PhaseConfig): Promise<string[]> {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1'];
    const targetIndex = levelOrder.indexOf(phase.grammar_target);
    const forbiddenLevels = levelOrder.slice(targetIndex + 1);

    if (forbiddenLevels.length === 0) return [];

    const skills = await curriculumSkillRepository.findByLevelRange(forbiddenLevels);
    return skills.map((s) => s.name);
  }

  private renderTemplate(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key];
      if (value === undefined || value === null) return '';
      return String(value);
    });
  }

  private async getTemplateSections(name: string): Promise<PromptTemplate[]> {
    if (this.templateCache.has(name)) {
      return this.templateCache.get(name)!;
    }

    const templates = await promptTemplateRepository.findByName(name);
    this.templateCache.set(name, templates);
    return templates;
  }

  async buildLessonSystemPrompt(): Promise<string> {
    const sections = await this.getTemplateSections('lesson_v4');
    const systemSection = sections.find((s) => s.section === 'system');
    return systemSection?.content || '';
  }

  async buildLessonUserPrompt(context: LessonPromptContext): Promise<string> {
    const phase = await this.getPhaseConfig(context.day);
    const sections = await this.getTemplateSections('lesson_v4');

    const variables: TemplateVariables = {
      day: context.day,
      phase: phase.phase,
      phaseName: phase.level_name,
      grammarTarget: phase.grammar_target,
      explanationLevel: phase.explanation_level,
      focus: phase.focus,
      mainTopic: context.mainTopic,
      allowedGrammar: context.allowedGrammar.join('\n- ') || 'None specified',
      forbiddenGrammar: context.forbiddenGrammar.join('\n- ') || 'None',
      weakSkills: context.weakSkills.length > 0 ? context.weakSkills.join('\n- ') : 'None identified',
      recommendedSkills: context.recommendedSkills.length > 0 ? context.recommendedSkills.join('\n- ') : 'None',
      skillDistribution: context.skillDistribution,
      skillsToAvoid: context.skillsToAvoid.length > 0 ? context.skillsToAvoid.join(', ') : 'None',
      recentLessons: context.recentLessons || 'No previous lessons',
      errorPatterns: context.errorPatterns || 'No error patterns identified',
      previousReport: context.previousReport || 'No previous report available',
    };

    const userSections = sections.filter((s) => s.section !== 'system');
    const parts = userSections.map((section) => this.renderTemplate(section.content, variables));

    return parts.join('\n\n');
  }

  async buildCorrectionSystemPrompt(): Promise<string> {
    const sections = await this.getTemplateSections('correction_v4');
    const systemSection = sections.find((s) => s.section === 'system');
    return systemSection?.content || '';
  }

  async buildCorrectionUserPrompt(context: CorrectionPromptContext): Promise<string> {
    const sections = await this.getTemplateSections('correction_v4');
    const userSection = sections.find((s) => s.section === 'user');
    if (!userSection) return '';

    const exercisesText = context.exercises
      .map(
        (ex) =>
          `[Exercise ${ex.id}]
Type: ${ex.type}
Skill: ${ex.targets_skill}
Question: ${ex.question}
Expected Answer: ${ex.correct_answer}
Student Answer: ${ex.student_answer}`
      )
      .join('\n\n');

    const variables: TemplateVariables = {
      day: context.day,
      skillsTaught: context.skillsTaught.join(', '),
      grammarLevel: context.grammarLevel,
      exerciseCount: context.exercises.length,
      exercises: exercisesText,
    };

    return this.renderTemplate(userSection.content, variables);
  }

  async buildReportSystemPrompt(): Promise<string> {
    const sections = await this.getTemplateSections('report_v4');
    const systemSection = sections.find((s) => s.section === 'system');
    return systemSection?.content || '';
  }

  async buildReportUserPrompt(context: ReportPromptContext): Promise<string> {
    const sections = await this.getTemplateSections('report_v4');
    const userSection = sections.find((s) => s.section === 'user');
    if (!userSection) return '';

    const accuracyRate = context.totalExercises > 0
      ? Math.round((context.correct / context.totalExercises) * 100)
      : 0;

    const errorBreakdownText = Object.entries(context.errorBreakdown)
      .map(([type, count]) => `${type}: ${count}`)
      .join('\n') || 'No errors';

    const skillCorrectText = Object.entries(context.skillCorrect)
      .map(([skill, count]) => `${skill}: ${count} correct`)
      .join('\n') || 'No data';

    const skillErrorsText = Object.entries(context.skillErrors)
      .map(([skill, count]) => `${skill}: ${count} errors`)
      .join('\n') || 'No errors';

    const variables: TemplateVariables = {
      day: context.day,
      topic: context.topic,
      skillsTaught: context.skillsTaught.join(', '),
      totalExercises: context.totalExercises,
      correct: context.correct,
      partial: context.partial,
      wrong: context.wrong,
      accuracyRate,
      errorBreakdown: errorBreakdownText,
      skillCorrect: skillCorrectText,
      skillErrors: skillErrorsText,
      currentLevel: context.currentLevel,
      streak: context.streak,
      accuracyTrend: context.accuracyTrend,
      conversationData: context.conversationData || 'No conversation data',
    };

    return this.renderTemplate(userSection.content, variables);
  }

  async buildConversationSystemPrompt(): Promise<string> {
    const sections = await this.getTemplateSections('conversation_v4');
    const systemSection = sections.find((s) => s.section === 'system');
    return systemSection?.content || '';
  }

  async buildConversationUserPrompt(context: ConversationPromptContext): Promise<string> {
    const sections = await this.getTemplateSections('conversation_v4');
    const userSection = sections.find((s) => s.section === 'user');
    if (!userSection) return '';

    const messagesText = context.previousMessages
      .map((m) => `${m.role === 'assistant' ? 'Teacher' : 'Student'}: ${m.content}`)
      .join('\n') || 'No previous messages';

    const variables: TemplateVariables = {
      lessonTopic: context.lessonTopic,
      lessonTheory: context.lessonTheory.substring(0, 500),
      questionNumber: context.questionNumber,
      previousMessages: messagesText,
    };

    return this.renderTemplate(userSection.content, variables);
  }

  clearCache(): void {
    this.templateCache.clear();
    this.phaseCache = null;
    this.skillCache.clear();
  }
}

export const promptTemplateService = new PromptTemplateService();
