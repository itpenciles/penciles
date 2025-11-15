import { Response, Request } from 'express';
import { query } from '../db.js';
import { Property } from '../../types';

// FIX: Correctly extend the express.Request type to include the user payload.
// Using an intersection type to ensure all properties from the base Request are included, as `extends` was not working correctly.
type AuthRequest = Request & {
    user?: { id: string };
};

// Get all properties for the logged-in user
export const getProperties = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    try {
        const result = await query(
            'SELECT id, property_data FROM properties WHERE user_id = $1 ORDER BY created_at DESC', 
            [userId]
        );
        // The property object is stored in property_data, and we also need the db id
        const properties = result.rows.map(row => ({
            ...row.property_data,
            id: row.id.toString() // Ensure ID is a string for frontend consistency
        }));
        res.status(200).json(properties);
    } catch (error) {
        console.error('Error fetching properties:', error);
        res.status(500).json({ message: 'Failed to fetch properties.' });
    }
};

// Add a new property
export const addProperty = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    // The property data from the body does not have an ID yet.
    const propertyData: Omit<Property, 'id'> = req.body;

    try {
        // Let the database generate the ID (SERIAL PRIMARY KEY). We don't pass an ID.
        const result = await query(
            'INSERT INTO properties (user_id, property_data) VALUES ($1, $2) RETURNING id, property_data',
            [userId, propertyData]
        );
        // The returned ID from the database is the source of truth.
        const newProperty = {
            ...result.rows[0].property_data,
            id: result.rows[0].id.toString() // Ensure ID is a string, as frontend expects
        };
        res.status(201).json(newProperty);
    } catch (error) {
        console.error('Error adding property:', error);
        res.status(500).json({ message: 'Failed to add property.' });
    }
};

// Update an existing property
export const updateProperty = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;
    const propertyData: Property = req.body;

    // Remove the id from the JSONB object if it exists to avoid duplication
    const { id: propertyId, ...dataToStore } = propertyData;

    try {
        const result = await query(
            'UPDATE properties SET property_data = $1, updated_at = now() WHERE id = $2 AND user_id = $3 RETURNING id, property_data',
            [dataToStore, id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found or user not authorized.' });
        }
        
        const updatedProperty = {
            ...result.rows[0].property_data,
            id: result.rows[0].id.toString() // Ensure ID is a string
        };
        res.status(200).json(updatedProperty);
    } catch (error) {
        console.error('Error updating property:', error);
        res.status(500).json({ message: 'Failed to update property.' });
    }
};

// Delete a property
export const deleteProperty = async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const { id } = req.params;

    try {
        const result = await query(
            'DELETE FROM properties WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Property not found or user not authorized.' });
        }
        res.status(204).send(); // No content
    } catch (error) {
        console.error('Error deleting property:', error);
        res.status(500).json({ message: 'Failed to delete property.' });
    }
};