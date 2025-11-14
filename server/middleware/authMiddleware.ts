import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// FIX: Correctly extend the express.Request type to include the user payload.
// Using an intersection type to ensure all properties from the base Request are included, as `extends` was not working correctly.
type AuthRequest = Request & {
    user?: { id: string };
};

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
        req.user = { id: decoded.id };
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};
