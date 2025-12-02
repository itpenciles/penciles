import { Router } from 'express';
import { getProperties, addProperty, updateProperty, deleteProperty } from '../controllers/propertyController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
const router = Router();
// All property routes are protected
router.use(authMiddleware);
router.get('/', getProperties);
router.post('/', addProperty);
router.put('/:id', updateProperty);
router.delete('/:id', deleteProperty);
export default router;
