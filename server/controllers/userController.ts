import { Request, Response } from 'express';
import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import { User } from '../../types';

// Define a custom request type that includes the authenticated user's info
type AuthRequest = Request & {
    user?: { id: string };
};

export const updateUserSubscription = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { tier } = req.body;

    if (!tier || !['Free', 'Starter', 'Pro', 'Team'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid subscription tier provided.' });
    }

    try {
        const result = await query(
            'UPDATE users SET subscription_tier = $1, updated_at = now() WHERE id = $2 RETURNING id, name, email, profile_picture_url, subscription_tier',
            [tier, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const dbUser = result.rows[0];
        const updatedUser: User = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            profilePictureUrl: dbUser.profile_picture_url,
            subscriptionTier: dbUser.subscription_tier,
        };

        // Issue a new token with the updated subscription tier
        const newToken = jwt.sign(
            { 
                id: updatedUser.id, 
                name: updatedUser.name, 
                email: updatedUser.email,
                profilePictureUrl: updatedUser.profilePictureUrl,
                subscriptionTier: updatedUser.subscriptionTier,
            }, 
            process.env.JWT_SECRET!, 
            { expiresIn: '7d' }
        );

        res.status(200).json({ token: newToken, user: updatedUser });

    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({ message: 'Failed to update subscription.' });
    }
};