
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { query, pool } from '../db.js';
import { User } from '../../types';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const getClientIdSnippet = (clientId: string | undefined): string => {
    if (!clientId || clientId.length < 10) {
        return "Not defined or too short";
    }
    return `${clientId.substring(0, 4)}...${clientId.substring(clientId.length - 4)}`;
}

export const handleGoogleLogin = async (req: any, res: any) => {
    console.log(`[AUTH] handleGoogleLogin triggered. Server is using Google Client ID ending in: ...${getClientIdSnippet(GOOGLE_CLIENT_ID)}`);

    if (!GOOGLE_CLIENT_ID) {
        console.error('FATAL: VITE_GOOGLE_CLIENT_ID is not configured on the server.');
        return res.status(500).json({ message: 'Authentication is not configured correctly on the server. The Google Client ID is missing.' });
    }

    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Google token is required.' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.sub || !payload.email) {
            return res.status(400).json({ message: 'Invalid Google token.' });
        }

        const { sub: googleId, email, name, picture: profilePictureUrl } = payload;
        
        // Upsert user and update login stats
        // We use a CTE (Common Table Expression) or separate queries to ensure we get the user ID for the count sync
        
        // 1. Upsert the user
        const userUpsertQuery = `
            INSERT INTO users (email, name, google_id, profile_picture_url, login_count, last_login_at)
            VALUES ($1, $2, $3, $4, 1, now())
            ON CONFLICT (email) DO UPDATE 
            SET name = EXCLUDED.name,
                google_id = EXCLUDED.google_id,
                profile_picture_url = EXCLUDED.profile_picture_url,
                updated_at = now(),
                login_count = users.login_count + 1,
                last_login_at = now()
            RETURNING id, name, email, profile_picture_url, subscription_tier, analysis_count, analysis_limit_reset_at, role, credits;
        `;

        const userResult = await query(userUpsertQuery, [email, name, googleId, profilePictureUrl]);
        let dbUser = userResult.rows[0];
        
        // 2. [SELF-HEALING] Sync analysis_count for FREE TIER ONLY
        // Free tier is a lifetime limit, so it must equal total historical analyses (including deleted).
        // We do NOT do this for paid tiers because their count resets monthly. Overwriting a monthly count
        // with lifetime history would incorrectly cap them out.
        const isFreeTier = !dbUser.subscription_tier || dbUser.subscription_tier === 'Free';

        if (isFreeTier) {
            try {
                const countResult = await query(
                    `SELECT COUNT(*) FROM properties WHERE user_id = $1`, 
                    [dbUser.id]
                );
                const actualCount = parseInt(countResult.rows[0].count || '0');
                
                // Only update if different to save writes
                if (parseInt(dbUser.analysis_count) !== actualCount) {
                    console.log(`[AUTH] Correcting analysis_count for Free user ${dbUser.email}. DB: ${dbUser.analysis_count}, Real: ${actualCount}`);
                    const updateCountRes = await query(
                        'UPDATE users SET analysis_count = $1 WHERE id = $2 RETURNING analysis_count',
                        [actualCount, dbUser.id]
                    );
                    dbUser.analysis_count = updateCountRes.rows[0].analysis_count;
                }
            } catch (err) {
                console.error("[AUTH] Failed to sync analysis count on login", err);
                // Continue logging in even if sync fails
            }
        }

        const user: User = {
            id: dbUser.id,
            name: dbUser.name,
            email: dbUser.email,
            profilePictureUrl: dbUser.profile_picture_url,
            subscriptionTier: dbUser.subscription_tier || null,
            analysisCount: dbUser.analysis_count,
            analysisLimitResetAt: dbUser.analysis_limit_reset_at,
            credits: dbUser.credits || 0,
            role: dbUser.role || 'user'
        };
        
        const jwtToken = jwt.sign(
            { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                profilePictureUrl: user.profilePictureUrl,
                subscriptionTier: user.subscriptionTier,
                analysisCount: user.analysisCount,
                analysisLimitResetAt: user.analysisLimitResetAt,
                credits: user.credits,
                role: user.role
            }, 
            process.env.JWT_SECRET!, 
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token: jwtToken,
            user: user
        });

    } catch (error: any) {
        console.error('Google login error:', error);

        // Postgres error code for 'undefined_column'
        if (error.code === '42703') {
            const match = error.message.match(/column "([^"]+)"/);
            const missingColumn = match ? match[1] : 'a required column';

            // Check if the missing column is one we expect during setup
            if (['google_id', 'subscription_tier', 'updated_at', 'analysis_count', 'analysis_limit_reset_at', 'role', 'login_count', 'credits'].includes(missingColumn)) {
                const dbHost = pool.options.host || 'unknown host';
                const dbName = pool.options.database || 'unknown database';
                const detailedMessage = `Database Schema Mismatch on '${dbName}@${dbHost}'. The 'users' table is missing the '${missingColumn}' column. Please run the ALTER TABLE script from the README.`;
                
                return res.status(500).json({
                    message: detailedMessage,
                    type: 'DB_SCHEMA_MISMATCH',
                    details: {
                        host: dbHost,
                        database: dbName,
                        column: missingColumn, // Pass the specific column name
                    }
                });
            }
        }
        
        if (error.message && error.message.includes('does not exist')) {
            // This is a more generic fallback now
            return res.status(500).json({
                message: "Database schema error. The application might be connected to the wrong database. Please check your server logs for the connected database name and verify your DATABASE_URL environment variable."
            });
        }
        
        const serverIdSnippet = getClientIdSnippet(GOOGLE_CLIENT_ID);
        res.status(500).json({ 
            message: `Server error during authentication. This may be due to an incorrect Google Client ID configuration on the server. The server is currently configured with a Client ID snippet: ${serverIdSnippet}. Please ensure this matches your settings in the Render dashboard exactly.`
        });
    }
};
