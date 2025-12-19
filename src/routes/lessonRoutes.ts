import { Router } from 'express';
import { lessonController } from '../controllers';
import { authenticate, requireOwnership } from '../middlewares/auth';
import { asyncHandler } from '../middlewares/errorHandler';

const router = Router();

router.get('/:id', authenticate, asyncHandler((req, res) => lessonController.getLessonById(req, res)));
router.get('/user/:userId/active', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.getActive(req, res)));
router.get('/user/:userId/history', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.getHistory(req, res)));
router.get('/user/:userId/workflow', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.getWorkflowState(req, res)));
router.get('/user/:userId/session', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.getSession(req, res)));
router.post('/user/:userId/start', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.startLesson(req, res)));
router.post('/user/:userId/answer', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.answerExercise(req, res)));
router.post('/user/:userId/submit', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.submitExercises(req, res)));
router.post('/user/:userId/correct', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.correctExercises(req, res)));
router.post('/user/:userId/chat/start', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.startChat(req, res)));
router.post('/user/:userId/chat/answer', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.answerChat(req, res)));
router.get('/user/:userId/report', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.getReport(req, res)));
router.post('/user/:userId/report/regenerate', authenticate, requireOwnership(), asyncHandler((req, res) => lessonController.regenerateReport(req, res)));

export default router;
