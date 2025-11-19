
import { Request, Response } from 'express';
import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import { User, SubscriptionTier } from '../../types';

// Define a custom request type that includes the authenticated user's info
type AuthRequest = Request & {
    user?: { id: string; role?: string };
};

const TIER_PRICES = {
    'Free': 0,
    'Starter': 9,
    'Pro': 29,
    'Team': 79
};

export const updateUserSubscription = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { tier } = req.body as { tier: SubscriptionTier };

    if (!tier || !['Free', 'Starter', 'Pro', 'Team'].includes(tier)) {
        return res.status(400).json({ message: 'Invalid subscription tier provided.' });
    }

    try {
        // Get current tier first
        const currentUserResult = await query('SELECT subscription_tier FROM users WHERE id = $1', [userId]);
        if (currentUserResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const oldTier = currentUserResult.rows[0].subscription_tier || 'Free';
        let result;
        const isMonthlyPlan = ['Starter', 'Pro', 'Team'].includes(tier);

        // Calculate change type and amount
        const oldPrice = TIER_PRICES[oldTier as keyof typeof TIER_PRICES] || 0;
        const newPrice = TIER_PRICES[tier as keyof typeof TIER_PRICES] || 0;
        
        let changeType = 'new';
        if (oldTier === 'Free' && tier !== 'Free') changeType = 'new';
        else if (newPrice > oldPrice) changeType = 'upgrade';
        else if (newPrice < oldPrice && tier !== 'Free') changeType = 'downgrade';
        else if (tier === 'Free') changeType = 'cancel';

        const revenueImpact = newPrice;

        if (isMonthlyPlan) {
            // When upgrading to a paid plan, reset their count and set the renewal date
            const newResetDate = new Date();
            newResetDate.setMonth(newResetDate.getMonth() + 1);
            result = await query(
                'UPDATE users SET subscription_tier = $1, updated_at = now(), analysis_count = 0, analysis_limit_reset_at = $2 WHERE id = $3 RETURNING id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at, role',
                [tier, newResetDate, userId]
            );
        } else {
            // For 'Free' plan, we keep the lifetime count but clear the reset date
            result = await query(
                'UPDATE users SET subscription_tier = $1, updated_at = now(), analysis_limit_reset_at = NULL WHERE id = $2 RETURNING id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at, role',
                [tier, userId]
            );
        }

        // Log to history
        if (oldTier !== tier) {
             await query(
                `INSERT INTO subscription_history (user_id, old_tier, new_tier, change_type, amount) VALUES ($1, $2, $3, $4, $5)`,
                [userId, oldTier, tier, changeType, revenueImpact]
            );
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
            role: dbUser.role || 'user'
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
                role: updatedUser.role
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

export const getUserProfile = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    try {
        const result = await query('SELECT id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at, role FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const dbUser = result.rows[0];
        // Normalize nulls if necessary
        dbUser.subscriptionTier = dbUser.subscription_tier;
        dbUser.analysisCount = dbUser.analysis_count;
        dbUser.analysisLimitResetAt = dbUser.analysis_limit_reset_at;
        delete dbUser.subscription_tier;
        delete dbUser.analysis_count;
        delete dbUser.analysis_limit_reset_at;
        
        res.json(dbUser);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
};

export const trackUserAction = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { action } = req.body;

    if (!userId || !action) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    try {
        if (action === 'export_csv') {
            await query('UPDATE users SET csv_export_count = COALESCE(csv_export_count, 0) + 1 WHERE id = $1', [userId]);
        } else if (action === 'print_report') {
             await query('UPDATE users SET report_download_count = COALESCE(report_download_count, 0) + 1 WHERE id = $1', [userId]);
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error tracking action:', error);
        res.status(500).json({ message: 'Error tracking action' });
    }
};
