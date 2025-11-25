import React, { useState } from 'react';
import { Property, Comparable } from '../types';
import PropertyInput from './common/PropertyInput';
import apiClient from '../services/apiClient';
import { useAuth } from '../contexts/AuthContext';

// Local Icon Definitions
const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>;
const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>;
const CheckIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
const XMarkIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;

interface ComparablesTabProps {
    property: Property;
    setProperty: (property: Property) => void;
    onSave: (updatedProperty: Property) => Promise<void>;
    hasChanges: boolean;
}

export const ComparablesTab: React.FC<ComparablesTabProps> = ({ property, setProperty, onSave, hasChanges }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { analysisStatus } = useAuth();

    // Helper to calculate distance between two coordinates (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 3958.8; // Radius of Earth in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(R * c * 100) / 100; // Round to 2 decimal places
    };

    const handleCompAnalyze = async (inputType: 'url' | 'address' | 'coords' | 'location' | 'apn', value: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient.post('/analyze', { inputType, value });

            let distance = 0;
            // Helper to check if coordinates are valid (not 0,0)
            const isValidCoordinate = (coord: { lat: number; lon: number } | undefined) => {
                return coord && (coord.lat !== 0 || coord.lon !== 0);
            };

            // Calculate distance if both subject and comp have valid coordinates
            if (isValidCoordinate(property.coordinates) && isValidCoordinate(data.coordinates)) {
                distance = calculateDistance(
                    property.coordinates!.lat, property.coordinates!.lon,
                    data.coordinates!.lat, data.coordinates!.lon
                );
            }

            const newComparable: Comparable = {
                id: Date.now().toString(), // Temporary ID
                address: data.address,
                salePrice: data.financials.listPrice || data.financials.purchasePrice || 0,
                saleDate: data.details.lastSoldDate || data.dateAnalyzed,
                bedrooms: data.details.bedrooms,
                bathrooms: data.details.bathrooms,
                sqft: data.details.sqft,
                distanceMiles: distance,
                notes: 'Added via AI Analysis',
                included: true
            };

            const updatedComps = [...(property.comparables || []), newComparable];
            setProperty({ ...property, comparables: updatedComps });
            setIsAdding(false);
        } catch (e: any) {
            setError(e.response?.data?.message || e.message || 'Failed to analyze comparable.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteComp = (id: string) => {
        const updatedComps = property.comparables?.filter(c => c.id !== id) || [];
        setProperty({ ...property, comparables: updatedComps });
    };

    const handleToggleInclude = (id: string) => {
        const updatedComps = property.comparables?.map(c =>
            c.id === id ? { ...c, included: !c.included } : c
        ) || [];
        setProperty({ ...property, comparables: updatedComps });
    };

    const handleApplyValuation = () => {
        if (!property.comparables || property.comparables.length === 0) return;
        const includedComps = property.comparables.filter(c => c.included);
        if (includedComps.length === 0) return;

        const avgPriceSqFt = includedComps.reduce((sum, c) => sum + (c.salePrice / c.sqft), 0) / includedComps.length;
        const indicatedValue = Math.round(avgPriceSqFt * property.details.sqft);

        // Update ARV in all relevant strategies
        const updatedProperty = { ...property };
        updatedProperty.financials.estimatedValue = indicatedValue;

        if (updatedProperty.wholesaleAnalysis) updatedProperty.wholesaleAnalysis.inputs.arv = indicatedValue;
        if (updatedProperty.brrrrAnalysis) updatedProperty.brrrrAnalysis.inputs.arv = indicatedValue;

        setProperty(updatedProperty);
    };

    const includedComps = property.comparables?.filter(c => c.included) || [];
    const avgPrice = includedComps.length > 0
        ? includedComps.reduce((sum, c) => sum + c.salePrice, 0) / includedComps.length
        : 0;
    const avgSqFtPrice = includedComps.length > 0
        ? includedComps.reduce((sum, c) => sum + (c.salePrice / c.sqft), 0) / includedComps.length
        : 0;
    const indicatedValue = Math.round(avgSqFtPrice * property.details.sqft);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800">Sales Comparables</h2>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center space-x-2 text-brand-blue hover:text-blue-700 font-medium"
                >
                    {isAdding ? (
                        <>
                            <XMarkIcon className="h-5 w-5" />
                            <span>Cancel</span>
                        </>
                    ) : (
                        <>
                            <PlusIcon className="h-5 w-5" />
                            <span>Add Comparable</span>
                        </>
                    )}
                </button>
            </div>

            {isAdding && (
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 animate-fade-in">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Add New Comparable</h3>
                    {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

                    <PropertyInput
                        onAnalyze={handleCompAnalyze}
                        isLoading={isLoading}
                        isOverLimit={analysisStatus.isOverLimit}
                        remainingAnalyses={analysisStatus.limit === 'Unlimited' ? Infinity : Math.max(0, analysisStatus.limit - analysisStatus.count)}
                        analysisLimit={analysisStatus.limit}
                        embedded={true}
                        onBack={() => setIsAdding(false)}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Average Sale Price</p>
                    <p className="text-2xl font-bold text-gray-900">${avgPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Avg Price / SqFt</p>
                    <p className="text-2xl font-bold text-gray-900">${avgSqFtPrice.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl shadow-sm border border-blue-100">
                    <p className="text-sm text-blue-600">Indicated Value (based on SqFt)</p>
                    <p className="text-2xl font-bold text-blue-900">${indicatedValue.toLocaleString()}</p>
                    <button
                        onClick={handleApplyValuation}
                        className="mt-2 text-xs font-bold text-blue-700 hover:underline flex items-center"
                    >
                        Apply to Analysis <CheckIcon className="h-3 w-3 ml-1" />
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Include</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale Price</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {property.comparables?.map((comp) => (
                            <tr key={comp.id} className={!comp.included ? 'opacity-50 bg-gray-50' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={comp.included}
                                        onChange={() => handleToggleInclude(comp.id)}
                                        className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 rounded"
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{comp.address}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${comp.salePrice.toLocaleString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.saleDate}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {comp.bedrooms}bd / {comp.bathrooms}ba / {comp.sqft}sqft
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{comp.distanceMiles} mi</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDeleteComp(comp.id)} className="text-red-600 hover:text-red-900">
                                        <TrashIcon className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {(!property.comparables || property.comparables.length === 0) && (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    No comparables added yet. Use the "Add Comparable" button to find comps.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end mt-4">
                {hasChanges && (
                    <button onClick={() => onSave(property)} className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-blue-700">
                        Save Changes
                    </button>
                )}
            </div>
        </div>
    );
};
