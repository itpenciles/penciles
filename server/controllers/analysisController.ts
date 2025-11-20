
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { analyzePropertyWithGemini } from '../services/geminiService.js';
import { query } from '../db.js';

type AuthRequest = ExpressRequest & {
    user?: { id: string };
};

export const analyzeProperty = async (req: AuthRequest, res: ExpressResponse) => {
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
        
        // Fetch dynamic limit from DB
        let limit = 0;
        const planResult = await query('SELECT analysis_limit FROM plans WHERE key = $1', [tier]);
        
        if (planResult.rows.length > 0) {
            const dbLimit = planResult.rows[0].analysis_limit;
            limit = dbLimit === -1 ? Infinity : dbLimit;
        } else {
            // Fallback to hardcoded defaults if plan not in DB
            const limits: { [key: string]: number } = { 'Free': 3, 'Starter': 15, 'Experienced': 40, 'Pro': 100, 'Team': Infinity };
            limit = limits[tier] !== undefined ? limits[tier] : 0;
        }

        const isMonthlyPlan = tier !== 'Free'; // Assuming non-free plans are monthly based

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
