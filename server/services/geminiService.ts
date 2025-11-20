import { GoogleGenAI, Type } from "@google/genai";
import { Property, Financials, Recommendation, Strategy } from '../../types';
import { calculateMetrics, calculateWholesaleMetrics, calculateSubjectToMetrics, calculateSellerFinancingMetrics } from '../utils/calculations.js';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const responseSchema = {
    type: Type.OBJECT,
    properties: {
        address: { type: Type.STRING, description: 'Full property address, including city, state, and zip code.' },
        propertyType: { type: Type.STRING, description: 'e.g., Single-Family, Duplex, Quadplex, etc.' },
        imageUrl: { type: Type.STRING, description: 'A direct URL to a representative, high-quality image of the property.' },
        details: {
            type: Type.OBJECT,
            properties: {
                totalBedrooms: { type: Type.NUMBER, description: 'Total number of bedrooms across all units.' },
                totalBathrooms: { type: Type.NUMBER, description: 'Total number of bathrooms across all units.' },
                sqft: { type: Type.NUMBER, description: 'Total square footage.' },
                yearBuilt: { type: Type.NUMBER, description: 'The year the property was built.' },
                numberOfUnits: { type: Type.NUMBER, description: 'The total number of residential units in the property (e.g., 1 for Single-Family, 2 for Duplex).' },
                unitDetails: {
                    type: Type.ARRAY,
                    description: "Details for each individual unit in the property. The number of items in this array should match numberOfUnits.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            bedrooms: { type: Type.NUMBER, description: "Number of bedrooms for this specific unit." },
                            bathrooms: { type: Type.NUMBER, description: "Number of bathrooms for this specific unit." }
                        }
                    }
                }
            }
        },
        financials: {
            type: Type.OBJECT,
            properties: {
                listPrice: { type: Type.NUMBER, description: 'The asking price for the property.' },
                estimatedValue: { type: Type.NUMBER, description: 'Estimated market value of the property.' },
                monthlyRents: { type: Type.ARRAY, items: { type: Type.NUMBER }, description: 'An array of estimated gross monthly rents, one for each unit. For a single-family home, this will be an array with one number.' },
                monthlyTaxes: { type: Type.NUMBER, description: 'Estimated monthly property taxes.' },
                monthlyInsurance: { type: Type.NUMBER, description: 'Estimated monthly homeowner\'s insurance cost.' },
                monthlyWaterSewer: { type: Type.NUMBER, description: 'Estimated monthly cost for water and sewer utilities.' },
                monthlyStreetLights: { type: Type.NUMBER, description: 'Estimated monthly cost for street lights, if applicable.' },
                monthlyGas: { type: Type.NUMBER, description: 'Estimated monthly cost for gas utility for common areas.' },
                monthlyElectric: { type: Type.NUMBER, description: 'Estimated monthly cost for common area electricity.' },
                monthlyLandscaping: { type: Type.NUMBER, description: 'Estimated monthly cost for landscaping services.' },
                monthlyHoaFee: { type: Type.NUMBER, description: 'Estimated monthly Homeowners Association (HOA) fees.' },
                operatingMiscFee: { type: Type.NUMBER, description: 'Any other miscellaneous monthly operating fees.' },
                brokerAgentFee: { type: Type.NUMBER, description: 'Estimated one-time Broker or Agent fee as part of closing costs.' },
                homeWarrantyFee: { type: Type.NUMBER, description: 'Estimated one-time Home Warranty fee as part of closing costs.' },
                attorneyFee: { type: Type.NUMBER, description: 'Estimated one-time Attorney fee as part of closing costs.' },
                closingMiscFee: { type: Type.NUMBER, description: 'Any other miscellaneous one-time fees as part of closing costs.' }
            }
        },
        marketAnalysis: {
            type: Type.OBJECT,
            properties: {
                safetyScore: { type: Type.NUMBER, description: 'A score from 0-100 representing the area\'s safety, with 100 being safest.' },
                areaAverageRents: {
                    type: Type.ARRAY,
                    items: { type: Type.NUMBER },
                    description: 'An array of average monthly rents for similar properties in the area, corresponding one-to-one with each unit. For example, if the first unit is a 2-bed, the first value here should be the average rent for a 2-bed in the area.'
                },
                investmentScore: { type: Type.NUMBER, description: 'A score from 0-10 representing the investment potential, 10 being best.' }
            }
        },
        recommendation: {
            type: Type.OBJECT,
            properties: {
                level: { type: Type.STRING, description: 'A concise recommendation: "Worth Pursuing", "Moderate Risk", "High Risk", or "Avoid".' },
                summary: { type: Type.STRING, description: 'A one-sentence summary of the investment recommendation.' },
                keyFactors: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of 3-4 key positive or negative factors.' },
                additionalNotes: { type: Type.STRING, description: 'A short paragraph with additional context or insights.' }
            }
        }
    }
};

