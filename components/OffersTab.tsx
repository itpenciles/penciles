import React, { useState } from 'react';
import { Property } from '../types';
import apiClient from '../apiClient';

interface OffersTabProps {
    property: Property;
}

const OffersTab: React.FC<OffersTabProps> = ({ property }) => {
    const [offerPrice, setOfferPrice] = useState<number>(property.financials.listPrice);
    const [closingDateDays, setClosingDateDays] = useState<number>(30);
    const [earnestMoney, setEarnestMoney] = useState<number>(property.financials.listPrice * 0.01);
    const [contingencies, setContingencies] = useState<string[]>(['Inspection', 'Financing', 'Appraisal']);
    const [customTerms, setCustomTerms] = useState<string>('');
    const [generatedLetter, setGeneratedLetter] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleGenerateOffer = async () => {
        setIsLoading(true);
        setError('');
        try {
            const params = {
                offerPrice,
                closingDateDays,
                earnestMoney,
                contingencies,
                customTerms,
                strategy: property.recommendation.strategyAnalyzed || 'Rental'
            };

            const response = await apiClient.post(`/properties/${property.id}/offer`, params);
            // API client returns parsed JSON directly
            setGeneratedLetter(response.offerLetter);
        } catch (err) {
            console.error('Failed to generate offer:', err);
            setError('Failed to generate offer letter. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLetter);
        alert('Offer letter copied to clipboard!');
    };

    const toggleContingency = (cont: string) => {
        if (contingencies.includes(cont)) {
            setContingencies(contingencies.filter(c => c !== cont));
        } else {
            setContingencies([...contingencies, cont]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Smart Offer Generator</h2>
                <p className="text-gray-600 mb-6">
                    Generate a data-backed offer letter tailored to your selected strategy ({property.recommendation.strategyAnalyzed || 'Rental'}).
                    The AI will use the property's analysis (safety score, repairs, cash flow) to justify your price.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Inputs Column */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Offer Price ($)</label>
                            <input
                                type="number"
                                value={offerPrice}
                                onChange={(e) => setOfferPrice(Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-brand-blue focus:border-brand-blue"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Closing (Days)</label>
                                <input
                                    type="number"
                                    value={closingDateDays}
                                    onChange={(e) => setClosingDateDays(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Earnest Money ($)</label>
                                <input
                                    type="number"
                                    value={earnestMoney}
                                    onChange={(e) => setEarnestMoney(Number(e.target.value))}
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Contingencies</label>
                            <div className="flex flex-wrap gap-2">
                                {['Inspection', 'Financing', 'Appraisal', 'Clean Title', 'HOA Review'].map(cont => (
                                    <button
                                        key={cont}
                                        onClick={() => toggleContingency(cont)}
                                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${contingencies.includes(cont)
                                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                                : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                            }`}
                                    >
                                        {cont}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Terms (Optional)</label>
                            <textarea
                                value={customTerms}
                                onChange={(e) => setCustomTerms(e.target.value)}
                                placeholder="E.g., Seller pays closing costs, Subject-To terms..."
                                className="w-full p-2 border border-gray-300 rounded-lg h-20 text-sm"
                            />
                        </div>

                        <button
                            onClick={handleGenerateOffer}
                            disabled={isLoading}
                            className={`w-full py-3 rounded-lg font-bold text-white transition-all ${isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-brand-blue hover:bg-blue-700 shadow-md hover:shadow-lg'
                                }`}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Writing Offer...
                                </span>
                            ) : (
                                "Generate Smart Offer"
                            )}
                        </button>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                    </div>

                    {/* Output Column */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-700">Offer Letter Preview</h3>
                            {generatedLetter && (
                                <button
                                    onClick={copyToClipboard}
                                    className="text-brand-blue hover:text-blue-800 text-sm font-medium flex items-center"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                    Copy Text
                                </button>
                            )}
                        </div>
                        <textarea
                            value={generatedLetter}
                            onChange={(e) => setGeneratedLetter(e.target.value)}
                            placeholder="Your generated offer letter will appear here..."
                            className="flex-1 w-full bg-white border border-gray-200 rounded-lg p-4 text-sm font-mono text-gray-800 focus:outline-none focus:border-brand-blue resize-none min-h-[400px]"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OffersTab;
