import { Router } from 'express';
import { aiController } from '../controllers';
import { authenticate, requireOwnership } from '../middlewares/auth';

const router = Router();

router.get('/user/:userId/settings', authenticate, requireOwnership(), (req, res) => aiController.getSettings(req, res));
router.patch('/user/:userId/settings', authenticate, requireOwnership(), (req, res) => aiController.updateSettings(req, res));

router.post('/user/:userId/lesson', authenticate, requireOwnership(), (req, res) => aiController.generateLesson(req, res));
router.post('/user/:userId/correct', authenticate, requireOwnership(), (req, res) => aiController.correctAnswers(req, res));
router.post('/user/:userId/chat', authenticate, requireOwnership(), (req, res) => aiController.chat(req, res));
router.post('/user/:userId/completion', authenticate, requireOwnership(), (req, res) => aiController.rawCompletion(req, res));

export default router;