const buildPrompt = (inputType: 'url' | 'address' | 'coords' | 'location', value: string): string => {
    let inputDescription = '';
    switch (inputType) {
        case 'url':
            inputDescription = `from the property listing URL: ${value}`;
            break;
        case 'address':
            inputDescription = `for the property at address: ${value}`;
            break;
        case 'coords':
            inputDescription = `for the property at GPS coordinates: ${value}`;
            break;
        case 'location':
            inputDescription = `for a typical investment property near my current location (GPS: ${value}). Find a representative property to analyze.`;
            break;
    }

    const schemaString = JSON.stringify(responseSchema, null, 2);

    return `You are a world-class senior real estate investment analyst. Your task is to analyze a real estate property and provide a detailed investment report in JSON format. Your highest priority is accuracy based on the provided source.
    
Property to analyze: ${inputDescription}.

**CRITICAL INSTRUCTIONS - ACCURACY IS PARAMOUNT:**
1.  **Use your search tool to access the LIVE, real-time content of the provided URL or address.** Your analysis must be based on the information currently present on the page.
2.  **Determine Property Price (\`listPrice\`):**
    *   First, identify the property's current status (e.g., "For Sale", "Active", "Pending", "Contingent", "Sold").
    *   If the status is "For Sale", "Active", or a similar "for sale" status, you MUST use the current asking price as the \`listPrice\`.
    *   If the status is "Sold", you MUST use the most recent sold price as the \`listPrice\`.
    *   **DO NOT GUESS.** Do not use a "Zestimate" or "Redfin Estimate" for the \`listPrice\`. The \`listPrice\` must be the actual listing or sold price. The \`estimatedValue\` field can be the Zestimate/Redfin Estimate, but the \`listPrice\` must be the ground-truth price.
3.  **Determine Property Taxes (\`monthlyTaxes\`):** This is a multi-step process. Follow it precisely to prioritize verified historical data.
    *   **Step 1: Analyze Provided URL for a Tax History Table.** Your primary goal is to find a multi-year "Tax History" or "Property Taxes" table on the *original URL provided*.
        *   If you find this table, you MUST take the property tax value from the **topmost row** (most recent year). The value is the dollar amount (e.g., '$2,608'). Ignore any percentage changes listed next to it (e.g., '(+22.5%)'). This tax history table is the *only* acceptable source if it exists; do not use any other tax numbers on the page if this table is present.
        *   If you find the table, proceed to the final calculation step below.
    *   **Step 2: Fallback to Zillow Search for Tax History Table.** If you CANNOT find a clear multi-year "Tax History" table on the original URL (it might be hidden behind a tab), you MUST then:
        *   Use your search tool to find the property's listing on **Zillow.com** using its address.
        *   On the Zillow page, find the "Public tax history" table. This table is usually visible by default and is the preferred secondary source.
        *   Take the property tax value from the **topmost row** of the Zillow tax table.
        *   If you successfully find the tax on Zillow, you MUST add the following sentence to the start of the \`recommendation.additionalNotes\`: "Note: Property tax data was sourced from Zillow for accuracy as it was not directly accessible on the provided link."
        *   Proceed to the final calculation step below.
    *   **Step 3: Last Resort Fallbacks.** If you cannot find the tax history table on the original URL *and* you cannot find it on Zillow:
        *   Search the original URL for a field explicitly labeled "Annual Taxes" for the most recent full year. Use this value.
        *   If you can only find an ESTIMATED tax value (e.g., inside a mortgage calculator), you may use it, but you MUST mention in \`recommendation.additionalNotes\` that the tax figure is an estimate because the official tax history was not accessible.
        *   If NO reliable tax figure can be found anywhere, set \`monthlyTaxes\` to 0 and state in \`recommendation.additionalNotes\` that "Property tax data could not be reliably extracted from any source."
    *   **Final Calculation Step:** After finding the annual tax amount using the steps above, you MUST calculate \`monthlyTaxes\` by dividing that annual amount by 12. DO NOT use a pre-calculated monthly number from a website's mortgage calculator directly.
4.  **Determine Property Insurance (\`monthlyInsurance\`):** You MUST calculate this value using a predictable formula to ensure consistency. Do not extract it from a mortgage calculator on the page. Follow this formula precisely:
    *   **Step 1:** Take the property's \`listPrice\`. (Note: The app will later allow users to adjust this to a final \`purchasePrice\`, but for the initial analysis, the \`listPrice\` is the correct baseline).
    *   **Step 2:** Calculate the annual insurance premium by multiplying this value by 0.005 (which represents 0.5% of the property value).
    *   **Step 3:** Calculate \`monthlyInsurance\` by dividing the annual premium by 12.
    *   **Step 4:** You MUST add the following sentence to the \`recommendation.additionalNotes\`: "Note: Monthly insurance is an estimate calculated as 0.5% of the property's value annually." If you also sourced tax data from Zillow, this note should come after the Zillow note.
5.  **Determine Neighborhood Safety (\`safetyScore\`):**
    *   You MUST use your search tool to research the crime rates for the specific neighborhood of the property address.
    *   Your primary source for this research MUST be **https://communitycrimemap.com/map**. Navigate to this site, input the property's address, and analyze the density and types of recent crimes (e.g., assault, burglary, theft) in the immediate vicinity (within a 0.5 to 1-mile radius).
    *   Based on this data, generate a \`safetyScore\` from 0 to 100, where 100 is extremely safe (virtually no crime) and 0 is extremely dangerous.
    *   **Score Calibration:**
        *   **80-100:** Very low crime, few to no incidents, predominantly safe area.
        *   **60-79:** Below average crime. Mostly petty crime, violent crime is rare.
        *   **40-59:** Average crime. A mix of property crimes and some more serious incidents. Requires caution.
        *   **20-39:** Above average to high crime. Frequent property crimes and a noticeable presence of violent crime.
        *   **0-19:** Very high crime. A dangerous area with frequent and serious criminal activity.
    *   The \`safetyScore\` MUST be a direct reflection of the data from the crime map. Do not use generic city-wide scores or other sources unless the primary one is unavailable.

**General Instructions:**
6.  Extract all other relevant data points from the page.
7.  Only after following the critical instructions above, if some secondary information is *still* missing (e.g., specific utility costs like water/sewer), you may provide a reasonable estimate based on the property's location, type, and size.
8.  Identify the number of units. For multi-unit properties, provide rent estimates for each unit in the 'monthlyRents' array. Also provide a breakdown of each unit's bedrooms and bathrooms in the 'details.unitDetails' array. The 'marketAnalysis.areaAverageRents' array must also correspond to each unit, providing the market rent for a comparable unit (e.g., same bed/bath count). For single-family homes, all arrays ('monthlyRents', 'unitDetails', 'areaAverageRents') should contain a single element.
9.  **Recommendation Logic (for a standard Rental strategy):** Your recommendation must be grounded in a balanced assessment of both financial metrics and **location quality**. Your analysis must be critical, objective, and hyper-aware of neighborhood safety.
    - **Safety is Paramount:** The \`marketAnalysis.safetyScore\` is a critical factor. A low score indicates higher risks of vacancy, tenant issues, and property damage that can nullify strong on-paper financials.
        -   **Safety Score < 40:** The property is in a challenging area. It CANNOT be rated 'Worth Pursuing'. It must be rated 'High Risk' or 'Avoid', and you must explicitly state that the low safety score is the primary reason.
        -   **Safety Score 40-60:** This is a 'Moderate Risk' area. A property here can only be 'Worth Pursuing' if the financial metrics are **exceptionally strong** (e.g., CoC > 15%, very high cash flow) to compensate for the added location risk. Otherwise, it defaults to 'Moderate Risk'. You must mention the safety as a key factor.
    - **Financial Health:**
        - **'Worth Pursuing'**: Reserved for properties with strong financials **AND** an acceptable safety score (>60). Must have strong positive cash flow, a healthy Cash-on-Cash Return (>8-10%), a safe DSCR (>1.25), and a good Cap Rate.
        - **'Moderate Risk'**: Properties with a mixed financial profile (e.g., break-even cash flow, borderline DSCR) OR strong financials in a borderline safety area (40-60 score).
        - **'High Risk'**: Properties with significant financial flaws (clear negative cash flow, very low CoC, DSCR < 1.0) OR properties in a low safety area (<40 score).
        - **'Avoid'**: Properties that are fundamentally unsound due to severe negative cash flow, an exorbitant price, OR being in a very poor location.
    **Crucially, do not just look at one metric in isolation. A great financial deal in a terrible area is a bad deal. Your recommendation must reflect this reality.**
10. Your final output MUST be a single, valid JSON object that strictly adheres to the schema provided below. Do not include any other text, markdown formatting, or explanations before or after the JSON object.
    
JSON Schema:
${schemaString}
`;
};

