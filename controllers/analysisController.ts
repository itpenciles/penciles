
import { analyzePropertyWithGemini } from '../services/geminiService.js';
import { query } from '../db.js';

const PAYG_COST_PER_ANALYSIS = 7.00;

export const analyzeProperty = async (req: any, res: any) => {
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
        // --- Subscription Limit & Credit Check ---
        const userResult = await query('SELECT subscription_tier, analysis_count, analysis_limit_reset_at, credits, role FROM users WHERE id = $1', [userId]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        let { subscription_tier: tier, analysis_count: count, analysis_limit_reset_at: resetAt, credits, role } = userResult.rows[0];
        
        // Convert to numbers/ensure defaults
        credits = Number(credits || 0);
        count = Number(count || 0);
        
        // ADMIN OVERRIDE: Admins bypass all limits
        if (role !== 'admin') {
            if (tier === 'PayAsYouGo') {
                if (credits < PAYG_COST_PER_ANALYSIS) {
                    return res.status(403).json({ 
                        message: `Insufficient credits. You need $${PAYG_COST_PER_ANALYSIS.toFixed(2)} to run an analysis.` 
                    });
                }
            } else {
                // Standard Plan Logic
                let limit = 0;
                
                // 1. Try to fetch limit from DB Plans table
                const planResult = await query('SELECT analysis_limit FROM plans WHERE key = $1', [tier]);
                
                if (planResult.rows.length > 0) {
                    const dbLimit = planResult.rows[0].analysis_limit;
                    limit = dbLimit === -1 ? Infinity : dbLimit;
                } else {
                    // 2. Fallback to hardcoded defaults if plan not found (safety net)
                    const limits: { [key: string]: number } = { 'Free': 3, 'Starter': 15, 'Experienced': 40, 'Pro': 100, 'Team': Infinity };
                    limit = limits[tier] !== undefined ? limits[tier] : 3; // Default to 3 (Free) if unknown
                }

                // Check for Monthly Reset
                const isMonthlyPlan = tier !== 'Free'; 
                if (isMonthlyPlan && resetAt && new Date(resetAt) < new Date()) {
                    // Reset logic is handled here, but typically we'd want to update the DB immediately
                    // For this request, we treat count as 0
                    count = 0;
                    const newResetDate = new Date();
                    newResetDate.setMonth(newResetDate.getMonth() + 1);
                    await query('UPDATE users SET analysis_count = 0, analysis_limit_reset_at = $1 WHERE id = $2', [newResetDate, userId]);
                }

                // STRICT LIMIT CHECK
                if (limit !== Infinity && count >= limit) {
                    return res.status(403).json({ 
                        message: `Analysis limit reached (${count}/${limit}). Please upgrade your plan to continue.` 
                    });
                }
            }
        }

        // --- Proceed with Analysis ---
        const propertyData = await analyzePropertyWithGemini(inputType, value);

        // --- Post-Analysis Updates ---
        // Only deduct if not admin
        if (role !== 'admin') {
            if (tier === 'PayAsYouGo') {
                // Deduct credits
                await query('UPDATE users SET credits = credits - $1, analysis_count = analysis_count + 1 WHERE id = $2', [PAYG_COST_PER_ANALYSIS, userId]);
            } else {
                // Increment Count
                await query('UPDATE users SET analysis_count = analysis_count + 1 WHERE id = $1', [userId]);
            }
        }

        res.status(200).json(propertyData);

    } catch (error: any) {
        console.error('Error in analysis controller:', error);
        res.status(500).json({ message: error.message || 'Failed to analyze property.' });
    }
};
