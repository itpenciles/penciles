import { Router } from 'express';
import { updateUserSubscription } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// All user routes are protected
router.use(authMiddleware);

router.put('/subscription', updateUserSubscription);

export default router;