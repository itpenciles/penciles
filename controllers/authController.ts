import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { User } from '../../types';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const getClientIdSnippet = (clientId: string | undefined): string => {
    if (!clientId || clientId.length < 10) {
        return "Not defined or too short";
    }
    return `${clientId.substring(0, 4)}...${clientId.substring(clientId.length - 4)}`;
}

export const handleGoogleLogin = async (req: Request, res: Response) => {
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
        
        const userUpsertQuery = `
            INSERT INTO users (email, name, google_id, profile_picture_url, password_hash)
            VALUES ($1, $2, $3, $4, 'oauth_placeholder')
            ON CONFLICT (email) DO UPDATE 
            SET name = EXCLUDED.name,
                google_id = EXCLUDED.google_id,
                profile_picture_url = EXCLUDED.profile_picture_url
            RETURNING id, name, email, profile_picture_url;
        `;

        const userResult = await query(userUpsertQuery, [email, name, googleId, profilePictureUrl]);
        const user: User = userResult.rows[0];
        
        const jwtToken = jwt.sign(
            { 
                id: user.id, 
                name: user.name, 
                email: user.email,
                profilePictureUrl: user.profilePictureUrl,
            }, 
            process.env.JWT_SECRET!, 
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token: jwtToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                profilePictureUrl: user.profilePictureUrl,
            }
        });

    } catch (error: any) {
        console.error('Google login error:', error);
        
        if (error.message && error.message.includes('does not exist')) {
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