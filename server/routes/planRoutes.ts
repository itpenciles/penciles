
import { Router } from 'express';
import { getAllPlans, updatePlan, createPlan, deletePlan } from '../controllers/planController.js';
import { adminMiddleware, authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Public route to fetch plans for pricing page
router.get('/', getAllPlans);

// Protected Admin Routes
router.post('/', authMiddleware, adminMiddleware, createPlan);
router.put('/:key', authMiddleware, adminMiddleware, updatePlan);
router.delete('/:key', authMiddleware, adminMiddleware, deletePlan);

export default router;
