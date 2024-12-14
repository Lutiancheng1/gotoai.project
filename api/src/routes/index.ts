import { Router } from 'express';
import authRoutes from './auth';
import adminRoutes from './admin';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

export default router;
