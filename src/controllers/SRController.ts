import { Request, Response } from 'express';
import { spacedRepetitionService } from '../services';
import { srValidation } from '../validations';

export class SRController {
  async getCardsForReview(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const validation = srValidation.validateLimit(limit);
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.toResponse() });
      return;
    }

    const cards = await spacedRepetitionService.getCardsForReview(userId, limit);
    res.json(cards);
  }

  async createCard(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { card_type, front, back, context, source_type, source_id, skill_tags } = req.body;

    if (!card_type || !front || !back) {
      res.status(400).json({ error: 'card_type, front, and back are required' });
      return;
    }

    const id = await spacedRepetitionService.createCard(userId, {
      card_type,
      front,
      back,
      context,
      source_type,
      source_id,
      skill_tags
    });

    res.status(201).json({ id });
  }

  async reviewCard(req: Request, res: Response): Promise<void> {
    const { userId, cardId } = req.params;
    const { quality } = req.body;

    const validation = srValidation.validateQuality(quality);
    if (!validation.isValid) {
      res.status(400).json({ errors: validation.toResponse() });
      return;
    }

    const result = await spacedRepetitionService.reviewCard(userId, cardId, quality);
    res.json(result);
  }

  async getStats(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const stats = await spacedRepetitionService.getStats(userId);
    res.json(stats);
  }

  async createCardsFromErrors(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { lesson_id, errors } = req.body;

    if (!lesson_id || !errors || !Array.isArray(errors)) {
      res.status(400).json({ error: 'lesson_id and errors array are required' });
      return;
    }

    const ids = await spacedRepetitionService.createCardsFromErrors(userId, lesson_id, errors);
    res.status(201).json({ ids });
  }

  async createCardsFromVocabulary(req: Request, res: Response): Promise<void> {
    const { userId } = req.params;
    const { lesson_id, vocabulary } = req.body;

    if (!lesson_id || !vocabulary || !Array.isArray(vocabulary)) {
      res.status(400).json({ error: 'lesson_id and vocabulary array are required' });
      return;
    }

    const ids = await spacedRepetitionService.createCardsFromVocabulary(userId, lesson_id, vocabulary);
    res.status(201).json({ ids });
  }
}

export const srController = new SRController();
