
import { Request, Response } from 'express';
import { query } from '../db.js';
import { Plan } from '../../types';

const DEFAULT_PLANS: Plan[] = [
    {
        key: 'Free',
        name: 'Free',
        description: 'For investors just getting started and wanting to try the platform.',
        monthlyPrice: 0,
        annualPrice: 0,
        analysisLimit: 3,
        features: [
            '3 AI Property Analyses (Lifetime)',
            'Standard Rental Analysis',
            'Save Properties to Browser',
        ],
        isPopular: false
    },
    {
        key: 'Starter',
        name: 'Starter',
        description: 'For active investors analyzing a few deals a month.',
        monthlyPrice: 9,
        annualPrice: 90,
        analysisLimit: 15,
        features: [
            '15 AI Property Analyses per Month',
            'Standard Rental Analysis',
            'Property Comparison Tool (up to 4)',
            'Save Properties to Browser',
            'Email Support',
        ],
        isPopular: false
    },
    {
        key: 'Experienced',
        name: 'Experienced',
        description: 'For growing investors analyzing weekly deals and building their portfolio.',
        monthlyPrice: 19,
        annualPrice: 190,
        analysisLimit: 40,
        features: [
            '40 AI Property Analyses per Month',
            'Standard Rental Analysis',
            'Export Data to CSV & PDF',
            'Property Comparison Tool',
            'Email Support',
        ],
        isPopular: true
    },
    {
        key: 'Pro',
        name: 'Pro',
        description: 'For serious investors and small teams who need advanced tools.',
        monthlyPrice: 29,
        annualPrice: 290,
        analysisLimit: 100,
        features: [
            '100 AI Property Analyses per Month',
            'All Creative Finance Calculators',
            'Property Comparison Tool',
            'Save & Export Data',
            'Priority Email Support',
        ],
        isPopular: false
    },
    {
        key: 'Team',
        name: 'Team',
        description: 'For professional teams and brokerages needing high volume.',
        monthlyPrice: 79,
        annualPrice: 790,
        analysisLimit: -1, // Unlimited
        features: [
            'Unlimited AI Property Analyses',
            'All Pro Features Included',
            'Multi-user Access (coming soon)',
            'Dedicated Support',
        ],
        isPopular: false
    }
];

export const getAllPlans = async (_req: Request, res: Response) => {
    try {
        // Check if plans exist
        const checkResult = await query('SELECT count(*) FROM plans');
        const count = parseInt(checkResult.rows[0].count);

        if (count === 0) {
            console.log("Plans table is empty. Seeding default plans...");
            // Seed defaults
            for (const plan of DEFAULT_PLANS) {
                await query(`
                    INSERT INTO plans (key, name, description, monthly_price, annual_price, analysis_limit, features, is_popular)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    ON CONFLICT (key) DO NOTHING
                `, [
                    plan.key,
                    plan.name,
                    plan.description,
                    plan.monthlyPrice,
                    plan.annualPrice,
                    plan.analysisLimit,
                    JSON.stringify(plan.features),
                    plan.isPopular
                ]);
            }
        }

        // Fetch from DB (now populated)
        const result = await query('SELECT key, name, description, monthly_price, annual_price, analysis_limit, features, is_popular FROM plans ORDER BY monthly_price ASC');
        
        const plans = result.rows.map((row: any) => ({
            key: row.key,
            name: row.name,
            description: row.description,
            monthlyPrice: row.monthly_price,
            annualPrice: row.annual_price,
            analysisLimit: row.analysis_limit,
            features: row.features,
            isPopular: row.is_popular
        }));
        
        return res.json(plans);

    } catch (error: any) {
        console.error("Could not fetch plans from DB:", error);
        // Fallback if DB completely fails
        return res.json(DEFAULT_PLANS);
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    const { key } = req.params;
    const planData: Plan = req.body;

    try {
        const queryStr = `
            INSERT INTO plans (key, name, description, monthly_price, annual_price, analysis_limit, features, is_popular)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (key) DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                monthly_price = EXCLUDED.monthly_price,
                annual_price = EXCLUDED.annual_price,
                analysis_limit = EXCLUDED.analysis_limit,
                features = EXCLUDED.features,
                is_popular = EXCLUDED.is_popular
            RETURNING *;
        `;
        
        const values = [
            key,
            planData.name,
            planData.description,
            planData.monthlyPrice,
            planData.annualPrice,
            planData.analysisLimit,
            JSON.stringify(planData.features),
            planData.isPopular
        ];

        const result = await query(queryStr, values);
        res.json(result.rows[0]);

    } catch (error) {
        console.error("Error updating plan:", error);
        res.status(500).json({ message: "Failed to update plan. Ensure 'plans' table exists." });
    }
};

export const createPlan = async (req: Request, res: Response) => {
    return updatePlan(req, res);
};

export const deletePlan = async (req: Request, res: Response) => {
    const { key } = req.params;
    try {
        await query('DELETE FROM plans WHERE key = $1', [key]);
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting plan:", error);
        res.status(500).json({ message: "Failed to delete plan." });
    }
};
