import { Router } from 'express';
import { analyzeProperty } from '../controllers/analysisController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// The analysis route is protected
router.post('/', authMiddleware, analyzeProperty);

export default router;
