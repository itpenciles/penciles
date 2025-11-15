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

        const { email, name } = payload;
        
        // FIX: This query now includes a placeholder for `password_hash` to satisfy the NOT NULL constraint
        // for users who sign up with Google. This makes the login system compatible with schemas
        // that were originally designed for password-based authentication.
        const userUpsertQuery = `
            INSERT INTO users (email, name, password_hash)
            VALUES ($1, $2, 'oauth_placeholder')
            ON CONFLICT (email) DO UPDATE 
            SET name = EXCLUDED.name
            RETURNING id, name, email;
        `;

        const userResult = await query(userUpsertQuery, [email, name]);
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
        res.status(500).json({ message: 'Server error during authentication.' });
    }
};