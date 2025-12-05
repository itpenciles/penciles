import React from 'react';
import { Property, Financials } from '../types';
import { calculateMetrics } from '../contexts/PropertyContext';
import { InputField, SelectField, SliderField } from './common/FormFields';

const formatCurrency = (amount: number, precision = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: precision, maximumFractionDigits: precision }).format(amount);

export const AdjustTab = ({ property, setProperty, onSave, onReset, hasChanges, isLoading, error }: { property: Property, setProperty: (p: Property) => void, onSave: () => void, onReset: () => void, hasChanges: boolean, isLoading: boolean, error: string | null }) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newFinancials = { ...property.financials, [name]: Number(value) };
        const newCalculations = calculateMetrics(newFinancials);
        setProperty({ ...property, financials: newFinancials, calculations: newCalculations });
    };

    const handleRentChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = e.target;
        const newRents = [...property.financials.monthlyRents];
        newRents[index] = Number(value);
        const newFinancials = { ...property.financials, monthlyRents: newRents };
        const newCalculations = calculateMetrics(newFinancials);
        setProperty({ ...property, financials: newFinancials, calculations: newCalculations });
    };

    const handleSliderChange = (name: keyof Financials, value: number) => {
        const newFinancials = { ...property.financials, [name]: value };
        const newCalculations = calculateMetrics(newFinancials);
        setProperty({ ...property, financials: newFinancials, calculations: newCalculations });
    };

    const downPaymentAmountValue = property.financials.purchasePrice * (property.financials.downPaymentPercent / 100);

    return (
        <div className="space-y-4">
            <p className="text-sm bg-yellow-50 p-3 rounded-lg text-yellow-800">Adjust the parameters below to model different scenarios. Click "Save Changes" to persist your adjustments.</p>

            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 -mb-2">Purchase & Rehab</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Purchase Price ($)" name="purchasePrice" value={property.financials.purchasePrice} onChange={handleInputChange} />
                    <InputField label="Rehab/Renovation Cost ($)" name="rehabCost" value={property.financials.rehabCost} onChange={handleInputChange} />
                </div>
            </div>

            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 -mb-2">Loan & Closing Costs</h4>
                <SliderField label="Down Payment" displayValue={`${property.financials.downPaymentPercent}% (${formatCurrency(downPaymentAmountValue)})`} name="downPaymentPercent" value={property.financials.downPaymentPercent} onChange={v => handleSliderChange('downPaymentPercent', v)} unit="%" min={0} max={100} step={1} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Loan Interest Rate (%)" name="loanInterestRate" value={property.financials.loanInterestRate} onChange={handleInputChange} />
                    <InputField label="Loan Term (Years)" name="loanTermYears" value={property.financials.loanTermYears} onChange={handleInputChange} />
                    <InputField label="Origination Fee (%)" name="originationFeePercent" value={property.financials.originationFeePercent} onChange={handleInputChange} />
                    <InputField label="Closing Fee ($)" name="closingFee" value={property.financials.closingFee} onChange={handleInputChange} />
                    <InputField label="Processing Fee ($)" name="processingFee" value={property.financials.processingFee} onChange={handleInputChange} />
                    <InputField label="Appraisal Fee ($)" name="appraisalFee" value={property.financials.appraisalFee} onChange={handleInputChange} />
                    <InputField label="Title Fee ($)" name="titleFee" value={property.financials.titleFee} onChange={handleInputChange} />
                    <InputField label="Broker/Agent Fee ($)" name="brokerAgentFee" value={property.financials.brokerAgentFee || 0} onChange={handleInputChange} />
                    <InputField label="Home Warranty Fee ($)" name="homeWarrantyFee" value={property.financials.homeWarrantyFee || 0} onChange={handleInputChange} />
                    <InputField label="Attorney Fee ($)" name="attorneyFee" value={property.financials.attorneyFee || 0} onChange={handleInputChange} />
                    <InputField label="Misc Closing Fees ($)" name="closingMiscFee" value={property.financials.closingMiscFee || 0} onChange={handleInputChange} />
                </div>
            </div>

            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 -mb-2">Credits from Seller</h4>
                <p className="text-xs text-gray-500 -mt-2">These credits reduce your total cash to close.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Taxes Credit ($)" name="sellerCreditTax" value={property.financials.sellerCreditTax || 0} onChange={handleInputChange} />
                    <InputField label="Sewer Credit ($)" name="sellerCreditSewer" value={property.financials.sellerCreditSewer || 0} onChange={handleInputChange} />
                    <InputField label="Origination Fee Credit ($)" name="sellerCreditOrigination" value={property.financials.sellerCreditOrigination || 0} onChange={handleInputChange} />
                    <InputField label="Closing Fees Credit ($)" name="sellerCreditClosing" value={property.financials.sellerCreditClosing || 0} onChange={handleInputChange} />
                    <InputField label="Rents Credit ($)" name="sellerCreditRents" value={property.financials.sellerCreditRents || 0} onChange={handleInputChange} />
                    <InputField label="Security Deposit Credit ($)" name="sellerCreditSecurityDeposit" value={property.financials.sellerCreditSecurityDeposit || 0} onChange={handleInputChange} />
                    <InputField label="Misc Credit ($)" name="sellerCreditMisc" value={property.financials.sellerCreditMisc || 0} onChange={handleInputChange} />
                </div>
            </div>

            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 -mb-2">Income</h4>
                {property.financials.monthlyRents.length > 1 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {property.financials.monthlyRents.map((rent, index) => (
                            <div key={index}>
                                <label className="block text-sm font-medium text-gray-700">Unit {index + 1} Rent ($)</label>
                                <input type="number" value={rent} onChange={(e) => handleRentChange(e, index)} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <InputField label="Monthly Rent ($)" name="monthlyRents" value={property.financials.monthlyRents[0] || 0} onChange={(e) => handleRentChange(e, 0)} />
                )}
            </div>

            <div className="p-4 border rounded-lg space-y-4">
                <h4 className="font-semibold text-gray-700 -mb-2">Operating Expenses</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SliderField label="Vacancy Rate" name="vacancyRate" value={property.financials.vacancyRate} onChange={v => handleSliderChange('vacancyRate', v)} unit="%" min={0} max={30} step={0.5} />
                    <SliderField label="Maintenance" name="maintenanceRate" value={property.financials.maintenanceRate} onChange={v => handleSliderChange('maintenanceRate', v)} unit="%" min={0} max={30} step={0.5} />
                    <SliderField label="Management" name="managementRate" value={property.financials.managementRate} onChange={v => handleSliderChange('managementRate', v)} unit="%" min={0} max={30} step={0.5} />
                    <SliderField label="CapEx" name="capexRate" value={property.financials.capexRate} onChange={v => handleSliderChange('capexRate', v)} unit="%" min={0} max={30} step={0.5} />
                    <InputField label="Monthly Property Taxes ($)" name="monthlyTaxes" value={property.financials.monthlyTaxes} onChange={handleInputChange} />
                    <InputField label="Monthly Insurance ($)" name="monthlyInsurance" value={property.financials.monthlyInsurance} onChange={handleInputChange} />
                </div>
                <h5 className="font-semibold text-gray-600 text-sm pt-2 -mb-2">Utilities & Other</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Water/Sewer ($)" name="monthlyWaterSewer" value={property.financials.monthlyWaterSewer} onChange={handleInputChange} />
                    <InputField label="Street Lights ($)" name="monthlyStreetLights" value={property.financials.monthlyStreetLights} onChange={handleInputChange} />
                    <InputField label="Gas ($)" name="monthlyGas" value={property.financials.monthlyGas} onChange={handleInputChange} />
                    <InputField label="Electric ($)" name="monthlyElectric" value={property.financials.monthlyElectric} onChange={handleInputChange} />
                    <InputField label="Landscaping ($)" name="monthlyLandscaping" value={property.financials.monthlyLandscaping} onChange={handleInputChange} />
                    <InputField label="HOA Fee ($)" name="monthlyHoaFee" value={property.financials.monthlyHoaFee || 0} onChange={handleInputChange} />
                    <InputField label="Misc Operating Fees ($)" name="operatingMiscFee" value={property.financials.operatingMiscFee || 0} onChange={handleInputChange} />
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
