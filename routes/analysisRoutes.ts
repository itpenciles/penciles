import { Router } from 'express';
import { analyzeProperty } from '../controllers/analysisController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// The analysis route is protected
router.post('/', authMiddleware, analyzeProperty);

export default router;