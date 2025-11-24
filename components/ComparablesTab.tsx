import React, { useState } from 'react';
import { Property, Comparable } from '../types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);

interface ComparablesTabProps {
    property: Property;
    setProperty: (p: Property) => void;
    onSave: () => void;
    hasChanges: boolean;
}

export const ComparablesTab: React.FC<ComparablesTabProps> = ({ property, setProperty, onSave, hasChanges }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newComp, setNewComp] = useState<Partial<Comparable>>({
        address: '',
        salePrice: 0,
        saleDate: new Date().toISOString().split('T')[0],
        bedrooms: 0,
        bathrooms: 0,
        sqft: 0,
        distanceMiles: 0,
        notes: '',
        included: true
    });

    const comps = property.comparables || [];

    const handleAddComp = () => {
        if (!newComp.address || !newComp.salePrice) {
            alert("Address and Sale Price are required.");
            return;
        }

        const comp: Comparable = {
            id: crypto.randomUUID(),
            address: newComp.address,
            salePrice: Number(newComp.salePrice),
            saleDate: newComp.saleDate || new Date().toISOString().split('T')[0],
            bedrooms: Number(newComp.bedrooms),
            bathrooms: Number(newComp.bathrooms),
            sqft: Number(newComp.sqft),
            distanceMiles: Number(newComp.distanceMiles),
            notes: newComp.notes,
            included: true
        };

        const updatedComps = [...comps, comp];
        setProperty({ ...property, comparables: updatedComps });
        setIsAdding(false);
        setNewComp({
            address: '',
            salePrice: 0,
            saleDate: new Date().toISOString().split('T')[0],
            bedrooms: 0,
            bathrooms: 0,
            sqft: 0,
            distanceMiles: 0,
            notes: '',
            included: true
        });
    };

    const handleDeleteComp = (id: string) => {
        const updatedComps = comps.filter(c => c.id !== id);
        setProperty({ ...property, comparables: updatedComps });
    };

    const handleToggleInclude = (id: string) => {
        const updatedComps = comps.map(c => c.id === id ? { ...c, included: !c.included } : c);
        setProperty({ ...property, comparables: updatedComps });
    };

    const handleApplyToArv = (value: number) => {
        if (confirm(`Update Estimated Value / ARV to ${formatCurrency(value)}?`)) {
            const updatedFinancials = { ...property.financials, estimatedValue: value };
            // Also update BRRRR ARV if it exists
            let updatedBrrrr = property.brrrrAnalysis;
            if (updatedBrrrr) {
                updatedBrrrr = {
                    ...updatedBrrrr,
                    inputs: { ...updatedBrrrr.inputs, arv: value }
                };
            }

            // Also update Wholesale ARV if it exists
            let updatedWholesale = property.wholesaleAnalysis;
            if (updatedWholesale) {
                updatedWholesale = {
                    ...updatedWholesale,
                    inputs: { ...updatedWholesale.inputs, arv: value }
                };
            }

            setProperty({
                ...property,
                financials: updatedFinancials,
                brrrrAnalysis: updatedBrrrr,
                wholesaleAnalysis: updatedWholesale
            });
        }
    };

    // Statistics
    const includedComps = comps.filter(c => c.included);
    const avgPrice = includedComps.length > 0 ? includedComps.reduce((a, b) => a + b.salePrice, 0) / includedComps.length : 0;

    // Weighted Average (better for price/sqft)
    const totalSqFt = includedComps.reduce((a, b) => a + b.sqft, 0);
    const totalPrice = includedComps.reduce((a, b) => a + b.salePrice, 0);
    const weightedAvgSqFtPrice = totalSqFt > 0 ? totalPrice / totalSqFt : 0;

    const indicatedValue = property.details.sqft * weightedAvgSqFtPrice;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">Sales Comparables</h3>
                    <p className="text-sm text-gray-500">Add recent sales to estimate the After Repair Value (ARV).</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-brand-blue text-white px-4 py-2 rounded-md text-sm font-semibold hover:bg-blue-700"
                >
                    {isAdding ? 'Cancel' : 'Add Comp'}
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Avg. Sale Price</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(avgPrice)}</p>
                    <p className="text-xs text-gray-500">{includedComps.length} comps included</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">Avg. Price / SqFt</p>
                    <p className="text-xl font-bold text-gray-800">{formatCurrency(weightedAvgSqFtPrice)}</p>
                    <p className="text-xs text-gray-500">Weighted Average</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-500">Indicated Value</p>
                    <div className="flex items-center space-x-2">
                        <p className="text-xl font-bold text-blue-700">{formatCurrency(indicatedValue)}</p>
                        {indicatedValue > 0 && (
                            <button
                                onClick={() => handleApplyToArv(indicatedValue)}
                                className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                                title="Apply this value to Property ARV"
                            >
                                Apply
                            </button>
                        )}
                    </div>
                    <p className="text-xs text-gray-500">Based on Subject SqFt ({property.details.sqft})</p>
                </div>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 animate-fade-in">
                    <h4 className="font-semibold text-gray-700">New Comparable</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                            <input type="text" className="w-full p-2 border rounded text-sm" value={newComp.address} onChange={e => setNewComp({ ...newComp, address: e.target.value })} placeholder="123 Main St" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sale Price ($)</label>
                            <input type="number" className="w-full p-2 border rounded text-sm" value={newComp.salePrice} onChange={e => setNewComp({ ...newComp, salePrice: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Sale Date</label>
                            <input type="date" className="w-full p-2 border rounded text-sm" value={newComp.saleDate} onChange={e => setNewComp({ ...newComp, saleDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">SqFt</label>
                            <input type="number" className="w-full p-2 border rounded text-sm" value={newComp.sqft} onChange={e => setNewComp({ ...newComp, sqft: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Beds</label>
                            <input type="number" className="w-full p-2 border rounded text-sm" value={newComp.bedrooms} onChange={e => setNewComp({ ...newComp, bedrooms: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Baths</label>
                            <input type="number" className="w-full p-2 border rounded text-sm" value={newComp.bathrooms} onChange={e => setNewComp({ ...newComp, bathrooms: Number(e.target.value) })} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Distance (mi)</label>
                            <input type="number" className="w-full p-2 border rounded text-sm" value={newComp.distanceMiles} onChange={e => setNewComp({ ...newComp, distanceMiles: Number(e.target.value) })} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                        <input type="text" className="w-full p-2 border rounded text-sm" value={newComp.notes} onChange={e => setNewComp({ ...newComp, notes: e.target.value })} placeholder="Condition, renovation level, etc." />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button onClick={() => setIsAdding(false)} className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded">Cancel</button>
                        <button onClick={handleAddComp} className="px-3 py-1 text-sm bg-green-600 text-white hover:bg-green-700 rounded">Save Comp</button>
                    </div>
                </div>
            )}

            {/* Comps Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Include</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">$/SqFt</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dist.</th>
                            <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {comps.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-3 py-4 text-center text-sm text-gray-500">No comparables added yet.</td>
                            </tr>
                        ) : (
                            comps.map(comp => (
                                <tr key={comp.id} className={!comp.included ? 'opacity-50 bg-gray-50' : ''}>
                                    <td className="px-3 py-2 whitespace-nowrap">
                                        <input
                                            type="checkbox"
                                            checked={comp.included}
                                            onChange={() => handleToggleInclude(comp.id)}
                                            className="h-4 w-4 text-brand-blue focus:ring-brand-blue border-gray-300 rounded"
                                        />
                                    </td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{comp.address}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(comp.salePrice)}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{comp.saleDate}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{comp.bedrooms}bd/{comp.bathrooms}ba | {comp.sqft} sqft</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{comp.sqft > 0 ? formatCurrency(comp.salePrice / comp.sqft) : 'N/A'}</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{comp.distanceMiles} mi</td>
                                    <td className="px-3 py-2 whitespace-nowrap text-right text-sm font-medium">
                                        <button onClick={() => handleDeleteComp(comp.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end mt-4">
                {hasChanges && (
                    <button onClick={onSave} className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-blue-700">
                        Save Changes
                    </button>
                )}
            </div>
        </div>
    );
};
