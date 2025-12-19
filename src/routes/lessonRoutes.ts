import { Router } from 'express';
import { lessonController } from '../controllers';
import { authenticate, requireOwnership } from '../middlewares/auth';

const router = Router();

router.get('/user/:userId/workflow', authenticate, requireOwnership(), (req, res) => lessonController.getWorkflowState(req, res));
router.get('/user/:userId/session', authenticate, requireOwnership(), (req, res) => lessonController.getSession(req, res));
router.post('/user/:userId/start', authenticate, requireOwnership(), (req, res) => lessonController.startLesson(req, res));
router.post('/user/:userId/answer', authenticate, requireOwnership(), (req, res) => lessonController.answerExercise(req, res));
router.post('/user/:userId/submit', authenticate, requireOwnership(), (req, res) => lessonController.submitExercises(req, res));
router.post('/user/:userId/correct', authenticate, requireOwnership(), (req, res) => lessonController.correctExercises(req, res));
router.post('/user/:userId/chat/start', authenticate, requireOwnership(), (req, res) => lessonController.startChat(req, res));
router.post('/user/:userId/chat/answer', authenticate, requireOwnership(), (req, res) => lessonController.answerChat(req, res));

export default router;
