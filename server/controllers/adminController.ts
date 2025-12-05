
import { query } from '../db.js';

export const getAdminStats = async (req: any, res: any) => {
    try {
        const { range } = req.query; // 7, 14, 30, 60, YTD

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
        let graphQuery = '';
        let startDateExpression = '';
        let interval = '1 day';
        let truncType = 'day';
        let dateFormat = 'Mon DD';

        // Determine aggregation based on range
        if (range === 'YTD') {
            // Monthly aggregation for YTD
            interval = '1 month';
            truncType = 'month';
            dateFormat = 'Mon YY';
            startDateExpression = "date_trunc('year', current_date)";
        } else if (range === '30' || range === '60') {
            // Monthly aggregation for 30/60 days (shows current month and previous 1-2 months)
            const months = range === '60' ? 2 : 1;
            interval = '1 month';
            truncType = 'month';
            dateFormat = 'Mon YY';
            startDateExpression = `date_trunc('month', current_date - interval '${months} months')`;
        } else {
            // Daily aggregation for 7/14 days (default)
            const days = range === '14' ? 13 : 6;
            startDateExpression = `current_date - interval '${days} days'`;
        }

        graphQuery = `
            WITH date_series AS (
                SELECT generate_series(
                    ${startDateExpression}, 
                    date_trunc('${truncType}', current_date), 
                    '${interval}'
                )::date AS date
            )
            SELECT 
                to_char(ds.date, '${dateFormat}') as date,
                COALESCE(COUNT(u.id), 0) as count
            FROM date_series ds
            LEFT JOIN users u ON date_trunc('${truncType}', u.created_at)::date = ds.date
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

export const getUsers = async (_req: any, res: any) => {
    try {
        // Include subscription history count to determine status
        const usersQuery = `
            SELECT 
                u.id, u.email, u.name, u.role, 
                COALESCE(u.subscription_tier, 'Free') as subscription_tier,
                u.created_at,
                (SELECT COUNT(*) FROM properties p WHERE p.user_id = u.id) as property_count,
                (SELECT COUNT(*) FROM subscription_history sh WHERE sh.user_id = u.id) as history_count
            FROM users u
            ORDER BY u.created_at DESC
            LIMIT 100
        `;
        const result = await query(usersQuery);

        const users = result.rows.map((u: any) => {
            const tier = u.subscription_tier || 'Free';
            const historyCount = parseInt(u.history_count || 0);

            // Logic: If on Free tier AND has history, they are 'Cancelled'. Otherwise 'Active'.
            // Paid users are always Active. Free users with no history are Active (Freemium).
            let status = 'Active';
            if (tier === 'Free' && historyCount > 0) {
                status = 'Cancelled';
            }

            return {
                id: u.id,
                email: u.email,
                name: u.name,
                role: u.role,
                subscriptionTier: tier,
                createdAt: new Date(u.created_at).toLocaleDateString(),
                propertyCount: parseInt(u.property_count || 0),
                monthlyVal: getPrice(tier, 'monthly'),
                annualVal: getPrice(tier, 'annual'),
                status: status
            };
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
};

export const getUserDetail = async (req: any, res: any) => {
    const { id } = req.params;
    try {
        // 1. Basic user info
        const userQuery = `SELECT id, login_count, last_login_at, csv_export_count, report_download_count, subscription_tier, created_at, updated_at FROM users WHERE id = $1`;
        const userRes = await query(userQuery, [id]);

        if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        const u = userRes.rows[0];

        // 2. Strategy usage
        const strategyQuery = `
            SELECT 
                property_data->'recommendation'->>'strategyAnalyzed' as strategy,
                COUNT(*) as count
            FROM properties 
            WHERE user_id = $1 
            GROUP BY strategy
        `;
        const strategyRes = await query(strategyQuery, [id]);

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

        // 3. Billing History & Summary Construction
        const historyQuery = `SELECT * FROM subscription_history WHERE user_id = $1 ORDER BY created_at DESC`;
        const historyRes = await query(historyQuery, [id]);

        // Mock Data Helpers (Since DB doesn't store card info yet)
        const MOCK_CARDS = ['Visa', 'MasterCard', 'Amex'];
        const getRandomCard = () => MOCK_CARDS[Math.floor(Math.random() * MOCK_CARDS.length)];
        const getRandomLast4 = () => Math.floor(1000 + Math.random() * 9000).toString();

        const billingHistory = historyRes.rows.map((row: any) => ({
            id: row.id,
            date: new Date(row.created_at).toLocaleDateString(),
            amount: Number(row.amount),
            billingType: 'Monthly', // Defaulting as current logic is mostly monthly
            cardType: getRandomCard(), // Mock
            last4: getRandomLast4(), // Mock
            status: 'Paid'
        }));

        // Construct Billing Summary
        const isFree = !u.subscription_tier || u.subscription_tier === 'Free';
        const lastChange = historyRes.rows[0];

        // 4. Properties List
        const propsQuery = `
            SELECT id, property_data, created_at 
            FROM properties 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const propsRes = await query(propsQuery, [id]);

        const properties = propsRes.rows.map((row: any) => ({
            ...row.property_data,
            id: row.id,
            address: row.property_data.address, // Address is in property_data
            dateAnalyzed: new Date(row.created_at).toLocaleDateString(),
            createdAt: row.created_at,
            deletedAt: row.property_data.deletedAt ? new Date(row.property_data.deletedAt).toISOString() : undefined
        }));

        // Determine Start Date (First upgrade)
        const startRow = historyRes.rows.slice().reverse().find((r: any) => r.change_type === 'new' || r.change_type === 'upgrade');
        const startDate = startRow ? new Date(startRow.created_at).toLocaleDateString() : new Date(u.created_at).toLocaleDateString();

        // Determine Next Billing or Cancellation
        let nextBillingDate = undefined;
        let cancellationDate = undefined;
        let cancellationReason = undefined;

        if (!isFree) {
            const updated = new Date(u.updated_at || new Date());
            updated.setMonth(updated.getMonth() + 1);
            nextBillingDate = updated.toLocaleDateString();
        } else if (lastChange && (lastChange.change_type === 'cancel' || lastChange.change_type === 'downgrade')) {
            cancellationDate = new Date(lastChange.created_at).toLocaleDateString();
            cancellationReason = "User requested cancellation"; // Generic reason
        }

        const billingSummary = {
            status: isFree ? (historyRes.rows.length > 0 ? 'Cancelled' : 'Active') : 'Active',
            plan: u.subscription_tier || 'Free',
            billingType: 'Monthly',
            startDate: startDate,
            nextBillingDate: nextBillingDate,
            cancellationDate: cancellationDate,
            cancellationReason: cancellationReason
        };

        res.json({
            activity: {
                logins: u.login_count || 0,
                lastLogin: u.last_login_at ? new Date(u.last_login_at).toLocaleDateString() + ' ' + new Date(u.last_login_at).toLocaleTimeString() : 'Never',
                exports: u.csv_export_count || 0,
                downloads: u.report_download_count || 0
            },
            strategyUsage: strategies,
            billingSummary: billingSummary,
            billingHistory: billingHistory,
            properties: properties
        });

    } catch (error) {
        console.error('Error fetching user detail:', error);
        res.status(500).json({ message: 'Server error fetching user detail' });
    }
};

