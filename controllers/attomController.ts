import { Request, Response } from 'express';
import axios from 'axios';
import { getStateName } from '../utils/usStates.js';

const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
// Using V2 Sales Comparables endpoint
const ATTOM_BASE_URL = 'https://api.gateway.attomdata.com/property/v2/salescomparables';

export const getComparables = async (req: Request, res: Response) => {
    try {
        if (!ATTOM_API_KEY) {
            console.error('ATTOM_API_KEY is missing in environment variables.');
            return res.status(500).json({ message: 'ATTOM API key is not configured.' });
        }

        const {
            address,
            distance,
            recency,
            sqft,
            bedrooms,
            bathrooms
        } = req.body;

        if (!address) {
            return res.status(400).json({ message: 'Address is required.' });
        }

        // Parse address string to extract components
        // Expected format: "123 Main St, City, ST 12345"
        let address1 = '';
        let city = '';
        let state = '';
        let zip = '';

        if (typeof address === 'string') {
            const parts = address.split(',').map(p => p.trim());
            if (parts.length >= 3) {
                address1 = parts[0];
                city = parts[1];
                const stateZip = parts[2].split(' ');
                if (stateZip.length >= 2) {
                    state = stateZip[0];
                    zip = stateZip[1];
                } else {
                    state = parts[2]; // Fallback
                }
            } else {
                // Try to handle simpler formats or error
                console.warn("Address format might be insufficient for V2 endpoint:", address);
                address1 = address;
            }
        } else if (typeof address === 'object') {
            address1 = address.street || address.address1 || '';
            city = address.city || '';
            state = address.state || '';
            zip = address.zip || '';
        }

        // Construct URL: /address/{address1}/{city}/{country}/{state}/{zip}
        // We assume Country is US
        const encodedAddress1 = encodeURIComponent(address1);
        const encodedCity = encodeURIComponent(city);
        const encodedState = encodeURIComponent(getStateName(state)); // Use full state name
        const encodedZip = encodeURIComponent(zip);

        const url = `${ATTOM_BASE_URL}/address/${encodedAddress1}/${encodedCity}/US/${encodedState}/${encodedZip}`;

        console.log(`Searching ATTOM V2 at: ${url}`);

        // Construct Query Parameters
        const params: any = {
            searchType: 'Radius',
            miles: distance || 1,
            minComps: 1,
            maxComps: 20,
            include0SalesAmounts: 'true',
            distressed: 'IncludeDistressed',
            ownerOccupied: 'Both',
            saleDateRange: getRecencyMonths(recency),
            lotSizeRange: 2000, // Match user's successful request
        };

        // Map Filters to Ranges
        // Note: These ranges are +/- values relative to the subject property

        if (bedrooms) {
            if (bedrooms === 'Same') params.bedroomsRange = 0;
            else if (bedrooms === '+-1') params.bedroomsRange = 1;
            else if (bedrooms === '+-2') params.bedroomsRange = 2;
        }

        if (bathrooms) {
            if (bathrooms === 'Same') params.bathroomRange = 0;
            else if (bathrooms === '+-1') params.bathroomRange = 1;
        }

        if (sqft) {
            // We don't know the subject sqft here to calculate %, so we use reasonable defaults
            if (sqft === 'Same') params.sqFeetRange = 100;
            else if (sqft === '+-10%') params.sqFeetRange = 300;
            else if (sqft === '+-20%') params.sqFeetRange = 600;
        }

        if (req.body.yearBuilt) {
            // User's successful request used yearBuiltRange=10.
            // We will use this exact parameter to match their success.
            // This assumes the API uses the subject property's year built as the center.
            params.yearBuiltRange = 10;
        }

        // Execute Request
        const response = await axios.get(url, {
            params,
            headers: {
                apikey: ATTOM_API_KEY,
                accept: 'application/json'
            }
        });

        // Parse Response
        const responseData = response.data?.RESPONSE_GROUP?.RESPONSE?.RESPONSE_DATA?.PROPERTY_INFORMATION_RESPONSE_ext?.SUBJECT_PROPERTY_ext?.PROPERTY;

        if (!responseData || !Array.isArray(responseData)) {
            console.log("No properties found in response.");
            return res.json({ comparables: [] });
        }

        // Filter for Comparables (Product_ext === "SalesCompProperties")
        const comparables = responseData
            .filter((p: any) => p.PRODUCT_INFO_ext?.['@Product_ext'] === 'SalesCompProperties')
            .map((p: any) => {
                const comp = p.COMPARABLE_PROPERTY_ext;
                const salesHistory = comp.SALES_HISTORY || {};
                const structure = comp.STRUCTURE || {};
                const identification = comp._IDENTIFICATION || {};

                return {
                    id: identification['@RTPropertyID_ext'],
                    address: `${comp['@_StreetAddress']}, ${comp['@_City']}, ${comp['@_State']} ${comp['@_PostalCode']}`,
                    salePrice: parseFloat(salesHistory['@PropertySalesAmount'] || '0'),
                    saleDate: salesHistory['@TransferDate_ext']?.split('T')[0], // Extract YYYY-MM-DD
                    bedrooms: parseInt(structure['@TotalBedroomCount'] || '0'),
                    bathrooms: parseFloat(structure['@TotalBathroomCount'] || '0'),
                    sqft: parseInt(structure['@GrossLivingAreaSquareFeetCount'] || '0'),
                    distanceMiles: parseFloat(comp['@DistanceFromSubjectPropertyMilesCount'] || '0'),
                    yearBuilt: parseInt(structure.STRUCTURE_ANALYSIS?.['@PropertyStructureBuiltYear'] || '0')
                };
            });

        res.json({ comparables });

    } catch (error: any) {
        console.error('ATTOM API Error Details:');
        console.error('Message:', error.message);
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));

        const apiErrorMessage =
            error.response?.data?.RESPONSE_GROUP?.PRODUCT?.STATUS?.['@_Description'] ||
            error.response?.data?.Response?.status?.msg ||
            error.response?.data?.status?.msg ||
            error.response?.data?.message ||
            error.message;
        res.status(500).json({
            message: `ATTOM API Error: ${apiErrorMessage}`,
            details: error.response?.data
        });
    }
};

function getRecencyMonths(recency: string): number {
    switch (recency) {
        case 'This week': return 1;
        case 'Last 2 weeks': return 1;
        case '4 weeks': return 1;
        case '2 months': return 2;
        case '3 months': return 3;
        case '6 months': return 6;
        case 'YTD': return 12; // Approximation
        default: return 6;
    }
}
