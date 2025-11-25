import { Request, Response } from 'express';
import axios from 'axios';

const ATTOM_API_KEY = process.env.ATTOM_API_KEY;
const ATTOM_BASE_URL = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

export const getComparables = async (req: Request, res: Response) => {
    try {
        if (!ATTOM_API_KEY) {
            console.error('ATTOM_API_KEY is missing in environment variables.');
            return res.status(500).json({ message: 'ATTOM API key is not configured.' });
        }
        console.log(`ATTOM_API_KEY is configured (Length: ${ATTOM_API_KEY.length})`);

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

        // 1. Geocode the address to get lat/lon (ATTOM needs lat/lon for best results with radius)
        // We can use ATTOM's address endpoint or rely on the frontend passing lat/lon if available.
        // For now, let's assume we might need to geocode if lat/lon isn't provided, 
        // but the current requirement says "use ATTOM API to retrieve data based on these parameter".
        // The /sale/snapshot endpoint is good for comps.

        // Construct query parameters
        // Note: ATTOM API parameters can be complex. We'll use a simplified mapping for now.
        // Documentation: https://api.developer.attomdata.com/docs

        // We will use the /sale/snapshot endpoint which is often used for comps
        // Or /sales/comparables if available and specific.
        // Let's stick to a general property search with filters if a specific comps endpoint isn't perfect,
        // but /sales/comparables is the standard one.

        // However, standard /sales/comparables might need a propertyId.
        // Let's try to find the property first to get its ID.

        // Parse address string
        // Expected format: "123 Main St, City, ST 12345"
        let address1 = '';
        let address2 = '';

        if (typeof address === 'string') {
            const parts = address.split(',').map(p => p.trim());
            if (parts.length >= 2) {
                address1 = parts[0];
                address2 = parts.slice(1).join(', ');
            } else {
                // Fallback or error
                address1 = address;
            }
        } else if (typeof address === 'object') {
            // Handle if it is already an object (legacy or future proof)
            address1 = address.street || address.address1 || '';
            address2 = `${address.city || ''}, ${address.state || ''} ${address.zip || ''}`.trim();
            if (address2 === ',') address2 = '';
        }

        console.log(`Searching ATTOM for: ${address1} | ${address2}`);

        const addressSearchResponse = await axios.get(`${ATTOM_BASE_URL}/property/address`, {
            params: { address1, address2 },
            headers: { apikey: ATTOM_API_KEY }
        });

        const propertyId = addressSearchResponse.data?.property?.[0]?.identifier?.attomId;

        if (!propertyId) {
            // Fallback: If we can't find the subject property, we can't easily run a "comparables" query 
            // that is based on "subject property".
            // But we can run a "radius search" for sold properties.
            // Let's assume we use radius search if property ID fails or as primary method if we want custom filters.
            // Custom filters like "sqft +10-20%" are manual logic we apply on results or query params.

            // Let's try to get lat/lon from the address search at least.
            // If address search failed entirely, we can't proceed without lat/lon.
            return res.status(404).json({ message: 'Subject property not found in ATTOM database.' });
        }

        // Now fetch comparables using the propertyId
        // The /sales/comparables endpoint does a lot of the heavy lifting.
        // But the user wants specific manual overrides: "distance, Recency, sqft...".
        // The standard endpoint might not support ALL these as *input* parameters to filter *before* returning.
        // We might need to fetch a broader set and filter in memory, or use the /property/address (radius) endpoint with filters.

        // Let's use the /sales/comparables endpoint and see if we can pass parameters.
        // If not, we use /sale/snapshot with radius.

        // Actually, for "Market Comps" with specific user criteria, a radius search on /sale/snapshot or /property/detail 
        // with "min/max" filters is often better.

        // Let's construct a search params object for a "Sold Property" search.
        const searchParams: any = {
            page: 1,
            pagesize: 20, // Limit results
            radius: distance || 1, // Default 1 mile
            minSaleDate: getRecencyDate(recency),
        };

        // We need lat/lon for radius search.
        // addressSearchResponse should have it.
        const location = addressSearchResponse.data?.property?.[0]?.location;
        if (location) {
            searchParams.latitude = location.latitude;
            searchParams.longitude = location.longitude;
        }

        // Add other filters if the API supports them directly, otherwise filter in memory.
        // ATTOM's /property/address endpoint with radius supports some, but /sale/snapshot is better for sales.
        // Let's try to map as many as possible.

        if (sqft) {
            const subjectSqft = addressSearchResponse.data?.property?.[0]?.building?.size?.bldgSize;
            if (subjectSqft) {
                let minFactor = 0.8;
                let maxFactor = 1.2;

                if (sqft === '+-10%') {
                    minFactor = 0.9;
                    maxFactor = 1.1;
                } else if (sqft === 'Same') {
                    minFactor = 0.95; // "Same" implies very close, say 5%
                    maxFactor = 1.05;
                }
                // Default is +-20%

                searchParams.minBldgSize = Math.floor(subjectSqft * minFactor);
                searchParams.maxBldgSize = Math.ceil(subjectSqft * maxFactor);
            }
        }

        if (bedrooms) {
            const subjectBeds = addressSearchResponse.data?.property?.[0]?.building?.rooms?.beds;
            if (subjectBeds) {
                if (bedrooms === 'Same') {
                    searchParams.minBeds = subjectBeds;
                    searchParams.maxBeds = subjectBeds;
                } else if (bedrooms === '+-1') {
                    searchParams.minBeds = Math.max(0, subjectBeds - 1);
                    searchParams.maxBeds = subjectBeds + 1;
                }
            }
        }

        if (bathrooms) {
            const subjectBaths = addressSearchResponse.data?.property?.[0]?.building?.rooms?.bathsTotal;
            if (subjectBaths) {
                if (bathrooms === 'Same') {
                    searchParams.minBathsTotal = subjectBaths;
                    searchParams.maxBathsTotal = subjectBaths;
                } else if (bathrooms === '+-1') {
                    searchParams.minBathsTotal = Math.max(0, subjectBaths - 1);
                    searchParams.maxBathsTotal = subjectBaths + 1;
                }
            }
        }

        // Execute the search
        const response = await axios.get(`${ATTOM_BASE_URL}/sale/snapshot`, {
            params: searchParams,
            headers: { apikey: ATTOM_API_KEY }
        });

        const comparables = response.data?.property?.map((p: any) => ({
            id: p.identifier?.attomId,
            address: `${p.address?.line1}, ${p.address?.locality}, ${p.address?.countrySubd} ${p.address?.postal1}`,
            salePrice: p.sale?.amount?.saleAmt,
            saleDate: p.sale?.amount?.saleRecDate,
            bedrooms: p.building?.rooms?.beds,
            bathrooms: p.building?.rooms?.bathsTotal,
            sqft: p.building?.size?.bldgSize,
            distanceMiles: p.location?.distance, // Check if API returns this, otherwise calculate
            // ... other fields
        })) || [];

        res.json({ comparables });

    } catch (error: any) {
        console.error('ATTOM API Error Details:');
        console.error('Message:', error.message);
        console.error('Status:', error.response?.status);
        console.error('Data:', JSON.stringify(error.response?.data, null, 2));

        const apiErrorMessage = error.response?.data?.status?.msg || error.response?.data?.message || error.message;
        res.status(500).json({
            message: `ATTOM API Error: ${apiErrorMessage}`,
            details: error.response?.data
        });
    }
};

function getRecencyDate(recency: string): string {
    const now = new Date();
    let daysToSubtract = 180; // Default 6 months

    switch (recency) {
        case 'This week': daysToSubtract = 7; break;
        case 'Last 2 weeks': daysToSubtract = 14; break;
        case '4 weeks': daysToSubtract = 28; break;
        case '2 months': daysToSubtract = 60; break;
        case '3 months': daysToSubtract = 90; break;
        case '6 months': daysToSubtract = 180; break;
        case 'YTD':
            const startOfYear = new Date(now.getFullYear(), 0, 1);
            daysToSubtract = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
            break;
    }

    const date = new Date(now.getTime() - (daysToSubtract * 24 * 60 * 60 * 1000));
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
}
