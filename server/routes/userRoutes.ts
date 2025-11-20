

import { Router } from 'express';
import { updateUserSubscription, getUserProfile, trackUserAction, purchaseCredits } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All user routes are protected
router.use(authMiddleware);

router.get('/me', getUserProfile);
router.put('/subscription', updateUserSubscription);
router.post('/track', trackUserAction);
router.post('/credits', purchaseCredits); // New route for top-ups

export default router;
