
import { Request, Response } from 'express';
import { query } from '../db.js';

export const getAdminStats = async (req: Request, res: Response) => {
    try {
        const { range } = req.query; // 7, 14, 30, 60, YTD
        let days = 7;
        if (range === '14') days = 14;
        if (range === '30') days = 30;
        if (range === '60') days = 60;
        if (range === 'YTD') {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 1);
            days = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            days = Math.max(1, days); // Ensure at least 1 day
        }

        // 1. Today's Results
        const todayStatsQuery = `
            SELECT 
                (SELECT COUNT(*) FROM users WHERE created_at::date = current_date) as new_subscribers,
                (SELECT COALESCE(SUM(amount), 0) FROM subscription_history WHERE created_at::date = current_date AND change_type IN ('new', 'upgrade')) as revenue,
                (SELECT COUNT(*) FROM subscription_history WHERE created_at::date = current_date AND change_type = 'upgrade') as upgrades,
                (SELECT COUNT(*) FROM subscription_history WHERE created_at::date = current_date AND change_type = 'downgrade') as downgrades,
                (SELECT COUNT(*) FROM subscription_history WHERE created_at::date = current_date AND change_type = 'cancel') as cancellations
        `;
        const todayResult = await query(todayStatsQuery);

        // 2. Subscribers by Tier
        const tierQuery = `
            SELECT 
                COALESCE(subscription_tier, 'Free') as tier, 
                COUNT(*) as count 
            FROM users 
            GROUP BY subscription_tier
        `;
        const tierResult = await query(tierQuery);
        const tiers = { Free: 0, Starter: 0, Pro: 0, Team: 0 };
        tierResult.rows.forEach((row: any) => {
            if (tiers.hasOwnProperty(row.tier)) {
                // @ts-ignore
                tiers[row.tier] = parseInt(row.count);
            }
        });

        // 3. Subscriber Graph Data
        const graphQuery = `
            WITH date_series AS (
                SELECT generate_series(current_date - interval '${days} days', current_date, '1 day')::date AS date
            )
            SELECT 
                to_char(ds.date, 'Mon DD') as date,
                COALESCE(COUNT(u.id), 0) as count
            FROM date_series ds
            LEFT JOIN users u ON u.created_at::date = ds.date
            GROUP BY ds.date
            ORDER BY ds.date;
        `;
        const graphResult = await query(graphQuery);
        
        // Force integer parsing for counts
        const graphData = graphResult.rows.map(row => ({
            date: row.date,
            count: parseInt(row.count)
        }));

        res.json({
            today: todayResult.rows[0],
            subscribersByTier: tiers,
            subscriberGraph: graphData
        });

    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ message: 'Server error fetching stats' });
    }
};

export const getUsers = async (_req: Request, res: Response) => {
    try {
        const usersQuery = `
            SELECT 
                u.id, u.email, u.name, u.role, 
                COALESCE(u.subscription_tier, 'Free') as subscription_tier,
                u.created_at,
                (SELECT COUNT(*) FROM properties p WHERE p.user_id = u.id) as property_count
            FROM users u
            ORDER BY u.created_at DESC
            LIMIT 100
        `;
        const result = await query(usersQuery);
        
        // FIX: Map snake_case DB fields to camelCase properties for frontend
        const users = result.rows.map((u: any) => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            subscriptionTier: u.subscription_tier, // Map subscription_tier to subscriptionTier
            createdAt: new Date(u.created_at).toLocaleDateString(), // Map created_at to createdAt
            propertyCount: parseInt(u.property_count), // Map property_count to propertyCount
            monthlyVal: getPrice(u.subscription_tier, 'monthly'),
            annualVal: getPrice(u.subscription_tier, 'annual')
        }));

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

export const getUserDetail = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        // Basic activity
        const userQuery = `SELECT login_count, last_login_at, csv_export_count, report_download_count FROM users WHERE id = $1`;
        const userRes = await query(userQuery, [id]);
        
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        const u = userRes.rows[0];

        // Strategy usage
        const strategyQuery = `
            SELECT 
                property_data->'recommendation'->>'strategyAnalyzed' as strategy,
                COUNT(*) as count
            FROM properties 
            WHERE user_id = $1 
            GROUP BY strategy
        `;
        const strategyRes = await query(strategyQuery, [id]);
        
        // Format for chart
        const strategies = [
            { name: 'Rental', count: 0 },
            { name: 'Wholesale', count: 0 },
            { name: 'Subject-To', count: 0 },
            { name: 'Seller Financing', count: 0 }
        ];

        strategyRes.rows.forEach((row: any) => {
            const s = strategies.find(x => x.name === row.strategy || x.name === row.strategy?.replace('-', ' '));
            if (s) s.count = parseInt(row.count);
        });

        res.json({
            activity: {
                logins: u.login_count || 0,
                lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() + ' ' + new Date(u.last_login_at).toLocaleTimeString() : 'Never',
                exports: u.csv_export_count || 0,
                downloads: u.report_download_count || 0
            },
            strategyUsage: strategies
        });

    } catch (error) {
         console.error('Error fetching user detail:', error);
        res.status(500).json({ message: 'Server error fetching user detail' });
    }
};

const getPrice = (tier: string, period: 'monthly' | 'annual') => {
    const prices = { 'Free': 0, 'Starter': 9, 'Pro': 29, 'Team': 79 };
    // @ts-ignore
    const base = prices[tier] || 0;
    return period === 'monthly' ? base : base * 10; // approx annual
};
