
import { Router } from 'express';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware.js';
import { getAdminStats, getUsers, getUserDetail, cancelUserSubscription, togglePropertyStatus } from '../controllers/adminController.js';

const router = Router();

// All routes require admin role
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/stats', getAdminStats);
router.get('/users', getUsers);
router.get('/users/:id', getUserDetail);
router.post('/users/:id/cancel', cancelUserSubscription);
router.post('/properties/:id/status', togglePropertyStatus);

export default router;