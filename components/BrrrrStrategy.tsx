import React from 'react';
import { Property } from '../types';
import { calculateBrrrrMetrics } from '../contexts/PropertyContext';
import { InputField, ToggleField, SliderField } from './common/FormFields';

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

const InfoTooltip = ({ children, text }: { children: React.ReactNode; text: string }) => (
    <div className="relative group flex flex-col items-center">
        {children}
        <div className="absolute bottom-full mb-2 w-48 bg-gray-800 text-white text-xs rounded-lg shadow-lg p-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none text-center">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
        </div>
    </div>
);

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
                    <div className={`text-2xl font-bold ${isInfiniteReturn || roi > 15 ? 'text-green-700' : 'text-yellow-700'}`}>
                        {isInfiniteReturn ? (
                            <InfoTooltip text="Infinite Return: You have $0 (or less) of your own cash left in the deal!">
                                <span className="cursor-help underline decoration-dotted">∞ Infinite</span>
                            </InfoTooltip>
                        ) : `${roi.toFixed(1)}%`}
                    </div>
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
                    {/* Add more detailed breakdown here if needed */}
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
                        <span className="text-gray-600">New Loan Amount</span>
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

    // Helper to update nested state
    const updateNested = (path: string[], value: any) => {
        const newInputs = { ...brrrr.inputs };
        let current: any = newInputs;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {};
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;

        const newCalculations = calculateBrrrrMetrics(newInputs);
        setProperty({
            ...property,
            brrrrAnalysis: { inputs: newInputs, calculations: newCalculations }
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? Number(value) : value;
        // Name is expected to be dot notation e.g. "purchaseCosts.points"
        updateNested(name.split('.'), val);
    };

    const handleToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        updateNested(name.split('.'), checked);
    };

    const handleSliderChange = (name: string, value: number) => {
        updateNested(name.split('.'), value);
    };

    return (
        <div className="space-y-6">
            <p className="text-sm bg-blue-50 p-3 rounded-lg text-blue-800">
                Adjust the detailed BRRRR parameters below.
            </p>

            {/* Purchase Detail */}
            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">Purchase Detail</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Purchase Price ($)" name="purchasePrice" value={brrrr.inputs.purchasePrice} onChange={handleChange} />
                    <InputField label="After Repair Value (ARV) ($)" name="arv" value={brrrr.inputs.arv} onChange={handleChange} />
                </div>

                <h5 className="font-medium text-gray-600 mt-4">Purchase Closing Costs</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Points/Origination ($)" name="purchaseCosts.points" value={brrrr.inputs.purchaseCosts?.points} onChange={handleChange} />
                    <InputField label="Prepaid Hazard Ins ($)" name="purchaseCosts.prepaidHazardInsurance" value={brrrr.inputs.purchaseCosts?.prepaidHazardInsurance} onChange={handleChange} />
                    <InputField label="Prepaid Flood Ins ($)" name="purchaseCosts.prepaidFloodInsurance" value={brrrr.inputs.purchaseCosts?.prepaidFloodInsurance} onChange={handleChange} />
                    <InputField label="Prepaid Prop Tax ($)" name="purchaseCosts.prepaidPropertyTax" value={brrrr.inputs.purchaseCosts?.prepaidPropertyTax} onChange={handleChange} />
                    <InputField label="Annual Assessments ($)" name="purchaseCosts.annualAssessments" value={brrrr.inputs.purchaseCosts?.annualAssessments} onChange={handleChange} />
                    <InputField label="Title & Escrow ($)" name="purchaseCosts.titleEscrowFees" value={brrrr.inputs.purchaseCosts?.titleEscrowFees} onChange={handleChange} />
                    <InputField label="Attorney Fees ($)" name="purchaseCosts.attorneyFees" value={brrrr.inputs.purchaseCosts?.attorneyFees} onChange={handleChange} />
                    <InputField label="Inspection Cost ($)" name="purchaseCosts.inspectionCost" value={brrrr.inputs.purchaseCosts?.inspectionCost} onChange={handleChange} />
                    <InputField label="Recording Fees ($)" name="purchaseCosts.recordingFees" value={brrrr.inputs.purchaseCosts?.recordingFees} onChange={handleChange} />
                    <InputField label="Appraisal Fees ($)" name="purchaseCosts.appraisalFees" value={brrrr.inputs.purchaseCosts?.appraisalFees} onChange={handleChange} />
                    <InputField label="Broker/Realtor Fees ($)" name="purchaseCosts.brokerFees" value={brrrr.inputs.purchaseCosts?.brokerFees} onChange={handleChange} />
                    <InputField label="Other Fees ($)" name="purchaseCosts.otherFees" value={brrrr.inputs.purchaseCosts?.otherFees} onChange={handleChange} />
                </div>
            </div>

            {/* Rehab Details */}
            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">Rehab Details (Estimated Repair Costs)</h4>

                <h5 className="font-medium text-gray-600 mt-2">Exterior</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Roof" name="rehabCosts.exterior.roof" value={brrrr.inputs.rehabCosts?.exterior?.roof} onChange={handleChange} />
                    <InputField label="Gutters/Soffit" name="rehabCosts.exterior.gutters" value={brrrr.inputs.rehabCosts?.exterior?.gutters} onChange={handleChange} />
                    <InputField label="Garage" name="rehabCosts.exterior.garage" value={brrrr.inputs.rehabCosts?.exterior?.garage} onChange={handleChange} />
                    <InputField label="Siding" name="rehabCosts.exterior.siding" value={brrrr.inputs.rehabCosts?.exterior?.siding} onChange={handleChange} />
                    <InputField label="Landscaping" name="rehabCosts.exterior.landscaping" value={brrrr.inputs.rehabCosts?.exterior?.landscaping} onChange={handleChange} />
                    <InputField label="Ext. Painting" name="rehabCosts.exterior.painting" value={brrrr.inputs.rehabCosts?.exterior?.painting} onChange={handleChange} />
                    <InputField label="Septic" name="rehabCosts.exterior.septic" value={brrrr.inputs.rehabCosts?.exterior?.septic} onChange={handleChange} />
                    <InputField label="Decks/Porches" name="rehabCosts.exterior.decks" value={brrrr.inputs.rehabCosts?.exterior?.decks} onChange={handleChange} />
                    <InputField label="Foundation" name="rehabCosts.exterior.foundation" value={brrrr.inputs.rehabCosts?.exterior?.foundation} onChange={handleChange} />
                    <InputField label="Electrical Meter" name="rehabCosts.exterior.electrical" value={brrrr.inputs.rehabCosts?.exterior?.electrical} onChange={handleChange} />
                    <InputField label="Other Ext." name="rehabCosts.exterior.other" value={brrrr.inputs.rehabCosts?.exterior?.other} onChange={handleChange} />
                </div>

                <h5 className="font-medium text-gray-600 mt-4">Interior</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Demo" name="rehabCosts.interior.demo" value={brrrr.inputs.rehabCosts?.interior?.demo} onChange={handleChange} />
                    <InputField label="Sheetrock" name="rehabCosts.interior.sheetrock" value={brrrr.inputs.rehabCosts?.interior?.sheetrock} onChange={handleChange} />
                    <InputField label="Plumbing" name="rehabCosts.interior.plumbing" value={brrrr.inputs.rehabCosts?.interior?.plumbing} onChange={handleChange} />
                    <InputField label="Carpentry" name="rehabCosts.interior.carpentry" value={brrrr.inputs.rehabCosts?.interior?.carpentry} onChange={handleChange} />
                    <InputField label="Windows" name="rehabCosts.interior.windows" value={brrrr.inputs.rehabCosts?.interior?.windows} onChange={handleChange} />
                    <InputField label="Doors" name="rehabCosts.interior.doors" value={brrrr.inputs.rehabCosts?.interior?.doors} onChange={handleChange} />
                    <InputField label="Electrical" name="rehabCosts.interior.electrical" value={brrrr.inputs.rehabCosts?.interior?.electrical} onChange={handleChange} />
                    <InputField label="Int. Painting" name="rehabCosts.interior.painting" value={brrrr.inputs.rehabCosts?.interior?.painting} onChange={handleChange} />
                    <InputField label="HVAC" name="rehabCosts.interior.hvac" value={brrrr.inputs.rehabCosts?.interior?.hvac} onChange={handleChange} />
                    <InputField label="Cabinets/Counter" name="rehabCosts.interior.cabinets" value={brrrr.inputs.rehabCosts?.interior?.cabinets} onChange={handleChange} />
                    <InputField label="Framing" name="rehabCosts.interior.framing" value={brrrr.inputs.rehabCosts?.interior?.framing} onChange={handleChange} />
                    <InputField label="Flooring" name="rehabCosts.interior.flooring" value={brrrr.inputs.rehabCosts?.interior?.flooring} onChange={handleChange} />
                    <InputField label="Basement" name="rehabCosts.interior.basement" value={brrrr.inputs.rehabCosts?.interior?.basement} onChange={handleChange} />
                    <InputField label="Other Int." name="rehabCosts.interior.other" value={brrrr.inputs.rehabCosts?.interior?.other} onChange={handleChange} />
                </div>

                <h5 className="font-medium text-gray-600 mt-4">General</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InputField label="Permits" name="rehabCosts.general.permits" value={brrrr.inputs.rehabCosts?.general?.permits} onChange={handleChange} />
                    <InputField label="Termites" name="rehabCosts.general.termites" value={brrrr.inputs.rehabCosts?.general?.termites} onChange={handleChange} />
                    <InputField label="Mold" name="rehabCosts.general.mold" value={brrrr.inputs.rehabCosts?.general?.mold} onChange={handleChange} />
                    <InputField label="Misc" name="rehabCosts.general.misc" value={brrrr.inputs.rehabCosts?.general?.misc} onChange={handleChange} />
                </div>
            </div>

            {/* Financing */}
            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">Financing (Hard Money/Bridge)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleField label="Is All Cash?" name="financing.isCash" checked={!!brrrr.inputs.financing?.isCash} onChange={handleToggle} />
                    {!brrrr.inputs.financing?.isCash && (
                        <>
                            <InputField label="Loan Amount ($)" name="financing.loanAmount" value={brrrr.inputs.financing?.loanAmount} onChange={handleChange} />
                            <InputField label="Interest Rate (%)" name="financing.interestRate" value={brrrr.inputs.financing?.interestRate} onChange={handleChange} />
                            <InputField label="Points Charged (%)" name="financing.points" value={brrrr.inputs.financing?.points} onChange={handleChange} />
                            <ToggleField label="Interest Only?" name="financing.interestOnly" checked={!!brrrr.inputs.financing?.interestOnly} onChange={handleToggle} />
                            <InputField label="Other Lender Charges ($)" name="financing.otherCharges" value={brrrr.inputs.financing?.otherCharges} onChange={handleChange} />
                            <ToggleField label="Wrap Fees into Loan?" name="financing.wrapFeesIntoLoan" checked={!!brrrr.inputs.financing?.wrapFeesIntoLoan} onChange={handleToggle} />
                        </>
                    )}
                    <InputField label="Rehab Timeline (Months)" name="financing.rehabTimelineMonths" value={brrrr.inputs.financing?.rehabTimelineMonths} onChange={handleChange} />
                    <InputField label="Refinance Timeline (Months)" name="financing.refinanceTimelineMonths" value={brrrr.inputs.financing?.refinanceTimelineMonths} onChange={handleChange} />
                    <InputField label="Monthly Holding Costs ($)" name="holdingCostsMonthly" value={brrrr.inputs.holdingCostsMonthly} onChange={handleChange} />
                </div>
            </div>

            {/* Refinance */}
            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">Refinance</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Refinance LTV (%)" name="refinance.loanLtv" value={brrrr.inputs.refinance?.loanLtv} onChange={handleChange} />
                    <InputField label="Refinance Rate (%)" name="refinance.interestRate" value={brrrr.inputs.refinance?.interestRate} onChange={handleChange} />
                    <InputField label="Refinance Closing Costs ($)" name="refinance.closingCosts" value={brrrr.inputs.refinance?.closingCosts} onChange={handleChange} />
                </div>
            </div>

            {/* Income & Expenses */}
            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2">Income & Expenses (Post-Refi)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Monthly Rent ($)" name="monthlyRent" value={brrrr.inputs.monthlyRent} onChange={handleChange} />
                    <InputField label="Other Monthly Income ($)" name="expenses.otherMonthlyIncome" value={brrrr.inputs.expenses?.otherMonthlyIncome} onChange={handleChange} />
                </div>

                <h5 className="font-medium text-gray-600 mt-4">Operating Expenses</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SliderField label="Vacancy Rate" name="expenses.vacancyRate" value={brrrr.inputs.expenses?.vacancyRate || 0} onChange={(v) => handleSliderChange('expenses.vacancyRate', v)} unit="%" min={0} max={20} step={0.5} />
                    <SliderField label="Maintenance" name="expenses.maintenanceRate" value={brrrr.inputs.expenses?.maintenanceRate || 0} onChange={(v) => handleSliderChange('expenses.maintenanceRate', v)} unit="%" min={0} max={20} step={0.5} />
                    <SliderField label="Management" name="expenses.managementRate" value={brrrr.inputs.expenses?.managementRate || 0} onChange={(v) => handleSliderChange('expenses.managementRate', v)} unit="%" min={0} max={20} step={0.5} />
                    <SliderField label="CapEx" name="expenses.capexRate" value={brrrr.inputs.expenses?.capexRate || 0} onChange={(v) => handleSliderChange('expenses.capexRate', v)} unit="%" min={0} max={20} step={0.5} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <InputField label="Monthly Property Taxes ($)" name="expenses.monthlyTaxes" value={brrrr.inputs.expenses?.monthlyTaxes} onChange={handleChange} />
                    <InputField label="Monthly Insurance ($)" name="expenses.monthlyInsurance" value={brrrr.inputs.expenses?.monthlyInsurance} onChange={handleChange} />
                </div>

                <h5 className="font-medium text-gray-600 mt-4">Utilities & Other</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Water/Sewer ($)" name="expenses.monthlyWaterSewer" value={brrrr.inputs.expenses?.monthlyWaterSewer} onChange={handleChange} />
                    <InputField label="Street Lights ($)" name="expenses.monthlyStreetLights" value={brrrr.inputs.expenses?.monthlyStreetLights} onChange={handleChange} />
                    <InputField label="Gas ($)" name="expenses.monthlyGas" value={brrrr.inputs.expenses?.monthlyGas} onChange={handleChange} />
                    <InputField label="Electric ($)" name="expenses.monthlyElectric" value={brrrr.inputs.expenses?.monthlyElectric} onChange={handleChange} />
                    <InputField label="Landscaping ($)" name="expenses.monthlyLandscaping" value={brrrr.inputs.expenses?.monthlyLandscaping} onChange={handleChange} />
                    <InputField label="HOA Fee ($)" name="expenses.monthlyHoa" value={brrrr.inputs.expenses?.monthlyHoa} onChange={handleChange} />
                    <InputField label="Misc Operating Fees ($)" name="expenses.monthlyMiscFees" value={brrrr.inputs.expenses?.monthlyMiscFees} onChange={handleChange} />
                </div>
            </div>

            <div className="mt-6 no-print">
                {error && <div className="bg-red-100 border border-red-300 text-red-800 text-sm p-3 rounded-md mb-4">{error}</div>}
                <div className="flex justify-end items-center space-x-4">
                    {hasChanges ? (
                        <>
                            <button onClick={onReset} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50">Reset</button>
                            <button onClick={() => onSave()} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-blue-700 disabled:bg-blue-300 flex items-center min-w-[170px] justify-center">
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
