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

        const { sub: googleId, email, name, picture: profilePictureUrl } = payload;

        // Check if user exists.
        // We no longer query for profile_picture_url to avoid schema errors for older databases.
        let userResult = await query('SELECT id, name, email FROM users WHERE google_id = $1', [googleId]);
        let user: Omit<User, 'profilePictureUrl'> & { id: string };

        if (userResult.rows.length === 0) {
            // Create a new user without the profile picture URL.
            const newUserResult = await query(
                'INSERT INTO users (google_id, email, name) VALUES ($1, $2, $3) RETURNING id, name, email',
                [googleId, email, name]
            );
            user = newUserResult.rows[0];
        } else {
            // User exists
            user = userResult.rows[0];
        }
        
        // Create JWT. We'll add the profilePictureUrl from the Google payload directly here.
        // It won't be persisted in the DB, but will be available to the client for the session.
        const jwtToken = jwt.sign(
            { id: user.id, name: user.name, email: user.email, profilePictureUrl: profilePictureUrl }, 
            process.env.JWT_SECRET!, 
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token: jwtToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                // We return the profile picture from Google's payload, not the database.
                profilePictureUrl: profilePictureUrl
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
};