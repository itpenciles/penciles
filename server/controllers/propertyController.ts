
import { query } from '../db.js';
import crypto from 'crypto';
import { Property } from '../../types';
import { reevaluatePropertyWithGemini, generateOfferLetter } from '../services/geminiService.js';

// Get all properties for the logged-in user
export const getProperties = async (req: any, res: any) => {
    const userId = req.user?.id;
    try {
        // Fetch ALL properties. The frontend will handle filtering Active vs Deleted.
        // We fetch 'created_at' to allow precise frontend filtering for monthly cycles.
        const result = await query(
            'SELECT id, property_data, created_at FROM properties WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        // The property object is stored in property_data, and we also need the db id and timestamp
        const properties = result.rows.map(row => ({
            ...row.property_data,
            id: row.id.toString(), // Ensure ID is a string for frontend consistency
            createdAt: row.created_at // Pass the server timestamp
        }));
        res.status(200).json(properties);
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ message: 'Failed to fetch properties.' });
    }
};

// Add a new property
export const addProperty = async (req: any, res: any) => {
    const userId = req.user?.id;
    // The property data from the body does not have an ID yet.
    const propertyData: Omit<Property, 'id'> = req.body;

    try {
        // Let the database generate the ID (SERIAL PRIMARY KEY). We don't pass an ID.
        const result = await query(
            'INSERT INTO properties (user_id, property_data) VALUES ($1, $2) RETURNING id, property_data, created_at',
            [userId, propertyData]
        );
        // The returned ID from the database is the source of truth.
        const newProperty = {
            ...result.rows[0].property_data,
            id: result.rows[0].id.toString(), // Ensure ID is a string
            createdAt: result.rows[0].created_at // Pass the server timestamp
        };
        res.status(201).json(newProperty);
    } catch (error) {
        console.error('Error adding property:', error);
        res.status(500).json({ message: 'Failed to add property.' });
    }
};

// Update an existing property
export const updateProperty = async (req: any, res: any) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const propertyData: Property = req.body;

    // Remove the id from the JSONB object if it exists to avoid duplication
    const { id: propertyId, ...dataToStore } = propertyData;

    console.log(`[UpdateProperty] Updating property ${id} for user ${userId}`);
    console.log(`[UpdateProperty] Market Comparables count: ${propertyData.marketComparables?.length || 0} `);

    try {
        // Check for skipReevaluation flag (passed from frontend when just saving comps)
        const skipReevaluation = (req.body as any).skipReevaluation === true;

        let updatedDataToStore = { ...dataToStore };

        if (!skipReevaluation) {
            try {
                // Guard clause: Ensure recommendation object exists before accessing strategy
                const strategyToAnalyze = propertyData.recommendation?.strategyAnalyzed || 'Rental';

                // Step 1: Get a fresh AI recommendation based on the user's changes.
                const newRecommendation = await reevaluatePropertyWithGemini(
                    propertyData,
                    strategyToAnalyze
                );

                // Step 2: Merge the new recommendation into the property data.
                updatedDataToStore = {
                    ...updatedDataToStore,
                    recommendation: newRecommendation,
                };
            } catch (aiError: any) {
                console.warn('[UpdateProperty] AI Re-evaluation failed, saving changes anyway:', aiError.message);
                // If AI fails, we still want to save the user's manual edits (like comps),
                // so we proceed with the original data but maybe add a warning note?
                // For now, just proceeding ensures data isn't lost.
            }
        } else {
            console.log('[UpdateProperty] Skipping AI re-evaluation as requested.');
        }

        // Remove the flag before saving to DB
        delete (updatedDataToStore as any).skipReevaluation;

        // Step 3: Save the fully updated object to the database.
        const result = await query(
            'UPDATE properties SET property_data = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING id, property_data, created_at',
            [updatedDataToStore, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found or user not authorized.' });
        }

        // Step 4: Return the complete, re-evaluated property to the frontend.
        const updatedProperty = {
            ...result.rows[0].property_data,
            id: result.rows[0].id.toString(), // Ensure ID is a string
            createdAt: result.rows[0].created_at
        };
        res.status(200).json(updatedProperty);
    } catch (error: any) {
        console.error('Error updating property:', error);
        // Return specific error message if available from geminiService
        res.status(500).json({ message: error.message || 'Failed to update property.' });
    }
};

