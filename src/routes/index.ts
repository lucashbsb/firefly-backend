import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import skillRoutes from './skillRoutes';
import reportRoutes from './reportRoutes';
import srRoutes from './srRoutes';
import aiRoutes from './aiRoutes';
import lessonRoutes from './lessonRoutes';
import metricsRoutes from './metricsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/skills', skillRoutes);
router.use('/reports', reportRoutes);
router.use('/sr', srRoutes);
router.use('/ai', aiRoutes);
router.use('/lessons', lessonRoutes);
router.use('/metrics', metricsRoutes);

export default router;
