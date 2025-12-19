import { userSkillRepository, userStreakRepository } from '../repositories';
import { lessonContentLogRepository } from '../repositories/LessonContentLogRepository';
import { userErrorLogRepository } from '../repositories/UserErrorLogRepository';
import { userLearningMetricsRepository } from '../repositories/UserLearningMetricsRepository';
import { reportRepository } from '../repositories';
import { skillRepository } from '../repositories';
import { UserSkill } from '../models/entities';
import * as fs from 'fs';
import * as path from 'path';

interface SkillData {
  code: string;
  name: string;
  description: string;
  category: string;
  level_min: string;
  level_max: string;
  importance_weight: number;
  difficulty_weight: number;
  examples: string[];
  dependencies: string[];
}

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
  curriculum_skills: SkillData[];
}

export class AdaptiveLearningService {
  private skillsCache: Map<string, SkillData[]> = new Map();

  async loadSkillsForLevel(level: string): Promise<SkillData[]> {
    const normalizedLevel = level.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (this.skillsCache.has(normalizedLevel)) {
      return this.skillsCache.get(normalizedLevel)!;
    }

    const skillsPath = path.join(process.cwd(), '..', 'skills', `${normalizedLevel}.json`);
    
    try {
      const content = fs.readFileSync(skillsPath, 'utf-8');
      const skills = JSON.parse(content) as SkillData[];
      this.skillsCache.set(normalizedLevel, skills);
      return skills;
    } catch {
      return [];
    }
  }

  async getAllSkillsUpToLevel(level: string): Promise<SkillData[]> {
    const levelOrder = ['a1', 'a2', 'b1', 'b2', 'c1'];
    const normalizedLevel = level.toLowerCase().replace(/[^a-z0-9]/g, '');
    const levelIndex = levelOrder.indexOf(normalizedLevel);
    
    if (levelIndex === -1) return [];

    const allSkills: SkillData[] = [];
    for (let i = 0; i <= levelIndex; i++) {
      const skills = await this.loadSkillsForLevel(levelOrder[i]);
      allSkills.push(...skills);
    }
    return allSkills;
  }

  async buildLearningContext(userId: string, day: number): Promise<LearningContext> {
    const [
      userSkills,
      recentErrors,
      recurringErrors,
      errorsByType,
      recentLessons,
      weeklyMetrics,
      lastReport,
      streak
    ] = await Promise.all([
      userSkillRepository.findByUser(userId),
      userErrorLogRepository.getRecentErrors(userId, 7),
      userErrorLogRepository.getRecurringErrors(userId, 5),
      userErrorLogRepository.getErrorsByType(userId),
      lessonContentLogRepository.findRecentByUser(userId, 5),
      userLearningMetricsRepository.getWeeklyStats(userId),
      reportRepository.findByUserAndDay(userId, day - 1),
      this.getUserStreak(userId)
    ]);

    const skillsById = new Map(userSkills.map((s: UserSkill) => [s.skill_id, s]));
    
    const mastered = userSkills.filter((s: UserSkill) => s.mastery_level >= 80).map((s: UserSkill) => s.skill_id);
    const learning = userSkills.filter((s: UserSkill) => s.mastery_level >= 40 && s.mastery_level < 80).map((s: UserSkill) => s.skill_id);
    const weak = userSkills.filter((s: UserSkill) => s.mastery_level > 0 && s.mastery_level < 40).map((s: UserSkill) => s.skill_id);
    
    const allSkillIds = userSkills.map((s: UserSkill) => s.skill_id);
    const dbSkills = await skillRepository.findByIds(allSkillIds);
    const dbSkillCodes = dbSkills.map(s => s.code);

    const currentLevel = lastReport?.perceived_level?.overall || 'b1';
    const curriculumSkills = await this.getAllSkillsUpToLevel(currentLevel);
    
    const notStarted = curriculumSkills
      .filter(s => !dbSkillCodes.includes(s.code))
      .map(s => s.code);

    const recommended = this.calculateRecommendedSkills(curriculumSkills, dbSkillCodes, weak, lastReport);

    const accuracyTrend = await this.getAccuracyTrend(userId, 7);

    return {
      user_id: userId,
      current_day: day,
      current_level: currentLevel,
      target_level: 'c1',
      previous_report: lastReport,
      skills_context: {
        mastered: mastered.slice(0, 20),
        learning: learning.slice(0, 20),
        weak: weak.slice(0, 10),
        not_started: notStarted.slice(0, 15),
        recommended: recommended.slice(0, 10)
      },
      error_patterns: {
        recurring: recurringErrors.slice(0, 5),
        recent: recentErrors.slice(0, 10),
        by_type: errorsByType
      },
      recent_lessons: recentLessons.map(l => ({
        day: l.day,
        skills_taught: l.skills_taught,
        exercise_count: l.exercise_count,
        ai_recommendations: l.ai_recommendations
      })),
      metrics: {
        weekly: weeklyMetrics,
        accuracy_trend: accuracyTrend,
        streak
      },
      curriculum_skills: curriculumSkills.slice(0, 30)
    };
  }

