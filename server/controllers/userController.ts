import { Request, Response } from 'express';
import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import { User, SubscriptionTier } from '../../types';

// Define a custom request type that includes the authenticated user's info
type AuthRequest = Request & {
    user?: { id: string };
};

export const updateUserSubscription = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { tier } = req.body as { tier: SubscriptionTier };

    if (!tier || !['Free', 'Starter', 'Pro', 'Team'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid subscription tier provided.' });
    }

    try {
        let result;
        const isMonthlyPlan = ['Starter', 'Pro', 'Team'].includes(tier);

        if (isMonthlyPlan) {
            // When upgrading to a paid plan, reset their count and set the renewal date
            const newResetDate = new Date();
            newResetDate.setMonth(newResetDate.getMonth() + 1);
            result = await query(
                'UPDATE users SET subscription_tier = $1, updated_at = now(), analysis_count = 0, analysis_limit_reset_at = $2 WHERE id = $3 RETURNING id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at',
                [tier, newResetDate, userId]
            );
        } else {
            // For 'Free' plan, we keep the lifetime count but clear the reset date
            result = await query(
                'UPDATE users SET subscription_tier = $1, updated_at = now(), analysis_limit_reset_at = NULL WHERE id = $2 RETURNING id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at',
                [tier, userId]
            );
        }


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
            analysisCount: dbUser.analysis_count,
            analysisLimitResetAt: dbUser.analysis_limit_reset_at,
        };

        // Issue a new token with the updated subscription tier and usage data
        const newToken = jwt.sign(
            { 
                id: updatedUser.id, 
                name: updatedUser.name, 
                email: updatedUser.email,
                profilePictureUrl: updatedUser.profilePictureUrl,
                subscriptionTier: updatedUser.subscriptionTier,
                analysisCount: updatedUser.analysisCount,
                analysisLimitResetAt: updatedUser.analysisLimitResetAt,
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