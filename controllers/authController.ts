import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { query } from '../db';
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

        // Check if user exists
        // FIX: Alias profile_picture_url to match the camelCase User type.
        let userResult = await query('SELECT id, name, email, profile_picture_url AS "profilePictureUrl" FROM users WHERE google_id = $1', [googleId]);
        let user: User & { id: string };

        if (userResult.rows.length === 0) {
            // Create a new user
            // FIX: Alias profile_picture_url on return to match the camelCase User type.
            const newUserResult = await query(
                'INSERT INTO users (google_id, email, name, profile_picture_url) VALUES ($1, $2, $3, $4) RETURNING id, name, email, profile_picture_url AS "profilePictureUrl"',
                [googleId, email, name, profilePictureUrl]
            );
            user = newUserResult.rows[0];
        } else {
            // User exists
            user = userResult.rows[0];
        }
        
        // Create JWT
        // FIX: Use camelCase profilePictureUrl to match the property from the aliased query.
        const jwtToken = jwt.sign(
            { id: user.id, name: user.name, email: user.email, profilePictureUrl: user.profilePictureUrl }, 
            process.env.JWT_SECRET!, 
            { expiresIn: '7d' }
        );

        res.status(200).json({
            token: jwtToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                // FIX: Use camelCase profilePictureUrl to match the User type.
                profilePictureUrl: user.profilePictureUrl
            }
        });

    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ message: 'Server error during authentication.' });
    }
};