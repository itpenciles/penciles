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

        const { email, name, picture: profilePictureUrl } = payload;

        // The production database seems to be missing the `google_id` column.
        // We will use `email` as the unique identifier for the upsert operation,
        // which is more robust against schema variations.
        const userUpsertQuery = `
            INSERT INTO users (email, name, profile_picture_url)
            VALUES ($1, $2, $3)
            ON CONFLICT (email) DO UPDATE 
            SET name = EXCLUDED.name, profile_picture_url = EXCLUDED.profile_picture_url
            RETURNING id, name, email, profile_picture_url;
        `;

        const userResult = await query(userUpsertQuery, [email, name, profilePictureUrl]);
        const user: User = userResult.rows[0];
        
        // Create JWT with user info from our database
        const jwtToken = jwt.sign(
            { 
                id: user.id, 
                name: user.name, 
                email: user.email, 
                profilePictureUrl: user.profilePictureUrl 
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
                profilePictureUrl: user.profilePictureUrl
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
};