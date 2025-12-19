import { Router } from 'express';
import { metricsController } from '../controllers/MetricsController';
import { authenticate, requireOwnership } from '../middlewares/auth';

const router = Router();

router.get('/user/:userId/weekly', authenticate, requireOwnership, metricsController.getWeeklyStats);
router.get('/user/:userId/monthly', authenticate, requireOwnership, metricsController.getMonthlyStats);
router.get('/user/:userId/trend', authenticate, requireOwnership, metricsController.getProgressTrend);
router.get('/user/:userId/errors', authenticate, requireOwnership, metricsController.getErrorPatterns);
router.get('/user/:userId/lessons', authenticate, requireOwnership, metricsController.getLessonHistory);
router.get('/user/:userId/context', authenticate, requireOwnership, metricsController.getLearningContext);
router.get('/user/:userId/dashboard', authenticate, requireOwnership, metricsController.getDashboard);

export default router;
