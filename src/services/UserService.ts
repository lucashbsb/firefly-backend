import {
  userRepository,
  userSettingsRepository,
  userStreakRepository,
  lessonProgressRepository
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
    const completed = await lessonProgressRepository.countCompleted(userId);
    const scores = await lessonProgressRepository.getScores(userId);
    const latestDay = await lessonProgressRepository.getLatestCompletedDay(userId);

    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

    return { completed_lessons: completed, average_score: avgScore, current_day: latestDay };
  }

  async getHistory(userId: string, limit?: number, offset?: number) {
    return lessonProgressRepository.getHistory(userId, limit, offset);
  }

  async getHabitData(userId: string, year: number, month?: number) {
    const streak = await userStreakRepository.findByUserId(userId);
    
    let startDate: string;
    let endDate: string;
    
    if (month !== undefined) {
      startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    } else {
      startDate = `${year}-01-01`;
      endDate = `${year + 1}-01-01`;
    }
    
    const completedDates = await lessonProgressRepository.getCompletedDates(userId, startDate, endDate);
    
    return {
      streak: {
        current: streak?.current_streak || 0,
        longest: streak?.longest_streak || 0,
        last_study_date: streak?.last_study_date || null
      },
      completed_dates: completedDates,
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
