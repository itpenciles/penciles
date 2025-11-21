
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../contexts/AuthContext';
import { Property, Financials, WholesaleInputs, SubjectToInputs, SellerFinancingInputs, Strategy } from '../types';
import { calculateMetrics, calculateWholesaleMetrics, calculateSubjectToMetrics, calculateSellerFinancingMetrics } from '../contexts/PropertyContext';
import { ArrowLeftIcon, CheckIcon, DocumentArrowDownIcon, TableCellsIcon } from '../constants';
import apiClient from '../services/apiClient';

// --- Icons ---
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const formatCurrency = (amount: number, precision = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: precision, maximumFractionDigits: precision }).format(amount);

// --- EXIT STRATEGY DATA ---
interface ExitPoint {
  title: string;
  description: string;
  points: { label: string; items: string[] };
  notes?: string[];
}
const WHOLESALE_EXIT_STRATEGIES: ExitPoint[] = [
    { title: "Assignment of Contract (Traditional Wholesale)", description: "You assign your purchase contract to a cash buyer/investor for a fee.", points: { label: "Example:", items: ["Contract price: $120,000", "Buyer pays: $135,000", "Your assignment fee: $15,000"] }, notes: ["Best when: Seller is fine with assignment, Title is clean, Buyer pool is strong & fast.", "Most common and simplest."] },
    { title: "Double Closing (a.k.a. Double Escrow)", description: "You close on the property first, then immediately resell to your buyer — often same day or within 24–48 hours.", points: { label: "Why do this?", items: ["Hide your wholesale fee", "Useful when your fee is large (e.g. $25k–$100k+)", "Seller or buyer doesn’t allow contract assignment"] }, notes: ["You fund the first closing using: Transactional funding, buyer EMD, or a capital partner."] },
    { title: "Novation Agreement (Wholesale to Retail Buyers)", description: "Instead of assigning, you sign a novation agreement that allows you to market and sell the home on the MLS for the seller — but at a markup.", points: { label: "Advantages:", items: ["Access retail buyers, not only investors", "Works when seller needs max value", "Good for light cosmetic improvements or cleaning"] }, notes: ["Example: Contract at $250k, sell retail at $300k, you earn $50k minus costs.", "Key note: much more paperwork; requires attorney/title expertise."] },
    { title: "Wholetail", description: "Buy the property, do minimal cleanup (trash-out, paint, carpet), and relist on the MLS for retail buyers.", points: { label: "Best when:", items: ["The property only needs light touches", "You can fund the purchase and hold briefly", "You don’t want full rehab headaches"] }, notes: ["Exit to: FHA/VA/conventional buyers."] },
    { title: "JV Wholesale / Co-Wholesale", description: "Partner with another wholesaler who has the deal, the buyer, or the network. You split the assignment fee.", points: { label: "", items: [] }, notes: ["Great for beginners or when expanding into new markets."] },
    { title: "Dispo to Hedge Funds / Portfolio Buyers", description: "Assign or double-close to bulk buyers.", points: { label: "Good for:", items: ["Rental-grade SFRs", "Sunbelt markets", "Fast, predictable closings"] }, notes: [] },
    { title: "Wholesale to Creative Investors", description: "Assign a creative terms deal (Sub-to, Seller Finance, Hybrid).", points: { label: "", items: [] }, notes: ["These can pay higher wholesale spreads because creative buyers have more exit potential."] }
];
const SUBJECT_TO_EXIT_STRATEGIES: ExitPoint[] = [
    { title: "Keep as a Long-Term Rental", description: "You take over the mortgage payments and rent the property out.", points: { label: "Profit sources:", items: ["Monthly cash flow", "Principal paydown on the seller’s loan", "Appreciation", "Tax benefits"] }, notes: ["Best when: low rate loan (2–4%), good rental market."] },
    { title: "Sell with a Wrap Mortgage (Sub-To + Wrap)", description: "You sell the property to a buyer on new seller-financed terms. The buyer pays you, and you pay the original loan.", points: { label: "You profit on:", items: ["Purchase price spread", "Down payment", "Monthly payment spread", "Interest rate spread"] }, notes: ["Example: Take over loan at 3% → Sell at 7% on wrap.", "⚠️ Ensure disclosures, wrap note, and RMLO compliance (if selling to owner-occupant)."] },
    { title: "Lease Option / Rent-to-Own", description: "You keep the loan in place and lease-option to a tenant-buyer.", points: { label: "You collect:", items: ["Option fee upfront", "Monthly rent premium", "Back-end payoff if they exercise the option"] }, notes: ["Advantage: No transfer of legal title until they close."] },
    { title: "Refinance Out Later", description: "You eventually refinance the property into new financing, paying off the seller's loan.", points: { label: "Refinance when:", items: ["Market rates drop", "Value increases (equity unlocked)", "You improve the property (BRRRR-style combo)", "Seasoning requirements are satisfied"] }, notes: [] },
    { title: "Resell Retail (Wholetail or Full Rehab)", description: "You clean, rent, or upgrade the property and then sell it on the MLS.", points: { label: "Good when:", items: ["Strong ARV upside", "Seller was distressed but house is sound", "You want quicker cash than holding long-term"] }, notes: [] },
    { title: "Creative Wholesale (Assign or Novation)", description: "You can assign your sub-to contract to another investor for a fee.", points: { label: "You collect:", items: ["Assignment fee", "OR Novation spread"] }, notes: ["Works great in pre-foreclosure deals."] },
    { title: "Use as STR / MTR", description: "Run the property as an Airbnb, Furnished Rental, or Travel Nurse Rental.", points: { label: "Why sub-to works well here:", items: ["Usually low interest loan → low monthly payment", "Significant cash flow spread possible"] }, notes: ["⚠️ Must confirm city / HOA rules."] },
    { title: "Portfolio Exit", description: "If you scale multiple sub-to properties, you can package and sell them to institutional buyers or transfer them into other assets.", points: { label: "", items: [] }, notes: ["Long-term advanced operator play."] }
];
const SELLER_FINANCING_EXIT_STRATEGIES: ExitPoint[] = [
    { title: "Keep as a Rental", description: "You collect rent and pay the seller their monthly payment.", points: { label: "Benefit from:", items: ["Cash flow", "Appreciation", "Loan paydown", "Tax benefits"] }, notes: ["Best for: long-term holds, low interest seller terms, strong rental markets."] },
    { title: "Wrap Mortgage (Sell on Seller Finance Terms)", description: "You sell the property to a new buyer with a higher interest rate or price while still paying the original seller.", points: { label: "Spread on:", items: ["Purchase price", "Monthly payment", "Down payment"] }, notes: ["This is where seller financing becomes BIG profit when done right.", "Example: Buy at 4% → Sell at 8% → Keep the spread."] },
    { title: "Lease Option / Rent-to-Own to a Tenant-Buyer", description: "You lease the property to someone, giving them the right to buy later.", points: { label: "You collect:", items: ["An option fee upfront ($5k–$20k+)", "Higher-than-market rent", "They handle minor maintenance"] }, notes: ["If they don’t buy—repeat the strategy.", "Best for: C-class neighborhoods, first-time buyer markets."] },
    { title: "Refinance into Traditional Loan", description: "If the property appreciates or you increase NOI, you can refinance into better terms to pay off the seller note and keep long-term financing.", points: { label: "", items: [] }, notes: ["Often done after improving the property or increasing rents (BRRRR-style creative hybrid)."] },
    { title: "Sell Retail (Traditional Listing)", description: "Sell the property on the open market to a conventional buyer, pay off the seller note at closing, and capture appreciation.", points: { label: "Good when:", items: ["Market jumps", "Rehab completed", "You bought under market value"] }, notes: [] },
    { title: "Wholesale the Seller-Financed Deal", description: "Assign or novate the deal to another investor.", points: { label: "You make:", items: ["Assignment fee", "OR Novation spread"] }, notes: ["Yes — you can wholesale creative finance, it’s just paperwork-heavy and needs an investor-friendly closing agent."] },
    { title: "AirBnB / Short-Term Rental / Mid-Term Rental", description: "A high cash flow exit route if the property is in an STR-friendly market and has good seller terms.", points: { label: "", items: [] }, notes: [] },
    { title: "Contract for Deed / Land Contract Exit", description: "Sell it with a land contract instead of a wrap mortgage in certain states.", points: { label: "This gives you:", items: ["Buyer installs their own insurance/taxes", "FASTER eviction process if default (in many states)"] }, notes: [] }
];


const PropertyDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { properties, updateProperty } = useProperties();
    const [property, setProperty] = useState<Property | null>(null);
    const [editedProperty, setEditedProperty] = useState<Property | null>(null);
    const [activeStrategy, setActiveStrategy] = useState<Strategy>('Rental');
    const [isReevaluating, setIsReevaluating] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);


    useEffect(() => {
        if (!id) return;
        const foundProperty = properties.find(p => p.id === id);
        if (foundProperty) {
            setProperty(foundProperty);
            setEditedProperty(JSON.parse(JSON.stringify(foundProperty))); // Deep copy for editing
        }
    }, [id, properties]);
    
    const hasChanges = useMemo(() => {
        if (!property || !editedProperty) return false;
        return JSON.stringify(property) !== JSON.stringify(editedProperty);
    }, [property, editedProperty]);

    const handleSaveChanges = async () => {
        if (!editedProperty || !id) return;
        setIsReevaluating(true);
        setSaveError(null);
        try {
            // The backend will handle the re-evaluation and save the updated property
            await updateProperty(id, { ...editedProperty, recommendation: { ...editedProperty.recommendation, strategyAnalyzed: activeStrategy }});
            alert("Changes Saved & Re-evaluated!");
        } catch (e: any) {
            console.error("Update failed", e);
            setSaveError(e.response?.data?.message || e.message || "Failed to save changes. Please try again.");
        } finally {
            setIsReevaluating(false);
        }
    };
    
    const handleResetChanges = () => {
        if (property) {
            setEditedProperty(JSON.parse(JSON.stringify(property)));
            setSaveError(null);
        }
    };

    if (!property || !editedProperty) {
        return <div className="p-8">Property not found or loading...</div>;
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 print-container">
            {/* Print-only header for a clean report title */}
            <div className="print-only text-center mb-4">
                <h1 className="text-2xl font-bold">{editedProperty.address}</h1>
                <p className="text-base text-gray-700">Investment Analysis Report</p>
                <p className="text-xs text-gray-500">Date Generated: {new Date().toLocaleDateString()}</p>
            </div>

            {/* Screen header is now hidden during printing */}
            <header className="mb-6 no-print">
                <button onClick={() => navigate('/dashboard')} className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back to Dashboard
                </button>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{editedProperty.address}</h1>
                        <p className="text-gray-600">Property Investment Analysis</p>
                    </div>
                    <RecommendationBadge level={editedProperty.recommendation.level} />
                </div>
            </header>

            {/* SCREEN LAYOUT */}
            <div className="flex flex-col lg:flex-row gap-8 property-detail-layout screen-only">
                <div className="flex-grow space-y-8">
                    <PropertyDetailsCard property={editedProperty} />
                    <div className="no-print">
                        <StrategySelector activeStrategy={activeStrategy} setActiveStrategy={setActiveStrategy} />
                    </div>
                    <FinancialAnalysisCard 
                        property={editedProperty} 
                        setProperty={setEditedProperty}
                        activeStrategy={activeStrategy}
                        onSave={handleSaveChanges}
                        onReset={handleResetChanges} 
                        hasChanges={hasChanges}
                        isLoading={isReevaluating}
                        error={saveError}
                    />
                    {activeStrategy === 'Rental' && <InvestmentSummaryBreakdown property={editedProperty} />}
                </div>
                <div className="w-full lg:w-96 flex-shrink-0 space-y-8">
                    <InvestmentRecommendationCard property={editedProperty} />
                    <MarketAnalysisCard property={editedProperty} />
                    <div className="no-print">
                        <GoogleMapCard address={editedProperty.address} />
                    </div>
                </div>
            </div>
            
            {/* PRINT LAYOUT */}
            <div className="print-only print-grid-layout">
                <div className="print-q1">
                    <PropertyDetailsCard property={editedProperty} />
                </div>
                <div className="print-q2">
                    <InvestmentRecommendationCard property={editedProperty} />
                </div>
                <div className="print-q3 printable-card">
                    <h2 className="print-quadrant-title">Financial Analysis: {activeStrategy.replace('-', ' ')}</h2>
                    <MetricsTab property={editedProperty} />
                </div>
                <div className="print-q4">
                    <MarketAnalysisCard property={editedProperty} />
                </div>
                <div className="print-q5 printable-card">
                    <h2 className="print-quadrant-title">Expense &amp; Investment Summary</h2>
                    <ExpensesTab property={editedProperty} />
                    <div className="mt-4">
                        <InvestmentSummaryBreakdown property={editedProperty} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components

const StrategyLockedTooltip: React.FC<{ children: React.ReactNode; isLocked: boolean }> = ({ children, isLocked }) => {
    const navigate = useNavigate();
    if (!isLocked) return <>{children}</>;
    return (
        <div className="relative group">
            {children}
            <div className="absolute bottom-full mb-2 w-60 bg-gray-800 text-white text-xs rounded-lg shadow-lg p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -translate-x-1/2 left-1/2">
                <h4 className="font-bold">This is a Pro Feature</h4>
                <p className="mt-1">Upgrade your plan to use advanced strategy calculators like Wholesale, Sub-To, and Seller Financing.</p>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="mt-2 w-full bg-brand-blue text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 pointer-events-auto"
                >
                    View Plans
                </button>
            </div>
        </div>
    );
};

const ReportLockedTooltip: React.FC<{ children: React.ReactNode; isLocked: boolean; featureName: string }> = ({ children, isLocked, featureName }) => {
    const navigate = useNavigate();
    if (!isLocked) return <>{children}</>;
    return (
        <div className="relative group">
            {children}
            <div className="absolute top-full mt-2 w-60 bg-gray-800 text-white text-xs rounded-lg shadow-lg p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -translate-x-1/2 left-1/2">
                <h4 className="font-bold">{featureName} is a Pro Feature</h4>
                <p className="mt-1">Upgrade your plan to export detailed CSV and PDF reports of your analyses.</p>
                <button
                    onClick={() => navigate('/upgrade')}
                    className="mt-2 w-full bg-brand-blue text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 pointer-events-auto"
                >
                    View Plans
                </button>
            </div>
        </div>
    );
};

const StrategySelector = ({ activeStrategy, setActiveStrategy }: { activeStrategy: Strategy, setActiveStrategy: (s: Strategy) => void }) => {
    const { featureAccess } = useAuth();

    const strategies: { name: Strategy, requiredFeature: keyof typeof featureAccess | null }[] = [
        { name: 'Rental', requiredFeature: null },
        { name: 'Wholesale', requiredFeature: 'canUseWholesale' },
        { name: 'Subject-To', requiredFeature: 'canUseSubjectTo' },
        { name: 'Seller Financing', requiredFeature: 'canUseSellerFinancing' },
    ];

    return (
        <div className="bg-white p-2 rounded-xl shadow-sm printable-card">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 px-4 mb-2 sm:mb-0">Strategy Option</h2>
                <div className="flex flex-wrap border border-gray-200 rounded-lg p-0.5">
                    {strategies.map(({ name, requiredFeature }) => {
                        const isLocked = requiredFeature ? !featureAccess[requiredFeature] : false;
                        return (
                             <StrategyLockedTooltip key={name} isLocked={isLocked}>
                                <button
                                    onClick={() => !isLocked && setActiveStrategy(name)}
                                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeStrategy === name ? 'bg-brand-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'} ${isLocked ? 'cursor-not-allowed opacity-50 bg-gray-100' : ''}`}
                                    disabled={isLocked}
                                >
                                    {name.replace('-', ' ')}
                                </button>
                            </StrategyLockedTooltip>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const RecommendationBadge = ({ level }: { level: Property['recommendation']['level'] }) => {
    const colors = {
        'Worth Pursuing': 'bg-green-100 text-green-800',
        'Moderate Risk': 'bg-yellow-100 text-yellow-800',
        'High Risk': 'bg-red-100 text-red-800',
        'Avoid': 'bg-red-100 text-red-800',
    };
    return <div className={`px-3 py-1 text-sm font-medium rounded-full ${colors[level]}`}>{level}</div>;
};

const DetailItem = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-gray-50 p-3 rounded-lg">
        <span className="block text-xs font-semibold text-gray-500 uppercase">{label}</span>
        <span className="block text-lg font-bold text-gray-800">{value}</span>
    </div>
);

const PropertyDetailsCard = ({ property }: { property: Property }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm printable-card">
        <h2 className="text-xl font-bold text-gray-800 mb-4 print-hide-title">Property Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center mb-4">
            <DetailItem label="Bedrooms" value={property.details.bedrooms.toString()} />
            <DetailItem label="Bathrooms" value={property.details.bathrooms.toString()} />
            <DetailItem label="Sq Ft" value={property.details.sqft.toLocaleString()} />
            <DetailItem label="Year Built" value={property.details.yearBuilt.toString()} />
            <DetailItem label="Units" value={property.details.numberOfUnits.toString()} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm text-gray-500">List Price</span>
                <span className="block text-xl font-bold text-gray-800">{formatCurrency(property.financials.listPrice)}</span>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
                <span className="text-sm text-gray-500">Estimated Value</span>
                <span className="block text-xl font-bold text-brand-blue">{formatCurrency(property.financials.estimatedValue)}</span>
            </div>
        </div>
    </div>
);

const FinancialAnalysisCard = ({ property, setProperty, activeStrategy, onSave, onReset, hasChanges, isLoading, error }: { 
    property: Property, 
    setProperty: React.Dispatch<React.SetStateAction<Property | null>>, 
    activeStrategy: Strategy,
    onSave: () => void, 
    onReset: () => void, 
    hasChanges: boolean,
    isLoading: boolean,
    error: string | null
}) => {
    const [activeTab, setActiveTab] = useState<'metrics' | 'adjust' | 'expenses'>('metrics');

    const handleInputChange = (field: keyof Financials, value: any) => {
        setProperty(prev => {
            if (!prev) return null;
            const updatedFinancials = { ...prev.financials, [field]: parseFloat(value) || 0 };
            return {
                ...prev,
                financials: updatedFinancials,
                calculations: calculateMetrics(updatedFinancials)
            };
        });
    };

    // Handle array inputs (like monthlyRents)
    const handleArrayInputChange = (field: keyof Financials, index: number, value: any) => {
        setProperty(prev => {
            if (!prev) return null;
            const currentArray = prev.financials[field] as number[];
            const newArray = [...currentArray];
            newArray[index] = parseFloat(value) || 0;
            const updatedFinancials = { ...prev.financials, [field]: newArray };
            return {
                ...prev,
                financials: updatedFinancials,
                calculations: calculateMetrics(updatedFinancials)
            };
        });
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm printable-card">
             <div className="flex justify-between items-center mb-6 print-hide-title">
                <h2 className="text-xl font-bold text-gray-800">Financial Analysis</h2>
                <div className="flex bg-gray-100 rounded-lg p-1 no-print">
                    <button onClick={() => setActiveTab('metrics')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'metrics' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Metrics</button>
                    <button onClick={() => setActiveTab('adjust')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'adjust' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Adjust</button>
                    <button onClick={() => setActiveTab('expenses')} className={`px-3 py-1.5 text-sm font-medium rounded-md ${activeTab === 'expenses' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Expenses</button>
                </div>
            </div>

            {activeTab === 'metrics' && <MetricsTab property={property} />}
            {activeTab === 'expenses' && <ExpensesTab property={property} />}
            {activeTab === 'adjust' && (
                 <div className="space-y-6">
                    <h3 className="font-semibold text-gray-700 border-b pb-2">Purchase & Loan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <InputGroup label="Purchase Price" value={property.financials.purchasePrice} onChange={(v) => handleInputChange('purchasePrice', v)} prefix="$" />
                         <InputGroup label="Down Payment %" value={property.financials.downPaymentPercent} onChange={(v) => handleInputChange('downPaymentPercent', v)} suffix="%" />
                         <InputGroup label="Interest Rate" value={property.financials.loanInterestRate} onChange={(v) => handleInputChange('loanInterestRate', v)} suffix="%" />
                         <InputGroup label="Loan Term (Years)" value={property.financials.loanTermYears} onChange={(v) => handleInputChange('loanTermYears', v)} />
                         <InputGroup label="Rehab Cost" value={property.financials.rehabCost} onChange={(v) => handleInputChange('rehabCost', v)} prefix="$" />
                    </div>
                    
                    <h3 className="font-semibold text-gray-700 border-b pb-2 pt-4">Monthly Income & Expenses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {property.financials.monthlyRents.map((rent, idx) => (
                             <InputGroup key={idx} label={`Unit ${idx + 1} Rent`} value={rent} onChange={(v) => handleArrayInputChange('monthlyRents', idx, v)} prefix="$" />
                        ))}
                         <InputGroup label="Vacancy Rate" value={property.financials.vacancyRate} onChange={(v) => handleInputChange('vacancyRate', v)} suffix="%" />
                         <InputGroup label="Management Fee" value={property.financials.managementRate} onChange={(v) => handleInputChange('managementRate', v)} suffix="%" />
                         <InputGroup label="Maintenance" value={property.financials.maintenanceRate} onChange={(v) => handleInputChange('maintenanceRate', v)} suffix="%" />
                         <InputGroup label="CapEx Reserves" value={property.financials.capexRate} onChange={(v) => handleInputChange('capexRate', v)} suffix="%" />
                         <InputGroup label="Property Taxes (Mo)" value={property.financials.monthlyTaxes} onChange={(v) => handleInputChange('monthlyTaxes', v)} prefix="$" />
                         <InputGroup label="Insurance (Mo)" value={property.financials.monthlyInsurance} onChange={(v) => handleInputChange('monthlyInsurance', v)} prefix="$" />
                         <InputGroup label="HOA (Mo)" value={property.financials.monthlyHoaFee} onChange={(v) => handleInputChange('monthlyHoaFee', v)} prefix="$" />
                         <InputGroup label="Utilities (Mo)" value={property.financials.monthlyWaterSewer + property.financials.monthlyGas + property.financials.monthlyElectric} onChange={() => {}} disabled={true} prefix="$" helperText="Edit individual utilities below" />
                    </div>
                    
                    <h3 className="font-semibold text-gray-700 border-b pb-2 pt-4">Utilities Breakdown (Monthly)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputGroup label="Water/Sewer" value={property.financials.monthlyWaterSewer} onChange={(v) => handleInputChange('monthlyWaterSewer', v)} prefix="$" />
                        <InputGroup label="Gas" value={property.financials.monthlyGas} onChange={(v) => handleInputChange('monthlyGas', v)} prefix="$" />
                        <InputGroup label="Electric" value={property.financials.monthlyElectric} onChange={(v) => handleInputChange('monthlyElectric', v)} prefix="$" />
                        <InputGroup label="Landscaping" value={property.financials.monthlyLandscaping} onChange={(v) => handleInputChange('monthlyLandscaping', v)} prefix="$" />
                        <InputGroup label="Street Lights" value={property.financials.monthlyStreetLights} onChange={(v) => handleInputChange('monthlyStreetLights', v)} prefix="$" />
                    </div>

                    <h3 className="font-semibold text-gray-700 border-b pb-2 pt-4">Closing Costs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputGroup label="Origination Fee %" value={property.financials.originationFeePercent} onChange={(v) => handleInputChange('originationFeePercent', v)} suffix="%" />
                        <InputGroup label="Appraisal" value={property.financials.appraisalFee} onChange={(v) => handleInputChange('appraisalFee', v)} prefix="$" />
                        <InputGroup label="Title" value={property.financials.titleFee} onChange={(v) => handleInputChange('titleFee', v)} prefix="$" />
                        <InputGroup label="Broker/Agent Fee" value={property.financials.brokerAgentFee} onChange={(v) => handleInputChange('brokerAgentFee', v)} prefix="$" />
                        <InputGroup label="Home Warranty" value={property.financials.homeWarrantyFee} onChange={(v) => handleInputChange('homeWarrantyFee', v)} prefix="$" />
                        <InputGroup label="Attorney" value={property.financials.attorneyFee} onChange={(v) => handleInputChange('attorneyFee', v)} prefix="$" />
                        <InputGroup label="Misc Closing" value={property.financials.closingMiscFee} onChange={(v) => handleInputChange('closingMiscFee', v)} prefix="$" />
                    </div>

                    <h3 className="font-semibold text-gray-700 border-b pb-2 pt-4">Credits from Seller</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <InputGroup label="Tax Proration" value={property.financials.sellerCreditTax} onChange={(v) => handleInputChange('sellerCreditTax', v)} prefix="$" />
                        <InputGroup label="Sewer Proration" value={property.financials.sellerCreditSewer} onChange={(v) => handleInputChange('sellerCreditSewer', v)} prefix="$" />
                        <InputGroup label="Origination Fees" value={property.financials.sellerCreditOrigination} onChange={(v) => handleInputChange('sellerCreditOrigination', v)} prefix="$" />
                        <InputGroup label="Closing Costs" value={property.financials.sellerCreditClosing} onChange={(v) => handleInputChange('sellerCreditClosing', v)} prefix="$" />
                        <InputGroup label="Rental Credit" value={property.financials.sellerCreditRental} onChange={(v) => handleInputChange('sellerCreditRental', v)} prefix="$" />
                        <InputGroup label="Security Deposit Credit" value={property.financials.sellerCreditTenantSecurityDeposit} onChange={(v) => handleInputChange('sellerCreditTenantSecurityDeposit', v)} prefix="$" />
                        <InputGroup label="Misc Credit" value={property.financials.sellerCreditMisc} onChange={(v) => handleInputChange('sellerCreditMisc', v)} prefix="$" />
                    </div>
                 </div>
            )}

            {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded">
                    {error}
                </div>
            )}

            {/* Sticky Save Bar */}
            <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg transform transition-transform duration-300 z-50 flex justify-between items-center ${hasChanges ? 'translate-y-0' : 'translate-y-full'}`}>
                <div className="container mx-auto max-w-6xl flex justify-between items-center">
                    <span className="text-gray-700 font-medium">You have unsaved changes.</span>
                    <div className="flex space-x-4">
                        <button onClick={onReset} className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">Reset</button>
                        <button 
                            onClick={onSave} 
                            disabled={isLoading}
                            className="px-6 py-2 bg-brand-blue text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center"
                        >
                            {isLoading ? 'Re-evaluating with AI...' : 'Save & Re-evaluate'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, value, onChange, prefix, suffix, disabled = false, helperText }: any) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <div className="relative rounded-md shadow-sm">
            {prefix && <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{prefix}</span></div>}
            <input
                type="number"
                value={value === 0 ? '' : value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder="0"
                className={`focus:ring-brand-blue focus:border-brand-blue block w-full sm:text-sm border-gray-300 rounded-md py-2 ${prefix ? 'pl-7' : 'pl-3'} ${suffix ? 'pr-7' : 'pr-3'} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {suffix && <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-gray-500 sm:text-sm">{suffix}</span></div>}
        </div>
        {helperText && <p className="mt-1 text-xs text-gray-400">{helperText}</p>}
    </div>
);

const MetricsTab = ({ property }: { property: Property }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
            <MetricRow label="Cap Rate" value={`${property.calculations.capRate.toFixed(2)}%`} highlight={property.calculations.capRate > 6} />
            <MetricRow label="Cash on Cash Return" value={`${property.calculations.cashOnCashReturn.toFixed(2)}%`} highlight={property.calculations.cashOnCashReturn > 10} />
            <MetricRow label="Monthly Cash Flow" value={formatCurrency(property.calculations.monthlyCashFlowWithDebt)} highlight={property.calculations.monthlyCashFlowWithDebt > 0} />
            <MetricRow label="Net Operating Income (Annual)" value={formatCurrency(property.calculations.netOperatingIncome * 12)} />
            <MetricRow label="Gross Rent Multiplier (GRM)" value={(property.financials.purchasePrice / property.calculations.grossAnnualRent).toFixed(2)} />
        </div>
        <div className="space-y-4">
            <MetricRow label="Total Cash to Close" value={formatCurrency(property.calculations.totalCashToClose)} />
            <MetricRow label="Monthly Mortgage" value={formatCurrency(property.calculations.monthlyDebtService)} />
            <MetricRow label="Operating Expense Ratio" value={`${((property.calculations.totalOperatingExpenses * 12) / property.calculations.grossAnnualRent * 100).toFixed(1)}%`} />
            <MetricRow label="DSCR" value={property.calculations.dscr.toFixed(2)} highlight={property.calculations.dscr > 1.25} />
            <MetricRow label="1% Rule" value={`${((property.calculations.grossAnnualRent / 12) / property.financials.purchasePrice * 100).toFixed(2)}%`} highlight={((property.calculations.grossAnnualRent / 12) / property.financials.purchasePrice * 100) >= 1} />
        </div>
    </div>
);

const ExpensesTab = ({ property }: { property: Property }) => (
    <div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <ExpenseRow label="Property Taxes" value={property.financials.monthlyTaxes} />
            <ExpenseRow label="Insurance" value={property.financials.monthlyInsurance} />
            <ExpenseRow label="Vacancy" value={property.calculations.vacancyLoss / 12} subLabel={`(${property.financials.vacancyRate}%)`} />
            <ExpenseRow label="Maintenance" value={property.calculations.maintenanceCost} subLabel={`(${property.financials.maintenanceRate}%)`} />
            <ExpenseRow label="Management" value={property.calculations.managementCost} subLabel={`(${property.financials.managementRate}%)`} />
            <ExpenseRow label="CapEx" value={property.calculations.capexCost} subLabel={`(${property.financials.capexRate}%)`} />
            <ExpenseRow label="HOA" value={property.financials.monthlyHoaFee} />
            <ExpenseRow label="Utilities" value={property.financials.monthlyWaterSewer + property.financials.monthlyGas + property.financials.monthlyElectric + property.financials.monthlyLandscaping + property.financials.monthlyStreetLights} />
            <div className="col-span-2 border-t pt-2 mt-2 font-bold flex justify-between">
                <span>Total Monthly Expenses</span>
                <span>{formatCurrency(property.calculations.totalOperatingExpenses + property.calculations.monthlyDebtService)}</span>
            </div>
        </div>
    </div>
);

const MetricRow = ({ label, value, highlight = false }: { label: string, value: string, highlight?: boolean }) => (
    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
        <span className="text-gray-600 text-sm">{label}</span>
        <span className={`font-bold ${highlight ? 'text-green-600' : 'text-gray-900'}`}>{value}</span>
    </div>
);

const ExpenseRow = ({ label, value, subLabel }: { label: string, value: number, subLabel?: string }) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-600">{label} <span className="text-xs text-gray-400">{subLabel}</span></span>
        <span className="font-medium">{formatCurrency(value)}</span>
    </div>
);

const InvestmentSummaryBreakdown = ({ property }: { property: Property }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm printable-card">
        <h3 className="font-bold text-gray-800 mb-4">Cash to Close Breakdown</h3>
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span>Down Payment ({property.financials.downPaymentPercent}%)</span>
                <span>{formatCurrency(property.calculations.downPaymentAmount)}</span>
            </div>
            <div className="flex justify-between">
                <span>Est. Rehab Costs</span>
                <span>{formatCurrency(property.financials.rehabCost)}</span>
            </div>
            <div className="flex justify-between">
                <span>Closing Costs & Fees</span>
                <span>{formatCurrency(property.calculations.totalClosingCosts)}</span>
            </div>
             {/* Calculate total seller credits from the 4 separate fields for display logic */}
            <div className="flex justify-between text-green-600">
                <span>Less: Total Seller Credits</span>
                <span>-{formatCurrency(
                    (property.financials.sellerCreditTax || 0) + 
                    (property.financials.sellerCreditSewer || 0) + 
                    (property.financials.sellerCreditOrigination || 0) + 
                    (property.financials.sellerCreditClosing || 0) +
                    (property.financials.sellerCreditRental || 0) +
                    (property.financials.sellerCreditTenantSecurityDeposit || 0) +
                    (property.financials.sellerCreditMisc || 0)
                )}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 mt-2 text-base">
                <span>Total Cash Required</span>
                <span>{formatCurrency(property.calculations.totalCashToClose)}</span>
            </div>
        </div>
    </div>
);

const InvestmentRecommendationCard = ({ property }: { property: Property }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-brand-blue printable-card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">AI Recommendation</h2>
        <div className="mb-4">
            <RecommendationBadge level={property.recommendation.level} />
        </div>
        <p className="text-gray-700 font-medium mb-4">{property.recommendation.summary}</p>
        
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Key Factors</h3>
        <ul className="space-y-2 mb-4">
            {property.recommendation.keyFactors.map((factor, i) => (
                <li key={i} className="flex items-start text-sm text-gray-600">
                    <CheckCircleIcon className="h-5 w-5 text-brand-blue mr-2 flex-shrink-0" />
                    {factor}
                </li>
            ))}
        </ul>
        
        <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Notes</h3>
        <p className="text-sm text-gray-500 italic">{property.recommendation.additionalNotes}</p>
    </div>
);

const MarketAnalysisCard = ({ property }: { property: Property }) => {
    const safetyColor = property.marketAnalysis.safetyScore >= 80 ? 'text-green-600' : property.marketAnalysis.safetyScore >= 60 ? 'text-yellow-600' : 'text-red-600';
    const investColor = property.marketAnalysis.investmentScore >= 8 ? 'text-green-600' : property.marketAnalysis.investmentScore >= 5 ? 'text-yellow-600' : 'text-red-600';

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm printable-card">
             <h2 className="text-xl font-bold text-gray-800 mb-4">Market Analysis</h2>
             <div className="flex justify-between items-center mb-4 border-b pb-4">
                <div>
                    <span className="block text-sm text-gray-500">Safety Score</span>
                    <span className={`text-2xl font-bold ${safetyColor}`}>{property.marketAnalysis.safetyScore}/100</span>
                </div>
                 <div>
                    <span className="block text-sm text-gray-500">Investment Score</span>
                    <span className={`text-2xl font-bold ${investColor}`}>{property.marketAnalysis.investmentScore}/10</span>
                </div>
             </div>
             <div>
                <span className="block text-sm text-gray-500 mb-2">Area Average Rents</span>
                <div className="space-y-1">
                    {property.marketAnalysis.areaAverageRents.length > 0 ? (
                        property.marketAnalysis.areaAverageRents.map((rent, i) => (
                             <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-600">Unit {i + 1} Comparable</span>
                                <span className="font-medium">{formatCurrency(rent)}</span>
                            </div>
                        ))
                    ) : (
                        <span className="text-sm text-gray-400 italic">Data unavailable</span>
                    )}
                </div>
             </div>
        </div>
    );
};

const GoogleMapCard = ({ address }: { address: string }) => {
    const encodedAddress = encodeURIComponent(address);
    return (
        <div className="bg-gray-100 rounded-xl overflow-hidden h-64 shadow-sm relative group">
            <iframe
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.API_KEY}&q=${encodedAddress}`}
            ></iframe>
            <a 
                href={`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute bottom-2 right-2 bg-white px-3 py-1 rounded shadow-md text-xs font-semibold text-blue-600 hover:bg-blue-50 opacity-90 hover:opacity-100"
            >
                Open in Google Maps
            </a>
        </div>
    );
};

export default PropertyDetail;