export const analyzePropertyWithGemini = async (inputType: 'url' | 'address' | 'coords' | 'location', value: string): Promise<Omit<Property, 'id'>> => {
    const modelsToTry = ['gemini-2.5-flash', 'gemini-3-pro-preview'];
    let lastError: any = null;
    let rawResponseForDebugging = '';

    for (const model of modelsToTry) {
        try {
            console.log(`Attempting analysis with model: ${model}`);
            const prompt = buildPrompt(inputType, value);
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    temperature: 0.2,
                },
            });

            rawResponseForDebugging = (response.text ?? '').trim();
            
            let jsonString = rawResponseForDebugging;
            if (jsonString.startsWith("```json")) {
                jsonString = jsonString.substring(7);
            }
            if (jsonString.endsWith("```")) {
                jsonString = jsonString.slice(0, -3);
            }

            const data = JSON.parse(jsonString);

            const initialFinancials: Financials = {
                listPrice: data.financials.listPrice,
                estimatedValue: data.financials.estimatedValue,
                monthlyRents: data.financials.monthlyRents,
                monthlyTaxes: data.financials.monthlyTaxes,
                monthlyInsurance: data.financials.monthlyInsurance,
                purchasePrice: data.financials.listPrice, // Default purchasePrice to listPrice
                rehabCost: 0,
                downPaymentPercent: 25,
                vacancyRate: 8,
                maintenanceRate: 8,
                managementRate: 10.5,
                capexRate: 8,
                monthlyWaterSewer: data.financials.monthlyWaterSewer || 0,
                monthlyStreetLights: data.financials.monthlyStreetLights || 0,
                monthlyGas: data.financials.monthlyGas || 0,
                monthlyElectric: data.financials.monthlyElectric || 0,
                monthlyLandscaping: data.financials.monthlyLandscaping || 0,
                monthlyHoaFee: data.financials.monthlyHoaFee || 0,
                operatingMiscFee: data.financials.operatingMiscFee || 0,
                loanInterestRate: 6.5,
                loanTermYears: 30,
                originationFeePercent: 1,
                closingFee: 0,
                processingFee: 0,
                appraisalFee: 0,
                titleFee: 0,
                brokerAgentFee: data.financials.brokerAgentFee || 0,
                homeWarrantyFee: data.financials.homeWarrantyFee || 0,
                attorneyFee: data.financials.attorneyFee || 0,
                closingMiscFee: data.financials.closingMiscFee || 0,
                sellerCreditTax: 0,
                sellerCreditSewer: 0,
                sellerCreditOrigination: 0,
                sellerCreditClosing: 0,
            };

            const totalMarketRent = data.financials.monthlyRents.reduce((a: number, b: number) => a + b, 0);

            const newProperty: Omit<Property, 'id'> = {
                address: data.address,
                propertyType: data.propertyType,
                imageUrl: data.imageUrl,
                dateAnalyzed: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                details: {
                    sqft: data.details.sqft,
                    yearBuilt: data.details.yearBuilt,
                    numberOfUnits: data.details.numberOfUnits || 1,
                    bedrooms: data.details.totalBedrooms,
                    bathrooms: data.details.totalBathrooms,
                    unitDetails: data.details.unitDetails || [{ bedrooms: data.details.totalBedrooms, bathrooms: data.details.totalBathrooms }],
                },
                financials: initialFinancials,
                marketAnalysis: {
                    safetyScore: data.marketAnalysis.safetyScore,
                    investmentScore: data.marketAnalysis.investmentScore,
                    areaAverageRents: data.marketAnalysis.areaAverageRents || [],
                },
                recommendation: { ...data.recommendation, strategyAnalyzed: 'Rental' },
                calculations: calculateMetrics(initialFinancials),
                wholesaleAnalysis: {
                    inputs: { arv: 0, estimatedRehab: 0, maoPercentOfArv: 0, closingCost: 0, wholesaleFeeGoal: 0, sellerAsk: 0, isAssignable: true },
                    calculations: { mao: 0, potentialFees: 0, isEligible: false }
                },
                subjectToAnalysis: {
                    inputs: { existingLoanBalance: 0, existingLoanRate: 0, monthlyPITI: 0, reinstatementNeeded: 0, sellerCashNeeded: 0, closingCosts: 0, marketRent: totalMarketRent },
                    calculations: { monthlySpread: 0, cashNeeded: 0, cashOnCashReturn: 0 }
                },
                sellerFinancingAnalysis: {
                    inputs: { purchasePrice: 0, downPayment: 0, sellerLoanRate: 0, loanTerm: 0, balloonYears: 0, paymentType: 'Amortization', marketRent: totalMarketRent },
                    calculations: { monthlyPayment: 0, spreadVsMarketRent: 0, returnOnDp: 0 }
                }
            };
            
            if (newProperty.wholesaleAnalysis) {
                newProperty.wholesaleAnalysis.calculations = calculateWholesaleMetrics(newProperty.wholesaleAnalysis.inputs);
            }
            if (newProperty.subjectToAnalysis) {
                newProperty.subjectToAnalysis.calculations = calculateSubjectToMetrics(newProperty.subjectToAnalysis.inputs);
            }
            if (newProperty.sellerFinancingAnalysis) {
                newProperty.sellerFinancingAnalysis.calculations = calculateSellerFinancingMetrics(newProperty.sellerFinancingAnalysis.inputs);
            }

            console.log(`Successfully analyzed property with model: ${model}`);
            return newProperty;

        } catch (error) {
            console.warn(`Analysis with model '${model}' failed. Trying next model...`, error);
            lastError = error;
        }
    }

    console.error("All models failed to analyze the property.", lastError);
    console.error("Raw response that caused the final error:", rawResponseForDebugging);
    
    let finalErrorMessage = "Failed to analyze property. All available AI models may be temporarily unavailable or the input was invalid.";

    if (lastError instanceof SyntaxError) {
        finalErrorMessage = "Failed to analyze property. The AI returned an invalid data format. This can happen with complex URLs. Please try a different property listing.";
    } else if (lastError && lastError.message) {
        if (lastError.message.includes('API key not valid')) {
            finalErrorMessage = "Failed to analyze property. Your API key is invalid. Please check your configuration.";
        } else if (lastError.message.toLowerCase().includes('rate limit')) {
            finalErrorMessage = "Failed to analyze property due to high request volume. Please wait a moment and try again.";
        }
    }
    
    throw new Error(finalErrorMessage);
};


