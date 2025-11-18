import { Request, Response } from 'express';
import { analyzePropertyWithGemini } from '../services/geminiService.js';
import { query } from '../db.js';
import { SubscriptionTier } from '../../types.js';

type AuthRequest = Request & {
    user?: { id: string };
};

export const analyzeProperty = async (req: AuthRequest, res: Response) => {
    const { inputType, value } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'User not authenticated.' });
    }

    if (!inputType || !value) {
        return res.status(400).json({ message: 'inputType and value are required.' });
    }

    if (!['url', 'address', 'coords', 'location'].includes(inputType)) {
        return res.status(400).json({ message: 'Invalid inputType.' });
    }

    try {
        // --- Subscription Limit Check ---
        const userResult = await query('SELECT subscription_tier, analysis_count, analysis_limit_reset_at FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        let { subscription_tier: tier, analysis_count: count, analysis_limit_reset_at: resetAt } = userResult.rows[0];
        
        const limits: { [key in SubscriptionTier]?: number } = { 'Free': 3, 'Starter': 15, 'Pro': 100 };
        const limit = tier === 'Team' ? Infinity : (limits[tier as SubscriptionTier] || 0);
        const isMonthlyPlan = ['Starter', 'Pro'].includes(tier);

        // Check and reset monthly counter if needed
        if (isMonthlyPlan && resetAt && new Date(resetAt) < new Date()) {
            count = 0;
            const newResetDate = new Date();
            newResetDate.setMonth(newResetDate.getMonth() + 1);
            
            await query('UPDATE users SET analysis_count = 0, analysis_limit_reset_at = $1 WHERE id = $2', [newResetDate, userId]);
        }

        if (count >= limit) {
            return res.status(403).json({ message: 'Analysis limit reached. Please upgrade your plan to continue analyzing properties.' });
        }

        // --- Proceed with Analysis ---
        const propertyData = await analyzePropertyWithGemini(inputType, value);

        // --- Increment User's Analysis Count ---
        await query('UPDATE users SET analysis_count = analysis_count + 1 WHERE id = $1', [userId]);

        res.status(200).json(propertyData);

    } catch (error: any) {
        console.error('Error in analysis controller:', error);
        res.status(500).json({ message: error.message || 'Failed to analyze property.' });
    }
};