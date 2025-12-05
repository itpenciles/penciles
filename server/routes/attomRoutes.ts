import express from 'express';
import { getComparables } from '../controllers/attomController.js';

const router = express.Router();

router.post('/comparables', getComparables as any);

export default router;
