import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { Property } from '../types';
import { ArrowLeftIcon } from '../constants';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const recommendationRank: { [key: string]: number } = {
    'Worth Pursuing': 4,
    'Moderate Risk': 3,
    'High Risk': 2,
    'Avoid': 1,
};

// Define types for metrics and headers
// FIX: Add 'type' to Metric to create a discriminated union, which resolves type errors when mapping over metrics.
type Metric = {
    type: 'metric';
    label: string;
    getValue: (p: Property) => number;
    format: (v: number) => string;
    isBetter: 'high' | 'low';
};

type MetricHeader = {
    type: 'header';
    label: string;
    title: string;
};

type ComparisonItem = Metric | MetricHeader;


const ComparisonPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { properties } = useProperties();

    const idsToCompare = searchParams.get('ids')?.split(',') || [];
    const propertiesToCompare = properties.filter(p => idsToCompare.includes(p.id));

    // FIX: Add 'type: "metric"' to metric objects to conform to the new discriminated union type.
    const metrics: ComparisonItem[] = [
        { type: 'header', label: 'purchase-header', title: 'Purchase Details' },
        { type: 'metric', label: 'Purchase Price', getValue: (p: Property) => p.financials.purchasePrice, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Rehab Cost', getValue: (p: Property) => p.financials.rehabCost, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Total Project Cost', getValue: (p: Property) => p.calculations.totalInvestment + p.calculations.totalClosingCosts, format: formatCurrency, isBetter: 'low' },

        { type: 'header', label: 'monthly-header', title: 'Monthly Financials' },
        { type: 'metric', label: 'Gross Rent', getValue: (p: Property) => p.financials.monthlyRents.reduce((a, b) => a + b, 0), format: formatCurrency, isBetter: 'high' },
        { type: 'metric', label: 'Vacancy Loss', getValue: (p: Property) => p.calculations.vacancyLoss / 12, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Maintenance', getValue: (p: Property) => p.calculations.maintenanceCost, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Management', getValue: (p: Property) => p.calculations.managementCost, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'CapEx Reserves', getValue: (p: Property) => p.calculations.capexCost, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Property Taxes', getValue: (p: Property) => p.financials.monthlyTaxes, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Insurance', getValue: (p: Property) => p.financials.monthlyInsurance, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Water/Sewer', getValue: (p: Property) => p.financials.monthlyWaterSewer, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Street Lights', getValue: (p: Property) => p.financials.monthlyStreetLights, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Gas', getValue: (p: Property) => p.financials.monthlyGas, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Electric', getValue: (p: Property) => p.financials.monthlyElectric, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Landscaping', getValue: (p: Property) => p.financials.monthlyLandscaping, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Total Operating Expenses', getValue: (p: Property) => p.calculations.totalOperatingExpenses, format: formatCurrency, isBetter: 'low' },
        { type: 'metric', label: 'Net Operating Income (NOI)', getValue: (p: Property) => p.calculations.netOperatingIncome, format: formatCurrency, isBetter: 'high' },

        { type: 'header', label: 'kpi-header', title: 'Key Performance Indicators' },
        { type: 'metric', label: 'Cap Rate', getValue: (p: Property) => p.calculations.capRate, format: (v: number) => `${v.toFixed(1)}%`, isBetter: 'high' },
        { type: 'metric', label: 'Cash on Cash Return', getValue: (p: Property) => p.calculations.cashOnCashReturn, format: (v: number) => `${v.toFixed(1)}%`, isBetter: 'high' },
        { type: 'metric', label: 'Monthly Cash Flow', getValue: (p: Property) => p.calculations.monthlyCashFlowWithDebt, format: formatCurrency, isBetter: 'high' },

        { type: 'header', label: 'recommendation-header', title: 'Overall Recommendation' },
        { type: 'metric', label: 'Recommendation', getValue: (p: Property) => recommendationRank[p.recommendation.level], format: (v: number) => Object.keys(recommendationRank).find(key => recommendationRank[key] === v) || '', isBetter: 'high' },
    ];


    const getBestValue = (metric: Metric) => {
        if (propertiesToCompare.length < 2) return null;
        const values = propertiesToCompare.map(p => metric.getValue(p));
        return metric.isBetter === 'high' ? Math.max(...values) : Math.min(...values);
    };

    if (propertiesToCompare.length === 0) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold">No properties selected for comparison.</h1>
                <button onClick={() => navigate('/dashboard')} className="mt-4 text-brand-blue font-semibold">
                    Back to Dashboard
                </button>
            </div>
        );
    }
    
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
            <header className="mb-6">
                <button onClick={() => navigate('/dashboard')} className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back to Dashboard
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Side-by-Side Comparison</h1>
                <p className="text-gray-600 mt-1">Comparing {propertiesToCompare.length} properties.</p>
            </header>
            
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 w-1/4">Metric</th>
                                {propertiesToCompare.map(p => (
                                    <th key={p.id} className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase truncate" title={p.address}>
                                        {p.address}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {metrics.map(metric => {
                                // FIX: Type guarding via discriminated union allows safe access to properties like 'type', 'title', 'getValue', and 'format'.
                                if (metric.type === 'header') {
                                    return (
                                        <tr key={metric.label}>
                                            <td colSpan={propertiesToCompare.length + 1} className="py-2 px-4 text-sm font-semibold text-gray-800 sticky left-0 bg-gray-100 z-10">
                                                {metric.title}
                                            </td>
                                        </tr>
                                    );
                                }

                                const bestValue = getBestValue(metric);
                                return (
                                    <tr key={metric.label}>
                                        <td className="py-4 px-4 font-medium text-gray-600 sticky left-0 bg-white z-10">{metric.label}</td>
                                        {propertiesToCompare.map(p => {
                                            const value = metric.getValue(p);
                                            const isBest = value === bestValue && propertiesToCompare.length > 1;
                                            return (
                                                <td key={p.id} className={`py-4 px-4 text-sm font-semibold text-gray-800 transition-colors ${isBest ? 'bg-green-50' : ''}`}>
                                                    <span className={`${isBest ? 'text-green-700 font-bold' : ''}`}>
                                                        {metric.format(value)}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ComparisonPage;