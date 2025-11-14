import { Request, Response } from 'express';
import { analyzePropertyWithGemini } from '../services/geminiService';

export const analyzeProperty = async (req: Request, res: Response) => {
    const { inputType, value } = req.body;

    if (!inputType || !value) {
        return res.status(400).json({ message: 'inputType and value are required.' });
    }

    if (!['url', 'address', 'coords', 'location'].includes(inputType)) {
        return res.status(400).json({ message: 'Invalid inputType.' });
    }

    try {
        const propertyData = await analyzePropertyWithGemini(inputType, value);
        res.status(200).json(propertyData);
    } catch (error: any) {
        console.error('Error in analysis controller:', error);
        res.status(500).json({ message: error.message || 'Failed to analyze property.' });
    }
};
