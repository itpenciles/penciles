import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { User } from '../../types';

// Use a single, clearly named constant for the Client ID from environment variables.
const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

export const handleGoogleLogin = async (req: Request, res: Response) => {
    // Add a guard clause at the top of the function for better error reporting.
    if (!GOOGLE_CLIENT_ID) {
        console.error('FATAL: VITE_GOOGLE_CLIENT_ID is not configured on the server.');
        // Provide a clear error message to the frontend.
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

        const { sub: googleId, email, name } = payload;
        
        // This query finds a user by email, and if found, updates their name and links their google_id.
        // If no user is found by email, it inserts a new user with all the details from Google.
        // This robustly handles both new sign-ups and linking Google to an existing email-based account.
        const userUpsertQuery = `
            INSERT INTO users (email, name, google_id, password_hash)
            VALUES ($1, $2, $3, 'oauth_placeholder')
            ON CONFLICT (email) DO UPDATE 
            SET name = EXCLUDED.name,
                google_id = EXCLUDED.google_id
            RETURNING id, name, email;
        `;

        const userResult = await query(userUpsertQuery, [email, name, googleId]);
        const user: Omit<User, 'profilePictureUrl'> = userResult.rows[0];
        
        const jwtToken = jwt.sign(
            { 
                id: user.id, 
                name: user.name, 
                email: user.email,
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
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Server error during authentication. This may be due to an incorrect Google Client ID configuration on the server.' });
    }
};