import { Router } from 'express';
import { reportController } from '../controllers';
import { authenticate, requireOwnership } from '../middlewares/auth';

const router = Router();

router.get('/user/:userId/latest', authenticate, requireOwnership(), (req, res) => reportController.getLatest(req, res));
router.get('/user/:userId/day/:day', authenticate, requireOwnership(), (req, res) => reportController.getByDay(req, res));
router.get('/user/:userId/history', authenticate, requireOwnership(), (req, res) => reportController.getHistory(req, res));
router.post('/user/:userId', authenticate, requireOwnership(), (req, res) => reportController.create(req, res));
router.patch('/user/:userId/lesson/:day', authenticate, requireOwnership(), (req, res) => reportController.updateLessonProgress(req, res));

export default router;
