import React from 'react';
import { Property } from '../types';
import { calculateBrrrrMetrics } from '../contexts/PropertyContext';
import { InputField } from './common/FormFields';

const formatCurrency = (amount: number, precision = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: precision, maximumFractionDigits: precision }).format(amount);

interface BrrrrProps {
    property: Property;
    setProperty: (p: Property) => void;
    onSave: () => void;
    onReset: () => void;
    hasChanges: boolean;
    isLoading: boolean;
    error: string | null;
}

export const BrrrrMetricsTab = ({ property }: { property: Property }) => {
    const brrrr = property.brrrrAnalysis;
    if (!brrrr) return <div>BRRRR Analysis not available.</div>;

    const { calculations } = brrrr;
    const { totalProjectCost, refinanceLoanAmount, cashOutAmount, cashLeftInDeal, roi, monthlyCashFlowPostRefi, isInfiniteReturn } = calculations;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-lg border ${isInfiniteReturn || roi > 15 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <p className="text-sm text-gray-500">ROI (Cash on Cash)</p>
                    <p className={`text-2xl font-bold ${isInfiniteReturn || roi > 15 ? 'text-green-700' : 'text-yellow-700'}`}>
                        {isInfiniteReturn ? '∞ Infinite' : `${roi.toFixed(1)}%`}
                    </p>
                    <p className="text-xs text-gray-500">Annual Return on Cash Left</p>
                </div>
                <div className={`p-4 rounded-lg border ${cashLeftInDeal <= 0 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                    <p className="text-sm text-gray-500">Cash Left in Deal</p>
                    <p className={`text-2xl font-bold ${cashLeftInDeal <= 0 ? 'text-green-700' : 'text-blue-700'}`}>
                        {formatCurrency(cashLeftInDeal)}
                    </p>
                    <p className="text-xs text-gray-500">{cashLeftInDeal <= 0 ? 'Perfect BRRRR (Cash Out)' : 'Capital Trapped'}</p>
                </div>
                <div className={`p-4 rounded-lg border ${monthlyCashFlowPostRefi > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <p className="text-sm text-gray-500">Monthly Cash Flow</p>
                    <p className={`text-2xl font-bold ${monthlyCashFlowPostRefi > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatCurrency(monthlyCashFlowPostRefi)}
                    </p>
                    <p className="text-xs text-gray-500">Post-Refinance</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-4">Project Breakdown</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Purchase Price</span>
                        <span className="font-semibold">{formatCurrency(brrrr.inputs.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Rehab Cost</span>
                        <span className="font-semibold">{formatCurrency(brrrr.inputs.rehabCost)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Initial Closing Costs</span>
                        <span className="font-semibold">{formatCurrency(brrrr.inputs.initialLoanClosingCosts)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Holding Costs (Total)</span>
                        <span className="font-semibold">{formatCurrency(totalProjectCost - brrrr.inputs.purchasePrice - brrrr.inputs.rehabCost - brrrr.inputs.initialLoanClosingCosts)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300 font-bold">
                        <span className="text-gray-800">Total All-In Cost</span>
                        <span className="text-gray-900">{formatCurrency(totalProjectCost)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-800 mb-4">Refinance Outcome</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">After Repair Value (ARV)</span>
                        <span className="font-semibold">{formatCurrency(brrrr.inputs.arv)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">New Loan Amount ({brrrr.inputs.refinanceLoanLtv}% LTV)</span>
                        <span className="font-semibold">{formatCurrency(refinanceLoanAmount)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300 font-bold">
                        <span className="text-gray-800">Cash Out / (Left In)</span>
                        <span className={`${cashOutAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(cashOutAmount)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const BrrrrParamsTab = ({ property, setProperty, onSave, onReset, hasChanges, isLoading, error }: BrrrrProps) => {
    const brrrr = property.brrrrAnalysis;
    if (!brrrr) return <div>BRRRR Analysis not available.</div>;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newInputs = { ...brrrr.inputs, [name]: Number(value) };
        const newCalculations = calculateBrrrrMetrics(newInputs);
        setProperty({
            ...property,
            brrrrAnalysis: { inputs: newInputs, calculations: newCalculations }
        });
    };

    return (
        <div className="space-y-4">
            <p className="text-sm bg-blue-50 p-3 rounded-lg text-blue-800">
                Adjust the BRRRR parameters below. The goal is to recover as much capital as possible during the refinance step.
            </p>

            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 -mb-2">Phase 1: Buy & Rehab</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Purchase Price ($)" name="purchasePrice" value={brrrr.inputs.purchasePrice} onChange={handleInputChange} />
                    <InputField label="Rehab Cost ($)" name="rehabCost" value={brrrr.inputs.rehabCost} onChange={handleInputChange} />
                    <InputField label="Rehab Duration (Months)" name="rehabDurationMonths" value={brrrr.inputs.rehabDurationMonths} onChange={handleInputChange} />
                    <InputField label="After Repair Value (ARV) ($)" name="arv" value={brrrr.inputs.arv} onChange={handleInputChange} />
                </div>
            </div>

            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 -mb-2">Phase 1: Financing (Hard Money/Bridge)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Initial Loan Amount ($)" name="initialLoanAmount" value={brrrr.inputs.initialLoanAmount} onChange={handleInputChange} />
                    <InputField label="Interest Rate (%)" name="initialLoanRate" value={brrrr.inputs.initialLoanRate} onChange={handleInputChange} />
                    <InputField label="Closing Costs (Buy) ($)" name="initialLoanClosingCosts" value={brrrr.inputs.initialLoanClosingCosts} onChange={handleInputChange} />
                    <InputField label="Monthly Holding Costs ($)" name="holdingCostsMonthly" value={brrrr.inputs.holdingCostsMonthly} onChange={handleInputChange} />
                </div>
            </div>

            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 -mb-2">Phase 2: Refinance (Rent & Refi)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Refinance LTV (%)" name="refinanceLoanLtv" value={brrrr.inputs.refinanceLoanLtv} onChange={handleInputChange} />
                    <InputField label="Refinance Rate (%)" name="refinanceLoanRate" value={brrrr.inputs.refinanceLoanRate} onChange={handleInputChange} />
                    <InputField label="Refinance Closing Costs ($)" name="refinanceClosingCosts" value={brrrr.inputs.refinanceClosingCosts} onChange={handleInputChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Monthly Rent (Post-Refi) ($)" name="monthlyRentPostRefi" value={brrrr.inputs.monthlyRentPostRefi} onChange={handleInputChange} />
                    <InputField label="Monthly Expenses (Post-Refi) ($)" name="monthlyExpensesPostRefi" value={brrrr.inputs.monthlyExpensesPostRefi} onChange={handleInputChange} />
                </div>
            </div>

            <div className="mt-6 no-print">
                {error && <div className="bg-red-100 border border-red-300 text-red-800 text-sm p-3 rounded-md mb-4">{error}</div>}
                <div className="flex justify-end items-center space-x-4">
                    {hasChanges ? (
                        <>
                            <button onClick={onReset} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50">Reset</button>
                            <button onClick={onSave} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center min-w-[170px] justify-center">
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                                        Re-evaluating...
                                    </>
                                ) : 'Save & Re-evaluate'}
                            </button>
                        </>
                    ) : (
                        <p className="text-sm text-gray-500 italic">No unsaved changes.</p>
                    )}
                </div>
            </div>
        </div>
    );
};
