
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// FIX: Explicitly use Express types to include the user payload.
export interface AuthRequest extends ExpressRequest {
    user?: { id: string; role?: string };
}

export const authMiddleware = (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role?: string };
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

export const adminMiddleware = (req: AuthRequest, res: ExpressResponse, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    next();
};
