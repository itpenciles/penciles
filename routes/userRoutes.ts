
import { Router } from 'express';
import { updateUserSubscription, getUserProfile, trackUserAction } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All user routes are protected
router.use(authMiddleware);

router.get('/me', getUserProfile);
router.put('/subscription', updateUserSubscription);
router.post('/track', trackUserAction);

export default router;
