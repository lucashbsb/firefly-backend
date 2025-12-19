import { Router } from 'express';
import { skillController } from '../controllers';
import { authenticate, requireOwnership } from '../middlewares/auth';

const router = Router();

router.get('/', authenticate, (req, res) => skillController.getAll(req, res));
router.get('/user/:userId', authenticate, requireOwnership(), (req, res) => skillController.getUserSkills(req, res));
router.get('/user/:userId/mastered', authenticate, requireOwnership(), (req, res) => skillController.getMastered(req, res));
router.get('/user/:userId/weak', authenticate, requireOwnership(), (req, res) => skillController.getWeak(req, res));
router.get('/user/:userId/categories', authenticate, requireOwnership(), (req, res) => skillController.getByCategory(req, res));
router.post('/user/:userId/track', authenticate, requireOwnership(), (req, res) => skillController.trackPractice(req, res));

export default router;
