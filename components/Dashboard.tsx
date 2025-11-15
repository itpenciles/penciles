import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { PlusIcon, ChartBarIcon, ArrowTrendingUpIcon, BanknotesIcon, ExclamationTriangleIcon, DocumentArrowDownIcon, XMarkIcon, CheckIcon } from '../constants';
import { Property } from '../types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const SummaryCard = ({ title, value, icon: Icon, change, changeType, iconBgColor }: { title: string, value: string, icon: React.ElementType, change?: string, changeType?: 'good' | 'bad', iconBgColor: string }) => (
    <div className="bg-white p-5 rounded-xl shadow-sm flex items-center justify-between">
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
            {change && (
                <p className={`text-xs mt-1 ${changeType === 'good' ? 'text-green-600' : 'text-red-600'}`}>
                    {change}
                </p>
            )}
        </div>
        <div className={`p-3 rounded-full ${iconBgColor}`}>
            <Icon className="h-6 w-6 text-white" />
        </div>
    </div>
);

interface PropertyRowProps {
    property: Property;
    isSelected: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string, address: string) => void;
}

const PropertyRow: React.FC<PropertyRowProps> = React.memo(({ property, isSelected, onSelect, onDelete }) => {
    const navigate = useNavigate();
    const { calculations, recommendation } = property;
    const recColor = recommendation?.level === 'Worth Pursuing' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

    return (
        <tr className="border-b border-gray-200 hover:bg-gray-50">
            <td className="py-3 px-4">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                        checked={isSelected}
                        onChange={() => onSelect(property.id)}
                    />
                    <div className="ml-4">
                        <p className="font-semibold text-gray-800">{property.address}</p>
                        <p className="text-sm text-gray-500">{property.propertyType}</p>
                    </div>
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-600">{property.dateAnalyzed}</td>
            <td className="py-3 px-4 text-sm font-semibold text-green-600">{calculations.capRate.toFixed(1)}%</td>
            <td className="py-3 px-4 text-sm font-semibold text-gray-700">{formatCurrency(calculations.monthlyCashFlowNoDebt)}</td>
            <td className="py-3 px-4 text-sm font-semibold text-red-600">{calculations.cashOnCashReturn.toFixed(1)}%</td>
            <td className="py-3 px-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${recColor}`}>{recommendation?.level}</span></td>
            <td className="py-3 px-4">
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigate(`/property/${property.id}`)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                    </button>
                    <button onClick={() => onDelete(property.id, property.address)} className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
            </td>
        </tr>
    );
});


