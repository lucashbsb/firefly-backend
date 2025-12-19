import { Router } from 'express';
import { userController } from '../controllers';
import { authenticate, requirePermission, requireOwnershipById } from '../middlewares/auth';
import { PERMISSION } from '../models';

const router = Router();

router.get('/', authenticate, requirePermission(PERMISSION.USER_LIST), (req, res) => userController.getAll(req, res));
router.post('/', (req, res) => userController.create(req, res));
router.get('/:id', authenticate, requireOwnershipById(), (req, res) => userController.getById(req, res));
router.get('/:id/streak', authenticate, requireOwnershipById(), (req, res) => userController.getStreak(req, res));
router.post('/:id/streak', authenticate, requireOwnershipById(), (req, res) => userController.updateStreak(req, res));
router.get('/:id/progress', authenticate, requireOwnershipById(), (req, res) => userController.getProgress(req, res));
router.get('/:id/history', authenticate, requireOwnershipById(), (req, res) => userController.getHistory(req, res));
router.get('/:id/habits', authenticate, requireOwnershipById(), (req, res) => userController.getHabits(req, res));
router.patch('/:id/level', authenticate, requireOwnershipById(), (req, res) => userController.updateLevel(req, res));

export default router;