export const cancelUserSubscription = async (req: any, res: any) => {
    const { id } = req.params;
    try {
        const userRes = await query('SELECT subscription_tier FROM users WHERE id = $1', [id]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found' });

        const oldTier = userRes.rows[0].subscription_tier || 'Free';

        if (oldTier === 'Free') {
            return res.status(400).json({ message: 'User is already on Free plan' });
        }

        await query(
            'UPDATE users SET subscription_tier = $1, updated_at = now(), analysis_limit_reset_at = NULL WHERE id = $2',
            ['Free', id]
        );

        await query(
            `INSERT INTO subscription_history (user_id, old_tier, new_tier, change_type, amount) VALUES ($1, $2, $3, $4, $5)`,
            [id, oldTier, 'Free', 'cancel', 0]
        );

        res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
    }
};

export const togglePropertyStatus = async (req: any, res: any) => {
    const { id } = req.params;
    const { status } = req.body; // 'Active' or 'Inactive'

    try {
        // 1. Fetch existing data
        const selectRes = await query('SELECT property_data FROM properties WHERE id = $1', [id]);
        if (selectRes.rows.length === 0) return res.status(404).json({ message: 'Property not found' });

        const propertyData = selectRes.rows[0].property_data;

        // 2. Modify deletedAt
        if (status === 'Active') {
            delete propertyData.deletedAt;
        } else {
            propertyData.deletedAt = new Date().toISOString();
        }

        // 3. Update DB
        await query('UPDATE properties SET property_data = $1 WHERE id = $2', [propertyData, id]);

        res.json({ message: `Property status updated to ${status}` });
    } catch (error) {
        console.error('Error updating property status:', error);
        res.status(500).json({ message: 'Server error updating property status' });
    }
};

const getPrice = (tier: string, period: 'monthly' | 'annual') => {
    const prices = { 'Free': 0, 'Starter': 9, 'Pro': 29, 'Team': 79 };
    // @ts-ignore
    const base = prices[tier] || 0;
    return period === 'monthly' ? base : base * 10; // approx annual
};