  private calculateRecommendedSkills(
    curriculum: SkillData[],
    practiced: string[],
    weak: string[],
    lastReport: any
  ): string[] {
    const nextFocus = lastReport?.next_day_focus || [];
    const weaknesses = lastReport?.weaknesses || [];
    
    const priority: string[] = [];

    nextFocus.forEach((skill: string) => {
      const found = curriculum.find(s => s.code === skill || s.name.toLowerCase().includes(skill.toLowerCase()));
      if (found) priority.push(found.code);
    });

    weaknesses.forEach((w: any) => {
      if (typeof w === 'string') {
        const found = curriculum.find(s => s.code === w || s.name.toLowerCase().includes(w.toLowerCase()));
        if (found && !priority.includes(found.code)) priority.push(found.code);
      }
    });

    const notPracticed = curriculum
      .filter(s => !practiced.includes(s.code))
      .sort((a, b) => b.importance_weight - a.importance_weight)
      .map(s => s.code);

    return [...new Set([...priority, ...notPracticed])];
  }

  private async getAccuracyTrend(userId: string, days: number): Promise<number[]> {
    const metrics = await userLearningMetricsRepository.getProgressTrend(userId, days);
    return metrics.map(m => m.accuracy_rate || 0);
  }

  private async getUserStreak(userId: string): Promise<number> {
    return userStreakRepository.getCurrentStreak(userId);
  }

  async logLessonContent(data: {
    user_id: string;
    day: number;
    skills_taught: string[];
    skills_practiced: string[];
    exercise_types: Record<string, number>;
    theory_topics: string[];
    vocabulary: string[];
    grammar: string[];
    ai_model?: string;
    ai_provider?: string;
    tokens?: number;
    time_ms?: number;
    recommendations?: any;
  }): Promise<string> {
    return lessonContentLogRepository.create({
      user_id: data.user_id,
      day: data.day,
      skills_taught: data.skills_taught,
      skills_practiced: data.skills_practiced,
      skills_introduced: data.skills_taught.filter(s => !data.skills_practiced.includes(s)),
      exercise_types: data.exercise_types,
      exercise_count: Object.values(data.exercise_types).reduce((a, b) => a + b, 0),
      theory_topics: data.theory_topics,
      vocabulary_introduced: data.vocabulary,
      grammar_focus: data.grammar,
      ai_model: data.ai_model,
      ai_provider: data.ai_provider,
      generation_tokens: data.tokens,
      generation_time_ms: data.time_ms,
      ai_recommendations: data.recommendations || {}
    });
  }

  async updateMetricsFromAnswers(
    userId: string,
    correct: number,
    partial: number,
    wrong: number,
    timeMs?: number
  ): Promise<void> {
    const repo = userLearningMetricsRepository;
    const total = correct + partial + wrong;

    await Promise.all([
      repo.increment(userId, 'exercises_attempted', total),
      repo.increment(userId, 'exercises_correct', correct),
      repo.increment(userId, 'exercises_partial', partial),
      repo.increment(userId, 'exercises_wrong', wrong)
    ]);

    await repo.updateAccuracy(userId);
  }

  async logError(data: {
    user_id: string;
    day: number;
    skill_code?: string;
    exercise_type: string;
    error_type: string;
    error_category?: string;
    user_answer: string;
    correct_answer: string;
  }): Promise<void> {
    let skillId: string | undefined;
    
    if (data.skill_code) {
      const skill = await skillRepository.findByCode(data.skill_code);
      skillId = skill?.id;
    }

    await userErrorLogRepository.logError({
      user_id: data.user_id,
      day: data.day,
      skill_id: skillId,
      exercise_type: data.exercise_type,
      error_type: data.error_type,
      error_category: data.error_category,
      user_answer: data.user_answer,
      correct_answer: data.correct_answer
    });
  }
}

export const adaptiveLearningService = new AdaptiveLearningService();
