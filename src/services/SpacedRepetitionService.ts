import { 
  srCardRepository, 
  srCardStateRepository, 
  srReviewRepository 
} from '../repositories';
import { 
  SRCardState, 
  SRCardWithState, 
  CreateCardDTO, 
  SRStats, 
  NextReviewState 
} from '../models';

const MIN_EASE = 1.3;

export class SpacedRepetitionService {
  calculateNextReview(quality: number, cardState: SRCardState): NextReviewState {
    let { ease_factor, interval_days, repetitions } = cardState;

    if (quality < 3) {
      repetitions = 0;
      interval_days = 1;
    } else {
      interval_days = this.calculateNewInterval(repetitions, interval_days, ease_factor);
      repetitions += 1;
    }

    ease_factor = this.calculateNewEaseFactor(ease_factor, quality);

    return {
      ease_factor: Math.round(ease_factor * 100) / 100,
      interval_days,
      repetitions,
      next_review_date: this.calculateNextReviewDate(interval_days),
      status: quality < 3 ? 'learning' : 'review'
    };
  }

  private calculateNewInterval(reps: number, interval: number, ease: number): number {
    if (reps === 0) return 1;
    if (reps === 1) return 6;
    return Math.round(interval * ease);
  }

  private calculateNewEaseFactor(currentEase: number, quality: number): number {
    const newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    return Math.max(newEase, MIN_EASE);
  }

  private calculateNextReviewDate(intervalDays: number): string {
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + intervalDays);
    return nextDate.toISOString().split('T')[0];
  }

  async createCard(userId: string, data: CreateCardDTO): Promise<string> {
    const cardId = await srCardRepository.create(userId, data);
    await srCardStateRepository.createDefault(cardId, userId);
    return cardId;
  }

  async getCardsForReview(userId: string, limit = 20): Promise<SRCardWithState[]> {
    return srCardRepository.getCardsForReview(userId, limit);
  }

  async reviewCard(userId: string, cardId: string, quality: number): Promise<NextReviewState> {
    const cardState = await srCardStateRepository.findByCardAndUser(cardId, userId);
    if (!cardState) throw new Error('Card state not found');

    const newState = this.calculateNextReview(quality, cardState);

    await srReviewRepository.create(
      cardId, 
      userId, 
      quality, 
      cardState.ease_factor, 
      newState.ease_factor, 
      cardState.interval_days, 
      newState.interval_days
    );

    await srCardStateRepository.updateState(cardId, userId, newState);

    return newState;
  }

  async getStats(userId: string): Promise<SRStats> {
    const today = new Date().toISOString().split('T')[0];
    const cards = await srCardStateRepository.getAllByUser(userId);

    return {
      total_cards: cards.length,
      new_cards: cards.filter(c => c.status === 'new').length,
      learning_cards: cards.filter(c => c.status === 'learning').length,
      review_cards: cards.filter(c => c.status === 'review').length,
      due_today: cards.filter(c => c.next_review_date && c.next_review_date <= today).length,
      reviewed_today: await srReviewRepository.countTodayByUser(userId)
    };
  }

  async createCardsFromErrors(
    userId: string, 
    lessonId: string, 
    errors: Array<{ incorrect: string; correct: string; context?: string; skills?: string[] }>
  ): Promise<string[]> {
    const cards: string[] = [];

    for (const error of errors) {
      const cardId = await this.createCard(userId, {
        card_type: 'error_correction',
        front: error.incorrect,
        back: error.correct,
        context: error.context,
        source_type: 'lesson',
        source_id: lessonId,
        skill_tags: error.skills
      });
      cards.push(cardId);
    }

    return cards;
  }

  async createCardsFromVocabulary(
    userId: string, 
    lessonId: string, 
    vocabulary: Array<{ word: string; definition: string; example?: string }>
  ): Promise<string[]> {
    const cards: string[] = [];

    for (const item of vocabulary) {
      const cardId = await this.createCard(userId, {
        card_type: 'vocabulary',
        front: item.word,
        back: item.definition,
        context: item.example,
        source_type: 'lesson',
        source_id: lessonId,
        skill_tags: ['vocabulary']
      });
      cards.push(cardId);
    }

    return cards;
  }
}

export const spacedRepetitionService = new SpacedRepetitionService();