const recommendationOnlySchema = {
    type: Type.OBJECT,
    properties: {
        level: { type: Type.STRING, description: 'A concise recommendation: "Worth Pursuing", "Moderate Risk", "High Risk", or "Avoid".' },
        summary: { type: Type.STRING, description: 'A one-sentence summary of the investment recommendation based on the updated financials.' },
        keyFactors: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'A list of 3-4 key positive or negative factors based on the updated financials.' },
        additionalNotes: { type: Type.STRING, description: 'A short paragraph with additional context or insights based on the updated financials.' },
        strategyAnalyzed: { type: Type.STRING, description: 'The investment strategy that was analyzed. This should match the strategy provided in the prompt instructions.' }
    }
};

const buildReevaluationPrompt = (property: Property, strategy: Strategy): string => {
    const dataToAnalyze = {
        address: property.address,
        propertyType: property.propertyType,
        details: property.details,
        financials: property.financials,
        marketAnalysis: property.marketAnalysis,
        // Include all analysis data for context
        rentalCalculations: property.calculations,
        wholesaleAnalysis: property.wholesaleAnalysis,
        subjectToAnalysis: property.subjectToAnalysis,
        sellerFinancingAnalysis: property.sellerFinancingAnalysis,
    };
    const dataString = JSON.stringify(dataToAnalyze, null, 2);

    let recommendationLogic = '';
    switch (strategy) {
        case 'Wholesale':
            recommendationLogic = `
- **Your recommendation must be based on the 'Wholesale' strategy.**
- **'Worth Pursuing'**: The 'potentialFees' (spread) is significant (e.g., >$10,000) and the MAO is well below the seller's asking price. The 'isEligible' flag is true.
- **'Moderate Risk'**: The 'potentialFees' are positive but slim. The deal is tight and requires negotiation or a quick buyer.
- **'High Risk'/'Avoid'**: The 'potentialFees' are negative ('isEligible' is false). The seller's asking price is higher than your MAO.`;
            break;
        case 'Subject-To':
            recommendationLogic = `
- **Your recommendation must be based on the 'Subject-To' strategy.**
- **'Worth Pursuing'**: There is a strong positive 'monthlySpread' and the 'cashNeeded' to close is low, resulting in a high 'cashOnCashReturn'. The underlying loan terms are favorable.
- **'Moderate Risk'**: The 'monthlySpread' is minimal, or the 'cashNeeded' is high. The deal works but requires significant upfront capital or has thin monthly margins.
- **'High Risk'/'Avoid'**: The 'monthlySpread' is negative. The property will lose money each month before accounting for any other expenses.`;
            break;
        case 'Seller Financing':
            recommendationLogic = `
- **Your recommendation must be based on the 'Seller Financing' strategy.**
- **'Worth Pursuing'**: There is a strong positive 'spreadVsMarketRent' and a high 'returnOnDp' (return on down payment). The seller's financing terms (rate, term) are favorable.
- **'Moderate Risk'**: The 'spreadVsMarketRent' is slim, or a large down payment is required, resulting in a mediocre return. The terms might include a near-term balloon payment.
- **'High Risk'/'Avoid'**: The monthly payment to the seller is higher than the market rent, resulting in a negative spread.`;
            break;
        case 'Rental':
        default:
            recommendationLogic = `
- **Your recommendation must be based on a balanced assessment of both financial metrics and location quality for the 'Rental' strategy.**
- **Safety is Paramount:** The \`marketAnalysis.safetyScore\` is a critical factor. A low score indicates higher risks of vacancy, tenant issues, and property damage that can nullify strong on-paper financials.
    - **Safety Score < 40:** The property is in a challenging area. It CANNOT be rated 'Worth Pursuing'. It must be rated 'High Risk' or 'Avoid', and you must explicitly state that the low safety score is the primary reason.
    - **Safety Score 40-60:** This is a 'Moderate Risk' area. A property here can only be 'Worth Pursuing' if the financial metrics are **exceptionally strong** (e.g., CoC > 15%, very high cash flow) to compensate for the added location risk. Otherwise, it defaults to 'Moderate Risk'. You must mention the safety as a key factor.
- **Financial Health:**
    - **'Worth Pursuing'**: Reserved for properties with strong financials **AND** an acceptable safety score (>60). Must have strong positive cash flow, a healthy Cash-on-Cash Return (>8-10%), a safe DSCR (>1.25), and a good Cap Rate.
    - **'Moderate Risk'**: Properties with a mixed financial profile (e.g., break-even cash flow, borderline DSCR) OR strong financials in a borderline safety area (40-60 score).
    - **'High Risk'**: Properties with significant financial flaws (clear negative cash flow, very low CoC, DSCR < 1.0) OR properties in a low safety area (<40 score).
    - **'Avoid'**: Properties that are fundamentally unsound due to severe negative cash flow, an exorbitant price, OR being in a very poor location.`;
            break;
    }


    return `You are a world-class senior real estate investment analyst. Your task is to re-evaluate a real estate property based on user-adjusted inputs and provide an updated investment recommendation in JSON format for the specified investment strategy.
    
Strategy to Analyze: "${strategy}"

Property Data (with user adjustments): 
${dataString}
    
Instructions:
1.  **Analyze the provided data based on the "${strategy}" strategy.** Pay close attention to the user-adjusted inputs and the resulting calculations for that specific strategy. Do not use external search tools; base your entire analysis on the data given.
2.  **Recommendation Logic:** Your new recommendation must be strictly grounded in a balanced assessment of the provided financial metrics **and the property's location quality (safetyScore)** for the chosen strategy. Your analysis must be critical and objective.
    ${recommendationLogic}
    **Crucially, do not just look at one metric in isolation. A great financial deal in a terrible area is a bad deal. Your recommendation must reflect this reality.**
3.  Your final output MUST be a single, valid JSON object that strictly adheres to the schema provided below. Do not include any other text, markdown formatting, or explanations before or after the JSON object. Ensure the 'strategyAnalyzed' field is set to "${strategy}".
    
JSON Schema:
${JSON.stringify(recommendationOnlySchema, null, 2)}
`;
};


