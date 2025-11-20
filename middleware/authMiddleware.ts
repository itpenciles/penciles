
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the standard Express Request interface
export interface AuthRequest extends Request {
    user?: { id: string; role?: string };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role?: string };
        (req as AuthRequest).user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }
};

export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    if (!user) {
        return res.status(401).json({ message: 'Authentication required.' });
    }
    
    if (user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    
    next();
};
