import express from 'express';
import { getComparables } from '../controllers/attomController.js';
const router = express.Router();
router.post('/comparables', getComparables);
export default router;