const Dashboard = () => {
    const navigate = useNavigate();
    const { properties, deleteProperty, loading, error } = useProperties();
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);

    const avgCapRate = properties.length > 0 ? properties.reduce((acc, p) => acc + p.calculations.capRate, 0) / properties.length : 0;
    const avgMonthlyCashFlow = properties.length > 0 ? properties.reduce((acc, p) => acc + p.calculations.monthlyCashFlowWithDebt, 0) / properties.length : 0;
    const highRiskProperties = properties.filter(p => p.recommendation?.level === 'High Risk' || p.recommendation?.level === 'Avoid').length;

    // Calculations for investment summary
    const totalProperties = properties.length;
    const positiveCashFlowCount = properties.filter(p => p.calculations.monthlyCashFlowWithDebt > 0).length;

    // FIX: When using `reduce` to create an object, the initial value `{}` can lead to incorrect type inference for the accumulator.
    // This caused `count` to be a non-numeric type later, resulting in an arithmetic error.
    // By providing a generic type argument to `reduce`, we ensure `recommendationCounts` is correctly typed as `Record<string, number>`.
    const recommendationCounts = properties.reduce<Record<string, number>>((acc, p) => {
        const level = p.recommendation?.level;
        if (level) {
            acc[level] = (acc[level] || 0) + 1;
        }
        return acc;
    }, {});


    const handleSelectProperty = useCallback((id: string) => {
        setSelectedPropertyIds(prevSelected => {
            if (prevSelected.includes(id)) {
                return prevSelected.filter(pid => pid !== id);
            } else {
                if (prevSelected.length < 4) {
                    return [...prevSelected, id];
                } else {
                    alert("You can only compare up to 4 properties at a time.");
                    return prevSelected;
                }
            }
        });
    }, []);
    
    const handleDelete = useCallback(async (idToDelete: string, address: string) => {
        if (!idToDelete) {
            console.error('[DEBUG] handleDelete called with an invalid ID.');
            return;
        }
        if (window.confirm(`Are you sure you want to delete the property at ${address}?`)) {
            try {
                await deleteProperty(idToDelete);
                setSelectedPropertyIds(prev => prev.filter(id => id !== idToDelete));
            } catch (err) {
                alert(`Failed to delete property: ${err}`);
            }
        }
    }, [deleteProperty]);


    const handleCompare = () => {
        if (selectedPropertyIds.length < 2) return;
        navigate(`/compare?ids=${selectedPropertyIds.join(',')}`);
    };

    // Helper function to render table content based on state to fix parsing error
    const renderTableContent = () => {
        if (loading) {
            return <tr><td colSpan={7} className="text-center py-12 text-gray-500">Loading properties...</td></tr>;
        }
        if (error) {
            return <tr><td colSpan={7} className="text-center py-12 text-red-500">{error}</td></tr>;
        }
        if (properties.length > 0) {
            return properties.map(prop => 
                <PropertyRow 
                    key={prop.id} 
                    property={prop} 
                    isSelected={selectedPropertyIds.includes(prop.id)}
                    onSelect={handleSelectProperty}
                    onDelete={handleDelete}
                />
            );
        }
        return (
            <tr>
                <td colSpan={7}>
                    <div className="text-center py-12 text-gray-500">
                        <p>No properties analyzed yet.</p>
                        <button onClick={() => navigate('/add-property')} className="mt-2 text-brand-blue font-semibold">
                            Analyze your first property
                        </button>
                    </div>
                </td>
            </tr>
        );
    };

    return (
        <div className="p-8 bg-gray-50/50">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Investment Dashboard</h1>
                    <p className="text-gray-600 mt-1">Analyze properties and maximize your returns</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => navigate('/add-property')} className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Analyze New Property
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard title="Properties Analyzed" value={properties.length.toString()} icon={ChartBarIcon} iconBgColor="bg-blue-500" />
                <SummaryCard title="Avg Cap Rate" value={`${avgCapRate.toFixed(1)}%`} icon={ArrowTrendingUpIcon} change="Good" changeType="good" iconBgColor="bg-green-500" />
                <SummaryCard title="Avg Monthly Cash Flow" value={`$${Math.round(avgMonthlyCashFlow)}`} icon={BanknotesIcon} iconBgColor="bg-purple-500" />
                <SummaryCard title="High-Risk Properties" value={highRiskProperties.toString()} icon={ExclamationTriangleIcon} iconBgColor="bg-orange-500" />
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Recent Property Analyses</h2>
                        {selectedPropertyIds.length >= 2 && (
                            <button onClick={handleCompare} className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-purple-700 transition-colors flex items-center">
                                <ChartBarIcon className="h-5 w-5 mr-2" />
                                Compare ({selectedPropertyIds.length})
                            </button>
                        )}
                    </div>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Property</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date Analyzed</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cap Rate</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cash Flow (No-Debt)</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cash-on-Cash</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Recommendation</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderTableContent()}
                            </tbody>
                        </table>
                    </div>
                </div>

                <aside className="w-full lg:w-80 flex-shrink-0">
                     <div className="bg-white p-6 rounded-xl shadow-sm">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Investment Summary</h3>
                        
                        <div className="mb-6">
                            <div className="flex justify-between text-sm mb-1">
                                <span className="font-semibold text-gray-700">Average Cap Rate</span>
                                <span className="font-bold text-green-600">{avgCapRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.max(0, (avgCapRate / 8) * 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Target: 8% cap rate</p>
                        </div>

                         <div className="mb-6">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-semibold text-gray-700">Total Monthly Cash Flow</span>
                                <span className="font-bold text-green-600 text-lg">
                                    ${properties.reduce((sum, p) => sum + p.calculations.monthlyCashFlowWithDebt, 0).toLocaleString()}
                                </span>
                            </div>
                             <p className="text-xs text-gray-500">
                                {totalProperties > 0 ? `${positiveCashFlowCount} of ${totalProperties} properties with positive cash flow` : 'No properties analyzed yet.'}
                            </p>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-gray-700 mb-2">Recommendation Breakdown</h4>
                             <div className="space-y-2 text-sm">
                                {totalProperties > 0 ? (
                                    Object.entries(recommendationCounts).map(([level, count]) => {
                                        const percentage = ((count / totalProperties) * 100).toFixed(0);
                                        return (
                                            <div className="flex justify-between" key={level}>
                                                <span>{level}</span>
                                                <span>{count} <span className="text-gray-500">{percentage}%</span></span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-gray-500">No data to show.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default Dashboard;