export const reevaluatePropertyWithGemini = async (property: Property, strategy: Strategy): Promise<Recommendation> => {
    console.log(`Re-evaluating property with Gemini for strategy: ${strategy}`, property);
    const modelsToTry = ['gemini-2.5-flash', 'gemini-3-pro-preview'];
    let lastError: any = null;
    let rawResponseForDebugging = '';

    for (const model of modelsToTry) {
        try {
            console.log(`Attempting re-evaluation with model: ${model}`);
            const prompt = buildReevaluationPrompt(property, strategy);
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json",
                    responseSchema: recommendationOnlySchema
                },
            });

            rawResponseForDebugging = (response.text ?? '').trim();
            const data = JSON.parse(rawResponseForDebugging);
            
            if (data.level && data.summary && Array.isArray(data.keyFactors)) {
                console.log(`Successfully re-evaluated property with model: ${model}`);
                return data as Recommendation;
            } else {
                 throw new Error("Parsed JSON does not match the expected Recommendation structure.");
            }

        } catch (error) {
            console.warn(`Re-evaluation with model '${model}' failed. Trying next model...`, error);
            lastError = error;
        }
    }

    console.error("All models failed to re-evaluate the property.", lastError);
    console.error("Raw response that caused the final error:", rawResponseForDebugging);
    
    let finalErrorMessage = "Failed to re-evaluate property. All available AI models may be temporarily unavailable.";
    
    if (lastError instanceof SyntaxError) {
         finalErrorMessage = "Failed to re-evaluate property. The AI returned an invalid data format.";
    } else if (lastError && lastError.message) {
        if (lastError.message.includes('API key not valid')) {
            finalErrorMessage = "Failed to re-evaluate property. Your API key is invalid. Please check your configuration.";
        } else if (lastError.message.toLowerCase().includes('rate limit')) {
            finalErrorMessage = "Failed to re-evaluate property due to high request volume. Please wait a moment and try again.";
        }
    }
    
    throw new Error(finalErrorMessage);
};