
import { query } from '../db.js';
import jwt from 'jsonwebtoken';
import { User, SubscriptionTier } from '../../types';

const PAYG_RETAINER = 35;

export const updateUserSubscription = async (req: any, res: any) => {
    const userId = req.user?.id;
    const { tier } = req.body as { tier: SubscriptionTier };

    if (!tier) {
        return res.status(400).json({ message: 'Invalid subscription tier provided.' });
    }

    try {
        // Get current tier first
        const currentUserResult = await query('SELECT subscription_tier, credits FROM users WHERE id = $1', [userId]);
        if (currentUserResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const oldTier = currentUserResult.rows[0].subscription_tier || 'Free';
        let result;
        
        // Fetch Pricing logic from DB
        let oldPrice = 0;
        let newPrice = 0;

        const plansRes = await query('SELECT key, monthly_price FROM plans WHERE key IN ($1, $2)', [oldTier, tier]);
        const planMap = new Map(plansRes.rows.map((r: any) => [r.key, r.monthly_price]));
        
        if (planMap.has(oldTier)) oldPrice = Number(planMap.get(oldTier));
        if (planMap.has(tier)) newPrice = Number(planMap.get(tier));
        
        // Fallback if DB fetch fails (legacy hardcoded)
        if (plansRes.rows.length === 0) {
             const TIER_PRICES = { 'Free': 0, 'Starter': 9, 'Pro': 29, 'Team': 79, 'PayAsYouGo': 0 };
             // @ts-ignore
             oldPrice = TIER_PRICES[oldTier] || 0;
             // @ts-ignore
             newPrice = TIER_PRICES[tier] || 0;
        }

        const isMonthlyPlan = tier !== 'Free' && tier !== 'PayAsYouGo';

        let changeType = 'new';
        if (oldTier === 'Free' && tier !== 'Free') changeType = 'new';
        else if (newPrice > oldPrice) changeType = 'upgrade';
        else if (newPrice < oldPrice && tier !== 'Free') changeType = 'downgrade';
        else if (tier === 'Free') changeType = 'cancel';

        let revenueImpact = newPrice;

        // --- CRITICAL FIX: Calculate actual usage ---
        // Instead of resetting to 0, we count the user's ACTIVE (non-deleted) properties.
        // This ensures that if a user has 4 items and upgrades to a 15-item plan, their usage shows 4/15, not 0/15.
        const countResult = await query(
            `SELECT COUNT(*) FROM properties WHERE user_id = $1 AND (property_data->>'deletedAt') IS NULL`, 
            [userId]
        );
        const currentActiveCount = parseInt(countResult.rows[0].count || '0');


        if (tier === 'PayAsYouGo') {
             // Initial Retainer logic: User switching to PAYG pays $35 immediately and gets credits.
             revenueImpact = PAYG_RETAINER;
             changeType = 'new'; 
             
             // Add the credits immediately and set tier
             // PAYG doesn't use analysis_count for limits, but we sync it anyway for record keeping
             result = await query(
                'UPDATE users SET subscription_tier = $1, updated_at = now(), analysis_count = $2, analysis_limit_reset_at = NULL, credits = credits + $3 WHERE id = $4 RETURNING id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at, role, credits',
                [tier, currentActiveCount, PAYG_RETAINER, userId]
            );
        } else if (isMonthlyPlan) {
            // When upgrading to a paid plan, sync count to actual active properties and set the renewal date
            const newResetDate = new Date();
            newResetDate.setMonth(newResetDate.getMonth() + 1);
            result = await query(
                'UPDATE users SET subscription_tier = $1, updated_at = now(), analysis_count = $2, analysis_limit_reset_at = $3 WHERE id = $4 RETURNING id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at, role, credits',
                [tier, currentActiveCount, newResetDate, userId]
            );
        } else {
            // For 'Free' plan (downgrade or cancel)
            result = await query(
                'UPDATE users SET subscription_tier = $1, updated_at = now(), analysis_count = $2, analysis_limit_reset_at = NULL WHERE id = $3 RETURNING id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at, role, credits',
                [tier, currentActiveCount, userId]
            );
        }

        // Log to history
        if (oldTier !== tier || tier === 'PayAsYouGo') {
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
            role: dbUser.role || 'user',
            credits: Number(dbUser.credits)
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
                credits: updatedUser.credits,
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

// New function to purchase credits
export const purchaseCredits = async (req: any, res: any) => {
    const userId = req.user?.id;
    const { amount } = req.body;

    // Validate increment
    const validIncrements = [35, 70, 140];
    if (!validIncrements.includes(amount)) {
        return res.status(400).json({ message: 'Invalid credit amount. Must be 35, 70, or 140.' });
    }

    try {
        // Update credits
        const result = await query(
            'UPDATE users SET credits = credits + $1, updated_at = now() WHERE id = $2 RETURNING credits',
            [amount, userId]
        );

        // Log transaction
        await query(
            `INSERT INTO subscription_history (user_id, old_tier, new_tier, change_type, amount) VALUES ($1, 'PayAsYouGo', 'PayAsYouGo', 'credit_purchase', $2)`,
            [userId, amount]
        );

        const updatedCredits = Number(result.rows[0].credits);
        res.status(200).json({ credits: updatedCredits, message: 'Credits added successfully.' });
    } catch (error) {
         console.error('Error purchasing credits:', error);
        res.status(500).json({ message: 'Failed to purchase credits.' });
    }
};


export const getUserProfile = async (req: any, res: any) => {
    const userId = req.user?.id;
    try {
        const result = await query('SELECT id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at, credits, role FROM users WHERE id = $1', [userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        const dbUser = result.rows[0];
        const user: User = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            profilePictureUrl: dbUser.profile_picture_url,
            subscriptionTier: dbUser.subscription_tier || null,
            analysisCount: dbUser.analysis_count || 0,
            analysisLimitResetAt: dbUser.analysis_limit_reset_at || null,
            credits: Number(dbUser.credits || 0),
            role: dbUser.role || 'user'
        };
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Failed to fetch user profile' });
    }
};

export const trackUserAction = async (req: any, res: any) => {
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
