import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { query } from '../db.js';
import { User } from '../../types';

const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

export const handleGoogleLogin = async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
        return res.status(400).json({ message: 'Google token is required.' });
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.VITE_GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.sub || !payload.email) {
            return res.status(400).json({ message: 'Invalid Google token.' });
        }

        // We only care about email and name from Google to avoid schema errors
        const { email, name } = payload;

        // This query now completely ignores `profile_picture_url` to prevent database errors
        // if the column does not exist in the production schema.
        const userUpsertQuery = `
            INSERT INTO users (email, name)
            VALUES ($1, $2)
            ON CONFLICT (email) DO UPDATE 
            SET name = EXCLUDED.name
            RETURNING id, name, email;
        `;

        const userResult = await query(userUpsertQuery, [email, name]);
        // The user object from the DB will not have profile_picture_url
        const user: Omit<User, 'profilePictureUrl'> = userResult.rows[0];
        
        // Create JWT. The profilePictureUrl will be undefined, and the frontend will use its fallback.
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
                // profilePictureUrl is intentionally omitted
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
};