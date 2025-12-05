import { Router } from 'express';
import { handleGoogleLogin } from '../controllers/authController.js';

const router = Router();

router.post('/google', handleGoogleLogin);

export default router;