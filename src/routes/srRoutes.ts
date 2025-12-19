import { Router } from 'express';
import { srController } from '../controllers';
import { authenticate, requireOwnership } from '../middlewares/auth';

const router = Router();

router.get('/user/:userId/cards', authenticate, requireOwnership(), (req, res) => srController.getCardsForReview(req, res));
router.post('/user/:userId/cards', authenticate, requireOwnership(), (req, res) => srController.createCard(req, res));
router.post('/user/:userId/cards/:cardId/review', authenticate, requireOwnership(), (req, res) => srController.reviewCard(req, res));
router.get('/user/:userId/stats', authenticate, requireOwnership(), (req, res) => srController.getStats(req, res));
router.post('/user/:userId/cards/from-errors', authenticate, requireOwnership(), (req, res) => srController.createCardsFromErrors(req, res));
router.post('/user/:userId/cards/from-vocabulary', authenticate, requireOwnership(), (req, res) => srController.createCardsFromVocabulary(req, res));

export default router;
