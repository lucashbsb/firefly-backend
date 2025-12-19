import {
  userRepository,
  userSettingsRepository,
  userStreakRepository,
  lessonSummaryRepository
} from '../repositories';
import { User, UserStreak } from '../models/entities';
import { UserWithDetailsDTO, CreateUserDTO } from '../dto';
import bcrypt from 'bcryptjs';

export class UserService {
  async create(data: CreateUserDTO & { password?: string }): Promise<UserWithDetailsDTO | null> {
    const passwordHash = await this.hashPassword(data.password || 'changeme');
    const userId = await userRepository.create({ ...data, password_hash: passwordHash });

    await userSettingsRepository.createDefault(userId);
    await userStreakRepository.createDefault(userId);

    return this.findById(userId);
  }

  async findById(id: string): Promise<UserWithDetailsDTO | null> {
    const user = await userRepository.findById(id);
    if (!user) return null;

    const settings = await userSettingsRepository.findByUserId(id);
    const streak = await userStreakRepository.findByUserId(id);

    return { ...user, settings: settings || undefined, streak: streak || undefined };
  }

  async findByEmail(email: string): Promise<(User & { password_hash?: string }) | null> {
    return userRepository.findByEmail(email);
  }

  async updateLevel(userId: string, level: string, perceived?: string): Promise<UserWithDetailsDTO | null> {
    await userRepository.updateLevel(userId, level, perceived);
    return this.findById(userId);
  }

  async updateStreak(userId: string): Promise<{ current: number; longest: number }> {
    const today = new Date().toISOString().split('T')[0];
    const streak = await userStreakRepository.findByUserId(userId);

    if (!streak) return { current: 0, longest: 0 };

    return this.calculateAndUpdateStreak(userId, streak, today);
  }

  private async calculateAndUpdateStreak(
    userId: string,
    streak: UserStreak,
    today: string
  ): Promise<{ current: number; longest: number }> {
    if (!streak.last_study_date) {
      await userStreakRepository.update(userId, { current_streak: 1, longest_streak: 1, last_study_date: today });
      return { current: 1, longest: 1 };
    }

    const diffDays = this.getDaysDifference(streak.last_study_date, today);

    if (diffDays === 0) {
      return { current: streak.current_streak, longest: streak.longest_streak };
    }

    const newCurrent = diffDays === 1 ? streak.current_streak + 1 : 1;
    const newLongest = Math.max(newCurrent, streak.longest_streak);

    await userStreakRepository.update(userId, {
      current_streak: newCurrent,
      longest_streak: newLongest,
      last_study_date: today
    });

    return { current: newCurrent, longest: newLongest };
  }

  private getDaysDifference(lastDate: string, today: string): number {
    const last = new Date(lastDate);
    const current = new Date(today);
    return Math.floor((current.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  }

  async getStreak(userId: string): Promise<UserStreak | null> {
    return userStreakRepository.findByUserId(userId);
  }

  async getProgress(userId: string): Promise<{ completed_lessons: number; average_score: number; current_day: number }> {
    const completed = await lessonSummaryRepository.countCompletedByUser(userId);
    const summaries = await lessonSummaryRepository.getRecentPerformance(userId, 100);
    const avgScore = summaries.length 
      ? Math.round(summaries.reduce((sum, s) => sum + s.performance_score, 0) / summaries.length) 
      : 0;
    const latestDay = summaries.length > 0 ? summaries[0].day : 0;

    return { completed_lessons: completed, average_score: avgScore, current_day: latestDay };
  }

  async getHistory(userId: string, limit = 20, offset = 0) {
    return lessonSummaryRepository.findByUser(userId, limit, offset);
  }

  async getHabitData(userId: string, year: number, month?: number) {
    const streak = await userStreakRepository.findByUserId(userId);
    
    const summaries = await lessonSummaryRepository.findByUser(userId, 365, 0);
    
    let startDate: Date;
    let endDate: Date;
    
    if (month !== undefined) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }
    
    const completedDates = summaries
      .filter(s => s.status === 'completed' && s.completed_at)
      .map(s => new Date(s.completed_at!))
      .filter(d => d >= startDate && d <= endDate)
      .map(d => d.toISOString().split('T')[0]);
    
    return {
      streak: {
        current: streak?.current_streak || 0,
        longest: streak?.longest_streak || 0,
        last_study_date: streak?.last_study_date || null
      },
      completed_dates: [...new Set(completedDates)],
      period: { year, month }
    };
  }

  async findAll(): Promise<User[]> {
    return userRepository.findAllOrdered();
  }

  async validatePassword(email: string, password: string): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user || !user.password_hash) return null;

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return null;

    const { password_hash: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    const hash = await this.hashPassword(newPassword);
    await userRepository.updatePassword(userId, hash);
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}

export const userService = new UserService();
