import { 
  userSkillRepository, 
  userStreakRepository, 
  skillRepository,
  lessonRepository,
  lessonSummaryRepository
} from '../repositories';
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
      lastLesson,
      recentSummaries,
      streak
    ] = await Promise.all([
      userSkillRepository.findByUser(userId),
      lessonRepository.findByUserAndDay(userId, day - 1),
      lessonSummaryRepository.getRecentPerformance(userId, 5),
      this.getUserStreak(userId)
    ]);

    const lastReport = lastLesson?.report || null;
    
    const getMastery = (s: any) => s.mastery_level ?? s.proficiency ?? 0;
    
    const mastered = userSkills.filter((s: any) => getMastery(s) >= 80).map((s: any) => s.skill_id);
    const learning = userSkills.filter((s: any) => getMastery(s) >= 40 && getMastery(s) < 80).map((s: any) => s.skill_id);
    const weak = userSkills.filter((s: any) => getMastery(s) > 0 && getMastery(s) < 40).map((s: any) => s.skill_id);
    
    const allSkillIds = userSkills.map((s: any) => s.skill_id);
    const dbSkills = allSkillIds.length > 0 ? await skillRepository.findByIds(allSkillIds) : [];
    const dbSkillCodes = dbSkills.map(s => s.code);

    const perceivedLevel = lastReport?.perceived_level as any;
    const currentLevel: string = typeof perceivedLevel === 'string' 
      ? perceivedLevel 
      : perceivedLevel?.overall || 'b1';
    const curriculumSkills = await this.getAllSkillsUpToLevel(currentLevel);
    
    const notStarted = curriculumSkills
      .filter(s => !dbSkillCodes.includes(s.code))
      .map(s => s.code);

    const recommended = this.calculateRecommendedSkills(curriculumSkills, dbSkillCodes, weak, lastReport);

    const accuracyTrend = await lessonSummaryRepository.getAccuracyTrend(userId, 7);

    const errorPatterns = this.extractErrorPatterns(lastLesson);

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
      error_patterns: errorPatterns,
      recent_lessons: recentSummaries.map(s => ({
        day: s.day,
        topic: s.topic,
        accuracy_rate: s.accuracy_rate,
        performance_score: s.performance_score
      })),
      metrics: {
        weekly: {
          lessons_completed: recentSummaries.length,
          avg_accuracy: recentSummaries.length > 0 
            ? recentSummaries.reduce((sum, s) => sum + s.accuracy_rate, 0) / recentSummaries.length 
            : 0
        },
        accuracy_trend: accuracyTrend,
        streak
      },
      curriculum_skills: curriculumSkills.slice(0, 30)
    };
  }

  private extractErrorPatterns(lesson: any): {
    recurring: any[];
    recent: any[];
    by_type: Record<string, number>;
  } {
    if (!lesson?.corrections?.corrections) {
      return { recurring: [], recent: [], by_type: {} };
    }

    const corrections = lesson.corrections.corrections as any[];
    const errorsByType: Record<string, number> = {};
    const recentErrors: any[] = [];

    corrections.forEach(c => {
      if (!c.is_correct && c.error_type) {
        errorsByType[c.error_type] = (errorsByType[c.error_type] || 0) + 1;
        recentErrors.push({
          error_type: c.error_type,
          feedback: c.feedback
        });
      }
    });

    const recurring = Object.entries(errorsByType)
      .filter(([, count]) => count >= 2)
      .map(([type, count]) => ({ error_type: type, count }));

    return {
      recurring,
      recent: recentErrors.slice(0, 10),
      by_type: errorsByType
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

  private async getUserStreak(userId: string): Promise<number> {
    return userStreakRepository.getCurrentStreak(userId);
  }

  async updateSkillFromCorrection(
    userId: string,
    skillCode: string,
    isCorrect: boolean,
    isPartial: boolean
  ): Promise<void> {
    const skill = await skillRepository.findByCode(skillCode);
    if (!skill) return;

    const userSkill = await userSkillRepository.findByUserAndSkill(userId, skill.id);
    
    let masteryDelta = 0;
    if (isCorrect) {
      masteryDelta = 5;
    } else if (isPartial) {
      masteryDelta = 2;
    } else {
      masteryDelta = -3;
    }

    if (userSkill) {
      const newMastery = Math.max(0, Math.min(100, userSkill.mastery_level + masteryDelta));
      await userSkillRepository.updateMastery(userId, skill.id, newMastery);
    } else {
      await userSkillRepository.create({
        user_id: userId,
        skill_id: skill.id,
        mastery_level: Math.max(0, 50 + masteryDelta),
        practice_count: 1,
        correct_count: isCorrect ? 1 : 0
      });
    }
  }
}

export const adaptiveLearningService = new AdaptiveLearningService();