// Soft Delete a property
export const deleteProperty = async (req: any, res: any) => {
    const userId = req.user?.id;
    const { id } = req.params;

    try {
        // 1. Fetch existing property data first
        const selectResult = await query(
            'SELECT property_data FROM properties WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (selectResult.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found or user not authorized.' });
        }

        const existingData = selectResult.rows[0].property_data;

        // 2. Add a 'deletedAt' timestamp to the data
        const softDeletedData = {
            ...existingData,
            deletedAt: new Date().toISOString()
        };

        // 3. Update the record instead of hard deleting
        await query(
            'UPDATE properties SET property_data = $1, updated_at = now() WHERE id = $2 AND user_id = $3',
            [softDeletedData, id, userId]
        );

        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({ message: 'Failed to delete property.' });
    }
};

// Generate a unique share link for a property
export const generateShareLink = async (req: any, res: any) => {
    const userId = req.user?.id;
    const { id } = req.params;

    try {
        // 1. Check if property exists and belongs to user
        const checkResult = await query(
            'SELECT id, share_token, is_public FROM properties WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found.' });
        }

        const existingToken = checkResult.rows[0].share_token;

        // 2. If token already exists, just ensure it's public and return it
        if (existingToken) {
            if (!checkResult.rows[0].is_public) {
                await query('UPDATE properties SET is_public = TRUE WHERE id = $1', [id]);
            }
            return res.json({ shareToken: existingToken });
        }

        // 3. Otherwise, generate a new UUID
        // We use pgcrypto's gen_random_uuid() if available, or we can let Postgres handle it if we modify the migration.
        // Actually, easiest is to generate in JS if we don't want to rely on pgcrypto extension being installed.
        // Using crypto.randomUUID() (Node 14.17+)
        const shareToken = crypto.randomUUID();

        await query(
            'UPDATE properties SET share_token = $1, is_public = TRUE WHERE id = $2',
            [shareToken, id]
        );

        res.json({ shareToken });
    } catch (error) {
        console.error('Error generating share link:', error);
        res.status(500).json({ message: 'Failed to generate share link.' });
    }
};

// Get a public property by its share token (No Auth Required)
export const getPublicProperty = async (req: any, res: any) => {
    const { token } = req.params;

    try {
        const result = await query(
            'SELECT id, property_data, created_at, share_token FROM properties WHERE share_token = $1 AND is_public = TRUE',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found or link is disabled.' });
        }

        const row = result.rows[0];

        // Construct the property object. 
        // IMPORTANT: We might want to sanitize this if it contains sensitive user info, 
        // but currently property_data is just the analysis.
        const property = {
            ...row.property_data,
            id: row.id.toString(),
            createdAt: row.created_at,
            shareToken: row.share_token,
            isPublic: true,
            isReadOnly: true // Flag for frontend to disable editing
        };

        res.json(property);
    } catch (error) {
        console.error('Error fetching public property:', error);
        res.status(500).json({ message: 'Failed to fetch property.' });
    }
};

export const generateOffer = async (req: any, res: any) => {
    try {
        const { id } = req.params;
        const offerParams = req.body; // Expects OfferParams structure

        // 1. Get Property Data
        // Ideally we should use the same getProperty logic or query directly
        const result = await query(
            'SELECT property_data FROM properties WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found' });
        }

        const property = result.rows[0].property_data;

        // 2. Generate Offer Letter
        const offerLetter = await generateOfferLetter(property, offerParams);

        // 3. Return the letter
        res.json({ offerLetter });

    } catch (error) {
        console.error('Error generating offer letter:', error);
        res.status(500).json({ message: 'Failed to generate offer letter' });
    }
};
