import { Router } from 'express';
import { getProperties, addProperty, updateProperty, deleteProperty, generateShareLink, getPublicProperty, generateOffer } from '../controllers/propertyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Public route (must be before auth middleware if we want it unprotected, OR separate)
// Actually, since router.use(authMiddleware) is applied at line 8, all routes defined below are protected.
// We need to define the public route BEFORE line 8.

router.get('/public/:token', getPublicProperty);

// All property routes below are protected
router.use(authMiddleware);

router.get('/', getProperties);
router.post('/', addProperty);
router.post('/:id/share', generateShareLink);
router.post('/:id/offer', generateOffer); // New Smart Offer Route
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);

export default router;