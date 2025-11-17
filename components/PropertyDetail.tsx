import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { Property, Financials, WholesaleInputs, SubjectToInputs, SellerFinancingInputs, Strategy } from '../types';
import { calculateMetrics, calculateWholesaleMetrics, calculateSubjectToMetrics, calculateSellerFinancingMetrics } from '../contexts/PropertyContext';
import { ArrowLeftIcon, CheckIcon, DocumentArrowDownIcon } from '../constants';

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
            <div className="print-only text-center mb-8">
                <h1 className="text-3xl font-bold">{editedProperty.address}</h1>
                <p className="text-lg text-gray-700">Investment Analysis Report</p>
                <p className="text-sm text-gray-500">Date Generated: {new Date().toLocaleDateString()}</p>
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

            <div className="flex flex-col lg:flex-row gap-8 property-detail-layout">
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
        </div>
    );
};

// Sub-components
const StrategySelector = ({ activeStrategy, setActiveStrategy }: { activeStrategy: Strategy, setActiveStrategy: (s: Strategy) => void }) => {
    const strategies: Strategy[] = ['Rental', 'Wholesale', 'Subject-To', 'Seller Financing'];
    return (
        <div className="bg-white p-2 rounded-xl shadow-sm printable-card">
            <div className="flex flex-col sm:flex-row justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 px-4 mb-2 sm:mb-0">Strategy Option</h2>
                <div className="flex flex-wrap border border-gray-200 rounded-lg p-0.5">
                    {strategies.map(strategy => (
                        <button
                            key={strategy}
                            onClick={() => setActiveStrategy(strategy)}
                            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeStrategy === strategy ? 'bg-brand-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            {strategy.replace('-', ' ')}
                        </button>
                    ))}
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

const PropertyDetailsCard = ({ property }: { property: Property }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm printable-card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Property Details</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center mb-4">
            <DetailItem label="Bedrooms" value={property.details.bedrooms.toString()} />
            <DetailItem label="Bathrooms" value={property.details.bathrooms.toString()} />
            <DetailItem label="Sq Ft" value={property.details.sqft.toLocaleString()} />
            <DetailItem label="Year Built" value={property.details.yearBuilt.toString()} />
            <DetailItem label="Units" value={property.details.numberOfUnits.toString()} />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">List Price</p>
                <p className="text-lg font-bold text-gray-800">{formatCurrency(property.financials.listPrice)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Estimated Value</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(property.financials.estimatedValue)}</p>
            </div>
        </div>
    </div>
);
const DetailItem = ({ label, value }: { label: string, value: string }) => (
    <div className="bg-gray-50 p-3 rounded-lg">
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
    </div>
);

const InvestmentRecommendationCard = ({ property }: { property: Property }) => {
    const { recommendation } = property;
    const strategyText = recommendation.strategyAnalyzed
        ? `Based on "${recommendation.strategyAnalyzed.replace('-', ' ')}" strategy`
        : 'Based on "Rental" strategy';
    
    // FEATURE: Determine if the analyzed strategy is 'Rental' to conditionally show metrics.
    const isRentalStrategy = recommendation.strategyAnalyzed === 'Rental';

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200 printable-card">
            <div className="flex items-start mb-2">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Investment Recommendation</h2>
                    <p className="text-sm text-gray-500">{strategyText}</p>
                </div>
            </div>
            <div className="mb-4 ml-9">
                 <RecommendationBadge level={property.recommendation.level} />
            </div>

            <p className="text-sm text-gray-600 mb-4 ml-9">{property.recommendation.summary}</p>
            
            <div className="mb-4 ml-9">
                <h3 className="font-semibold text-gray-700 mb-2">Key Factors:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {property.recommendation.keyFactors.map((factor, i) => <li key={i}>{factor}</li>)}
                </ul>
            </div>
            
            <div className="mb-4 ml-9">
                <h3 className="font-semibold text-gray-700 mb-2">Additional Notes:</h3>
                <p className="text-sm text-gray-600">{property.recommendation.additionalNotes}</p>
            </div>

            {/* FEATURE: Only show Cap Rate and Cash Flow for the Rental strategy. */}
            {isRentalStrategy && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                     <div className="text-center">
                        <p className="text-sm text-gray-500">Cap Rate (Adjusted)</p>
                        <p className="text-lg font-bold text-green-600">{property.calculations.capRate.toFixed(1)}%</p>
                    </div>
                     <div className="text-center">
                        <p className="text-sm text-gray-500">Monthly Cash Flow (Adjusted)</p>
                        <p className="text-lg font-bold text-green-600">{formatCurrency(property.calculations.monthlyCashFlowWithDebt)}</p>
                    </div>
                </div>
            )}
        </div>
    );
};


const MarketAnalysisCard = ({ property }: { property: Property }) => {
    const { safetyScore } = property.marketAnalysis;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm printable-card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Market Analysis</h2>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700">Safety Score</span>
                        <span><span className="font-bold">{safetyScore}</span>/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{width: `${safetyScore}%`}}></div></div>
                    <p className="text-xs text-gray-500 mt-1">Average crime levels</p>
                </div>
                 <div>
                    <h3 className="font-semibold text-gray-700 mb-2">
                        Rental Market Breakdown
                        <span className="text-xs font-normal text-gray-500 ml-2">(per unit)</span>
                    </h3>
                    <div className="space-y-2">
                        {property.financials.monthlyRents.map((rent, index) => {
                            const unitDetail = property.details.unitDetails?.[index];
                            const areaAverageRent = property.marketAnalysis.areaAverageRents?.[index] || 0;
                            const rentDifference = rent - areaAverageRent;
                            const isPositive = rentDifference >= 0;

                            const unitLabel = property.details.numberOfUnits > 1 ? `Unit ${index + 1}` : 'Single Unit';
                            const unitSpecs = unitDetail ? `(${unitDetail.bedrooms} bed / ${unitDetail.bathrooms} bath)` : '';

                            return (
                                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-800">
                                            {unitLabel} <span className="text-xs font-normal text-gray-500">{unitSpecs}</span>
                                        </span>
                                        <span className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                            {isPositive ? '+' : ''}{formatCurrency(rentDifference)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-gray-500">
                                        <span>
                                            Your Rent: <span className="font-semibold text-gray-700">{formatCurrency(rent)}</span>
                                        </span>
                                        <span>
                                            Market Avg: <span className="font-semibold text-gray-700">{formatCurrency(areaAverageRent)}</span>
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Location Factors</h3>
                    <div className="text-sm space-y-1">
                         <div className="flex justify-between"><span className="text-gray-500">Property Type</span><span className="font-semibold">{property.propertyType}</span></div>
                         <div className="flex justify-between"><span className="text-gray-500">Investment Score</span><span className="font-semibold">{property.marketAnalysis.investmentScore}/10</span></div>
                    </div>
                </div>
            </div>
        </div>
    )
};

const GoogleMapCard = ({ address }: { address: string }) => {
    const encodedAddress = encodeURIComponent(address);
    const mapSrc = `https://www.google.com/maps?q=${encodedAddress}&layer=c&output=svembed`;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm printable-card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Location & Street View</h2>
            <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                <iframe
                    src={mapSrc}
                    className="w-full h-full"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Google Street View of ${address}`}
                ></iframe>
            </div>
        </div>
    );
};

// --- Financial Analysis Card and Children ---
const FinancialAnalysisCard = ({ property, setProperty, activeStrategy, onSave, onReset, hasChanges, isLoading, error }: { property: Property, setProperty: (p: Property) => void, activeStrategy: Strategy, onSave: () => void, onReset: () => void, hasChanges: boolean, isLoading: boolean, error: string | null }) => {
    // FIX: Explicitly setting the type for useState to prevent `activeTab` from being inferred as `any`.
    const [activeTab, setActiveTab] = useState<string>('Metrics');

    useEffect(() => {
        setActiveTab('Metrics');
    }, [activeStrategy]);

    const handlePrint = () => {
        window.print();
    };

    const renderTabs = () => {
        const tabs = activeStrategy === 'Rental'
            ? ['Metrics', 'Expenses', 'Adjust']
            : ['Metrics', 'Parameters'];

        return (
            <div className="flex border border-gray-200 rounded-lg p-0.5">
                {tabs.map(tab => (
                    <TabButton key={tab} name={tab} activeTab={activeTab} setActiveTab={setActiveTab} />
                ))}
            </div>
        );
    };

    const renderContent = () => {
        const commonProps = {
            property,
            setProperty,
            onSave,
            onReset,
            hasChanges,
            isLoading,
            error,
        };

        switch (activeStrategy) {
            case 'Wholesale':
                if (activeTab === 'Metrics') return <WholesaleMetricsTab {...commonProps} />;
                if (activeTab === 'Parameters') return <WholesaleParamsTab {...commonProps} />;
                return null;
            case 'Subject-To':
                if (activeTab === 'Metrics') return <SubjectToMetricsTab {...commonProps} />;
                if (activeTab === 'Parameters') return <SubjectToParamsTab {...commonProps} />;
                return null;
            case 'Seller Financing':
                if (activeTab === 'Metrics') return <SellerFinancingMetricsTab {...commonProps} />;
                if (activeTab === 'Parameters') return <SellerFinancingParamsTab {...commonProps} />;
                return null;
            case 'Rental':
            default:
                if (activeTab === 'Metrics') return <MetricsTab property={property} />;
                if (activeTab === 'Expenses') return <ExpensesTab property={property} />;
                if (activeTab === 'Adjust') return <AdjustTab property={property} setProperty={setProperty} onSave={onSave} onReset={onReset} hasChanges={hasChanges} isLoading={isLoading} error={error} />;
                return null;
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm printable-card">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">Financial Analysis: {activeStrategy.replace('-', ' ')}</h2>
                <div className="flex items-center space-x-2">
                    <div className="no-print">{renderTabs()}</div>
                    <button onClick={handlePrint} title="Print Report" className="p-2 text-gray-500 hover:bg-gray-100 rounded-md no-print">
                        <DocumentArrowDownIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            {/* Content for screen view */}
            <div className="screen-only">{renderContent()}</div>
            {/* Content for print view */}
            <div className="print-only">
                {activeStrategy === 'Rental' && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Key Metrics</h3>
                            <MetricsTab property={property} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Expense Breakdown</h3>
                            <ExpensesTab property={property} />
                        </div>
                    </div>
                )}
                {activeStrategy === 'Wholesale' && <WholesaleMetricsTab property={property} />}
                {activeStrategy === 'Subject-To' && <SubjectToMetricsTab property={property} />}
                {activeStrategy === 'Seller Financing' && <SellerFinancingMetricsTab property={property} />}
            </div>
        </div>
    );
};

// FIX: Changed to a React.FC to correctly handle the 'key' prop when used in a map.
const TabButton: React.FC<{ name: string, activeTab: string, setActiveTab: (name: string) => void}> = ({ name, activeTab, setActiveTab }) => (
    <button onClick={() => setActiveTab(name)} className={`px-4 py-1 text-sm font-semibold rounded-md transition-colors ${activeTab === name ? 'bg-brand-blue text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
        {name}
    </button>
);

const MetricBox = ({ label, value, description, color }: { label: string, value: string | number, description: string, color: string}) => {
    const colorClasses = {
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    };
    const c = colorClasses[color as keyof typeof colorClasses] || colorClasses.green;
    return (
        <div className={`p-4 rounded-lg ${c.bg} border ${c.border}`}>
            <p className="text-sm text-gray-500">{label}</p>
            <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
            <p className="text-xs text-gray-500">{description}</p>
        </div>
    );
}

// --- RENTAL STRATEGY COMPONENTS ---

const MetricsTab = ({ property }: { property: Property }) => {
    const calcs = property.calculations;
    const { monthlyDebtService, dscr } = calcs;

    const dscrValue = monthlyDebtService > 0 ? dscr.toFixed(2) : 'N/A';
    const dscrColor = monthlyDebtService === 0 || dscr >= 1.2 ? 'green' : 'red';

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricBox label="Cap Rate" value={`${calcs.capRate.toFixed(1)}%`} description="Annual return on purchase price" color="green" />
            <MetricBox label="All-in Cap Rate" value={`${calcs.allInCapRate.toFixed(1)}%`} description="Annual return including rehab costs" color="green" />
            <MetricBox 
                label="Cash-on-Cash Return" 
                value={`${calcs.cashOnCashReturn.toFixed(1)}%`} 
                description="Return on total cash invested (incl. rehab)" 
                color={calcs.cashOnCashReturn >= 8 ? 'green' : 'red'} 
            />
            <MetricBox 
                label="Cash Flow (With Debt)" 
                value={formatCurrency(calcs.monthlyCashFlowWithDebt)} 
                description="Net monthly cash after debt service" 
                color={calcs.monthlyCashFlowWithDebt > 0 ? 'green' : 'red'} 
            />
            <MetricBox 
                label="DSCR" 
                value={dscrValue} 
                description="Debt Service Coverage Ratio" 
                color={dscrColor} 
            />
            <MetricBox 
                label="Monthly Cash Flow (No Debt)" 
                value={formatCurrency(calcs.monthlyCashFlowNoDebt)} 
                description="Net monthly income before debt" 
                color="green" 
            />
        </div>
    );
};

const ExpensesTab = ({ property }: { property: Property }) => {
    const calcs = property.calculations;
    const { 
        monthlyTaxes, monthlyInsurance, monthlyWaterSewer, monthlyStreetLights, 
        monthlyGas, monthlyElectric, monthlyLandscaping, vacancyRate, 
        maintenanceRate, managementRate, capexRate, monthlyHoaFee, operatingMiscFee
    } = property.financials;
    const totalMonthlyRent = property.financials.monthlyRents.reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-4 text-sm">
            <div className="p-4 bg-green-50 rounded-lg space-y-2">
                <ExpenseRow label="Gross Monthly Rent" value={formatCurrency(totalMonthlyRent)} />
                <ExpenseRow label="Gross Annual Rent" value={formatCurrency(calcs.grossAnnualRent)} />
                <ExpenseRow label={`Less: Vacancy (${vacancyRate}%)`} value={`-${formatCurrency(calcs.vacancyLoss / 12)}/month`} isSub />
                <ExpenseRow label="Effective Gross Income" value={formatCurrency(calcs.effectiveGrossIncome / 12)} isTotal />
            </div>
            <div className="p-4 bg-red-50 rounded-lg space-y-2">
                 <h4 className="font-semibold text-gray-700">Operating Expenses</h4>
                 {/* FIX: Removed Vacancy Loss from this section to avoid confusion/double-counting appearance. */}
                 <ExpenseRow label={`Maintenance & Repairs (${maintenanceRate}%)`} value={`${formatCurrency(calcs.maintenanceCost)}/month`} valueYear={`${formatCurrency(calcs.maintenanceCost*12)}/year`} isSub />
                 <ExpenseRow label={`Property Management (${managementRate}%)`} value={`${formatCurrency(calcs.managementCost)}/month`} valueYear={`${formatCurrency(calcs.managementCost*12)}/year`} isSub />
                 <ExpenseRow label={`CapEx Reserves (${capexRate}%)`} value={`${formatCurrency(calcs.capexCost)}/month`} valueYear={`${formatCurrency(calcs.capexCost*12)}/year`} isSub />
                 <ExpenseRow label="Property Taxes" value={`${formatCurrency(monthlyTaxes)}/month`} valueYear={`${formatCurrency(monthlyTaxes * 12)}/year`} isSub />
                 <ExpenseRow label="Insurance" value={`${formatCurrency(monthlyInsurance)}/month`} valueYear={`${formatCurrency(monthlyInsurance*12)}/year`} isSub />
                 <ExpenseRow label="HOA Fee" value={`${formatCurrency(monthlyHoaFee)}/month`} valueYear={`${formatCurrency(monthlyHoaFee*12)}/year`} isSub />
                 <ExpenseRow label="Misc. Fees" value={`${formatCurrency(operatingMiscFee)}/month`} valueYear={`${formatCurrency(operatingMiscFee*12)}/year`} isSub />
                 <h5 className="font-semibold text-gray-600 text-xs uppercase pt-2">Utilities</h5>
                 <ExpenseRow label="Water/Sewer" value={`${formatCurrency(monthlyWaterSewer)}/month`} valueYear={`${formatCurrency(monthlyWaterSewer*12)}/year`} isSub />
                 <ExpenseRow label="Street Lights" value={`${formatCurrency(monthlyStreetLights)}/month`} valueYear={`${formatCurrency(monthlyStreetLights*12)}/year`} isSub />
                 <ExpenseRow label="Gas" value={`${formatCurrency(monthlyGas)}/month`} valueYear={`${formatCurrency(monthlyGas*12)}/year`} isSub />
                 <ExpenseRow label="Electric" value={`${formatCurrency(monthlyElectric)}/month`} valueYear={`${formatCurrency(monthlyElectric*12)}/year`} isSub />
                 <ExpenseRow label="Landscaping" value={`${formatCurrency(monthlyLandscaping)}/month`} valueYear={`${formatCurrency(monthlyLandscaping*12)}/year`} isSub />
                 <ExpenseRow label="Total Operating Expenses" value={`${formatCurrency(calcs.totalOperatingExpenses)}/month`} valueYear={`${formatCurrency(calcs.totalOperatingExpenses * 12)}/year`} isTotal isNegative />
            </div>
             <div className="p-4 bg-blue-50 rounded-lg space-y-2">
                 <ExpenseRow label="Effective Gross Income" value={formatCurrency(calcs.effectiveGrossIncome / 12)} />
                 <ExpenseRow label="Less: Operating Expenses" value={`-${formatCurrency(calcs.totalOperatingExpenses)}`} isSub />
                 <ExpenseRow label="Net Operating Income (NOI)" value={formatCurrency(calcs.netOperatingIncome)} isTotal />
                 <ExpenseRow label="Monthly Cash Flow" value={formatCurrency(calcs.monthlyCashFlowNoDebt)} isTotal />
            </div>
        </div>
    );
};
const ExpenseRow = ({ label, value, valueYear, isSub=false, isTotal=false, isNegative=false } : {label:string, value:string, valueYear?: string, isSub?:boolean, isTotal?:boolean, isNegative?:boolean}) => (
    <div className={`flex justify-between items-center ${isTotal ? 'pt-2 border-t border-gray-300/50' : ''}`}>
        <span className={`${isSub ? 'pl-4' : ''} ${isTotal ? 'font-bold' : ''} text-gray-600`}>{label}</span>
        <div className="text-right">
            <span className={`font-semibold ${isTotal && !isNegative ? 'text-gray-900' : ''} ${isNegative ? 'text-red-600' : ''}`}>{value}</span>
            {valueYear && <span className="text-xs text-gray-500 ml-2">{valueYear}</span>}
        </div>
    </div>
);

const AdjustTab = ({ property, setProperty, onSave, onReset, hasChanges, isLoading, error }: { property: Property, setProperty: (p: Property) => void, onSave: () => void, onReset: () => void, hasChanges: boolean, isLoading: boolean, error: string | null }) => {
    
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
            
            <SaveChangesFooter onSave={onSave} onReset={onReset} hasChanges={hasChanges} isLoading={isLoading} error={error} />
        </div>
    );
};

// --- STRATEGY EXIT GUIDE COMPONENT ---
const ExitStrategyGuide = ({ title, strategies }: { title: string, strategies: ExitPoint[] }) => (
    <div className="mt-8">
        <h3 className="text-xl font-bold text-gray-800 mb-4">{title}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strategies.map((strategy, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow duration-300">
                    <h4 className="font-bold text-gray-900 text-base mb-2">{index + 1}) {strategy.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{strategy.description}</p>
                    {strategy.points.items.length > 0 && (
                        <div className="mb-3">
                            <p className="font-semibold text-sm text-gray-700">{strategy.points.label}</p>
                            <ul className="mt-1 space-y-1.5">
                                {strategy.points.items.map((point, i) => (
                                    <li key={i} className="flex items-start">
                                        <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                                        <span className="text-sm text-gray-600" dangerouslySetInnerHTML={{ __html: point.replace(/→/g, '<span class="mx-1 font-bold">→</span>') }}></span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {strategy.notes && strategy.notes.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {strategy.notes.map((note, i) => (
                                <p key={i} className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded-md">{note}</p>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </div>
);


// --- WHOLESALE STRATEGY COMPONENTS ---

const CalculationRow = ({ label, value, isSubTotal=false, isTotal=false, isNegative=false, color='default' } : {label:string, value:string, isSubTotal?:boolean, isTotal?:boolean, isNegative?:boolean, color?: 'green' | 'red' | 'default' }) => {
    const colorClasses = {
        green: 'text-green-600',
        red: 'text-red-600',
        default: 'text-gray-900',
    };
    
    return (
        <div className={`flex justify-between items-center ${isTotal || isSubTotal ? 'pt-2 border-t' : ''} ${isSubTotal ? 'border-dashed border-gray-300' : ''} ${isTotal ? 'border-gray-300' : ''}`}>
            <span className={`${isTotal ? 'font-semibold' : ''} text-gray-600`}>{label}</span>
            <span className={`font-semibold ${isTotal ? `font-bold text-lg ${colorClasses[color]}` : 'text-gray-800'} ${isNegative ? 'text-red-600' : ''}`}>
                {isNegative ? `-${value}` : value}
            </span>
        </div>
    );
};

const WholesaleMetricsTab = ({ property }: { property: Property }) => {
    const inputs = property.wholesaleAnalysis?.inputs;
    const calcs = property.wholesaleAnalysis?.calculations;

    if (!calcs || !inputs) return null;

    const grossOfferPrice = inputs.arv * (inputs.maoPercentOfArv / 100);

    return (
        <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">MAO Calculation Breakdown</h3>
                <div className="space-y-2 text-sm">
                    <CalculationRow label="After Repair Value (ARV)" value={formatCurrency(inputs.arv)} />
                    <CalculationRow label={`x MAO Percentage (${inputs.maoPercentOfArv}%)`} value={formatCurrency(grossOfferPrice)} isSubTotal={true} />
                    <CalculationRow label="Less: Estimated Rehab" value={formatCurrency(inputs.estimatedRehab)} isNegative={true} />
                    <CalculationRow label="Less: Closing Costs" value={formatCurrency(inputs.closingCost)} isNegative={true} />
                    <CalculationRow label="Less: Your Wholesale Fee Goal" value={formatCurrency(inputs.wholesaleFeeGoal)} isNegative={true} />
                    <CalculationRow label="Max Allowable Offer (MAO)" value={formatCurrency(calcs.mao)} isTotal={true} />
                </div>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50/50">
                 <h3 className="text-lg font-semibold text-gray-800 mb-3">Deal Analysis</h3>
                 <div className="space-y-2 text-sm">
                    <CalculationRow label="Your Max Allowable Offer (MAO)" value={formatCurrency(calcs.mao)} />
                    <CalculationRow label="Less: Seller's Asking Price" value={formatCurrency(inputs.sellerAsk)} isNegative={true} />
                    <CalculationRow label="Potential Wholesale Fee (Spread)" value={formatCurrency(calcs.potentialFees)} isTotal={true} color={calcs.potentialFees >= 0 ? 'green' : 'red'} />
                 </div>
                 <div className={`mt-4 p-3 rounded-lg flex items-center justify-center text-center ${calcs.isEligible ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    <span className="font-bold text-lg">{calcs.isEligible ? 'This deal is eligible!' : 'This deal is NOT eligible based on your MAO.'}</span>
                 </div>
            </div>
            <div className="screen-only">
                <ExitStrategyGuide title="Wholesale Exit Options" strategies={WHOLESALE_EXIT_STRATEGIES} />
            </div>
        </div>
    );
};


const WholesaleParamsTab = ({ property, setProperty, onSave, onReset, hasChanges, isLoading, error }: { property: Property, setProperty: (p: Property) => void, onSave: () => void, onReset: () => void, hasChanges: boolean, isLoading: boolean, error: string | null }) => {
    const inputs = property.wholesaleAnalysis?.inputs;
    if (!inputs) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const newInputs = { ...inputs, [name]: type === 'checkbox' ? checked : Number(value) };
        const newCalculations = calculateWholesaleMetrics(newInputs);
        setProperty({ ...property, wholesaleAnalysis: { inputs: newInputs, calculations: newCalculations } });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="ARV ($)" name="arv" value={inputs.arv} onChange={handleInputChange} />
                <InputField label="Estimated Rehab ($)" name="estimatedRehab" value={inputs.estimatedRehab} onChange={handleInputChange} />
                <InputField label="MAO (% of ARV)" name="maoPercentOfArv" value={inputs.maoPercentOfArv} onChange={handleInputChange} />
                <InputField label="Closing Cost ($)" name="closingCost" value={inputs.closingCost} onChange={handleInputChange} />
                <InputField label="Wholesale Fee Goal ($)" name="wholesaleFeeGoal" value={inputs.wholesaleFeeGoal} onChange={handleInputChange} />
                <InputField label="Seller Ask ($)" name="sellerAsk" value={inputs.sellerAsk} onChange={handleInputChange} />
            </div>
            <ToggleField label="Assignable Contract?" name="isAssignable" checked={inputs.isAssignable} onChange={handleInputChange} />
            <SaveChangesFooter onSave={onSave} onReset={onReset} hasChanges={hasChanges} isLoading={isLoading} error={error} />
        </div>
    );
};

// --- SUBJECT-TO STRATEGY COMPONENTS ---

const SubjectToMetricsTab = ({ property }: { property: Property }) => {
    const inputs = property.subjectToAnalysis?.inputs;
    const calcs = property.subjectToAnalysis?.calculations;
    if (!calcs || !inputs) return null;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricBox label="Total Cash Needed" value={formatCurrency(calcs.cashNeeded)} description="Upfront cash to close the deal" color="blue" />
                <MetricBox label="Monthly Spread" value={formatCurrency(calcs.monthlySpread)} description="Market Rent minus existing PITI" color={calcs.monthlySpread > 0 ? 'green' : 'red'} />
                <MetricBox label="Blended CoC Return" value={`${calcs.cashOnCashReturn.toFixed(1)}%`} description="Annualized return on cash needed" color={calcs.cashOnCashReturn > 0 ? 'green' : 'red'} />
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Cash Needed Breakdown</h3>
                <div className="space-y-2 text-sm">
                    <CalculationRow label="Reinstatement Needed" value={formatCurrency(inputs.reinstatementNeeded)} />
                    <CalculationRow label="Seller Cash Needed" value={formatCurrency(inputs.sellerCashNeeded)} />
                    <CalculationRow label="Closing Costs" value={formatCurrency(inputs.closingCosts)} />
                    <CalculationRow label="Total Cash Needed to Close" value={formatCurrency(calcs.cashNeeded)} isTotal={true} />
                </div>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Spread Breakdown</h3>
                <div className="space-y-2 text-sm">
                    <CalculationRow label="Market Rent" value={formatCurrency(inputs.marketRent)} />
                    <CalculationRow label="Less: Existing Monthly PITI" value={formatCurrency(inputs.monthlyPITI)} isNegative={true} />
                    <CalculationRow label="Net Monthly Spread" value={formatCurrency(calcs.monthlySpread)} isTotal={true} color={calcs.monthlySpread > 0 ? 'green' : 'red'} />
                </div>
            </div>

            <div className="screen-only">
                <ExitStrategyGuide title="Subject-To Exit Options" strategies={SUBJECT_TO_EXIT_STRATEGIES} />
            </div>
        </div>
    );
};

const SubjectToParamsTab = ({ property, setProperty, onSave, onReset, hasChanges, isLoading, error }: { property: Property, setProperty: (p: Property) => void, onSave: () => void, onReset: () => void, hasChanges: boolean, isLoading: boolean, error: string | null }) => {
    const inputs = property.subjectToAnalysis?.inputs;
    if (!inputs) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newInputs = { ...inputs, [name]: Number(value) };
        const newCalculations = calculateSubjectToMetrics(newInputs);
        setProperty({ ...property, subjectToAnalysis: { inputs: newInputs, calculations: newCalculations } });
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Existing Loan Balance ($)" name="existingLoanBalance" value={inputs.existingLoanBalance} onChange={handleInputChange} />
                <InputField label="Existing Loan Rate (%)" name="existingLoanRate" value={inputs.existingLoanRate} onChange={handleInputChange} />
                <InputField label="Monthly PITI ($)" name="monthlyPITI" value={inputs.monthlyPITI} onChange={handleInputChange} />
                <InputField label="Reinstatement Needed ($)" name="reinstatementNeeded" value={inputs.reinstatementNeeded} onChange={handleInputChange} />
                <InputField label="Seller Cash Needed ($)" name="sellerCashNeeded" value={inputs.sellerCashNeeded} onChange={handleInputChange} />
                <InputField label="Closing Costs ($)" name="closingCosts" value={inputs.closingCosts} onChange={handleInputChange} />
                <InputField label="Market Rent ($)" name="marketRent" value={inputs.marketRent} onChange={handleInputChange} />
            </div>
            <SaveChangesFooter onSave={onSave} onReset={onReset} hasChanges={hasChanges} isLoading={isLoading} error={error} />
        </div>
    );
};

// --- SELLER FINANCING STRATEGY COMPONENTS ---

const SellerFinancingMetricsTab = ({ property }: { property: Property }) => {
    const inputs = property.sellerFinancingAnalysis?.inputs;
    const calcs = property.sellerFinancingAnalysis?.calculations;
    if (!calcs || !inputs) return null;

    const loanAmount = inputs.purchasePrice - inputs.downPayment;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricBox label="Monthly Payment" value={formatCurrency(calcs.monthlyPayment)} description="Payment to the seller" color="blue" />
                <MetricBox label="Spread vs. Market Rent" value={formatCurrency(calcs.spreadVsMarketRent)} description="Cash flow potential" color={calcs.spreadVsMarketRent > 0 ? 'green' : 'red'} />
                <MetricBox label="Return on Down Payment" value={`${calcs.returnOnDp.toFixed(1)}%`} description="Annualized return on DP" color={calcs.returnOnDp > 0 ? 'green' : 'red'} />
            </div>
            
            <div className="p-4 border rounded-lg bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Monthly Payment Calculation</h3>
                <div className="space-y-2 text-sm">
                    <CalculationRow label="Purchase Price" value={formatCurrency(inputs.purchasePrice)} />
                    <CalculationRow label="Less: Down Payment" value={formatCurrency(inputs.downPayment)} isNegative={true} />
                    <CalculationRow label="Loan Amount" value={formatCurrency(loanAmount)} isSubTotal={true} />
                    <div className="text-xs text-gray-500 pt-2 text-center">
                        Calculated based on a {inputs.loanTerm}-year term at {inputs.sellerLoanRate}% interest ({inputs.paymentType})
                    </div>
                    <CalculationRow label="Seller Financed Monthly Payment" value={formatCurrency(calcs.monthlyPayment)} isTotal={true} />
                </div>
            </div>

            <div className="p-4 border rounded-lg bg-gray-50/50">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Spread & Return Breakdown</h3>
                <div className="space-y-2 text-sm">
                    <CalculationRow label="Market Rent" value={formatCurrency(inputs.marketRent)} />
                    <CalculationRow label="Less: Monthly Payment" value={formatCurrency(calcs.monthlyPayment)} isNegative={true} />
                    <CalculationRow label="Spread vs Market Rent" value={formatCurrency(calcs.spreadVsMarketRent)} isTotal={true} color={calcs.spreadVsMarketRent > 0 ? 'green' : 'red'} />
                </div>
            </div>

            <div className="screen-only">
                <ExitStrategyGuide title="Seller Financing Exit Options" strategies={SELLER_FINANCING_EXIT_STRATEGIES} />
            </div>
        </div>
    );
};

const SellerFinancingParamsTab = ({ property, setProperty, onSave, onReset, hasChanges, isLoading, error }: { property: Property, setProperty: (p: Property) => void, onSave: () => void, onReset: () => void, hasChanges: boolean, isLoading: boolean, error: string | null }) => {
    const inputs = property.sellerFinancingAnalysis?.inputs;
    if (!inputs) return null;

    // FIX: Split the handler into two separate functions to resolve the Babel parsing error.
    const handleNumberInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const newInputs = { ...inputs, [name]: Number(value) };
        const newCalculations = calculateSellerFinancingMetrics(newInputs);
        setProperty({ ...property, sellerFinancingAnalysis: { inputs: newInputs, calculations: newCalculations } });
    };
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newInputs = { ...inputs, [name]: value as 'Amortization' | 'Interest Only' };
        const newCalculations = calculateSellerFinancingMetrics(newInputs);
        setProperty({ ...property, sellerFinancingAnalysis: { inputs: newInputs, calculations: newCalculations } });
    };


    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Purchase Price ($)" name="purchasePrice" value={inputs.purchasePrice} onChange={handleNumberInputChange} />
                <InputField label="Down Payment ($)" name="downPayment" value={inputs.downPayment} onChange={handleNumberInputChange} />
                <InputField label="Seller Loan Rate (%)" name="sellerLoanRate" value={inputs.sellerLoanRate} onChange={handleNumberInputChange} />
                <InputField label="Loan Term (Years)" name="loanTerm" value={inputs.loanTerm} onChange={handleNumberInputChange} />
                <InputField label="Balloon (Years, 0 if none)" name="balloonYears" value={inputs.balloonYears} onChange={handleNumberInputChange} />
                <InputField label="Market Rent ($)" name="marketRent" value={inputs.marketRent} onChange={handleNumberInputChange} />
                <SelectField 
                    label="Payment Type" 
                    name="paymentType" 
                    value={inputs.paymentType} 
                    onChange={handleSelectChange}
                    options={['Amortization', 'Interest Only']}
                />
            </div>
            <SaveChangesFooter onSave={onSave} onReset={onReset} hasChanges={hasChanges} isLoading={isLoading} error={error} />
        </div>
    );
};


// --- COMMON & UTILITY COMPONENTS ---

const SaveChangesFooter = ({ onSave, onReset, hasChanges, isLoading, error }: { onSave: () => void, onReset: () => void, hasChanges: boolean, isLoading: boolean, error: string | null }) => (
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
);


const InputField = ({ label, name, value, onChange, type = "number" }: { label: string, name: string, value: number | string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} name={name} value={value} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue" />
    </div>
);

const SelectField = ({ label, name, value, onChange, options }: { label: string, name: string, value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, options: string[] }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <select name={name} value={value} onChange={onChange} className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue bg-white">
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
);

const ToggleField = ({ label, name, checked, onChange }: { label: string, name: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="flex items-center">
        <label htmlFor={name} className="flex items-center cursor-pointer">
            <div className="relative">
                <input type="checkbox" id={name} name={name} className="sr-only" checked={checked} onChange={onChange} />
                <div className={`block w-14 h-8 rounded-full ${checked ? 'bg-brand-blue' : 'bg-gray-200'}`}></div>
                <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'transform translate-x-6' : ''}`}></div>
            </div>
            <div className="ml-3 text-sm font-medium text-gray-700">{label}</div>
        </label>
    </div>
);


const SliderField = ({ label, name, value, onChange, unit, min, max, step, displayValue }: { label: string, name: keyof Financials, value: number, onChange: (v: number) => void, unit: string, min: number, max: number, step: number, displayValue?: string }) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}: <span className="font-bold">{displayValue || `${value}${unit}`}</span></label>
        <input type="range" name={name} value={value} onChange={(e) => onChange(Number(e.target.value))} min={min} max={max} step={step} className="mt-1 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue" />
    </div>
);

const InvestmentSummaryBreakdown = ({ property }: { property: Property }) => {
    const calcs = property.calculations;
    const financials = property.financials; // Get financials for itemized costs
    const totalMonthlyRent = financials.monthlyRents.reduce((a, b) => a + b, 0);
    const totalSellerCredits = (financials.sellerCreditTax || 0) + (financials.sellerCreditSewer || 0) + (financials.sellerCreditOrigination || 0) + (financials.sellerCreditClosing || 0);
    const originationFeeAmount = calcs.loanAmount * (financials.originationFeePercent / 100);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm printable-card">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Investment Summary (Rental Strategy)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                {/* Upfront Costs Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Upfront Costs (Cash to Close)</h3>
                    <div className="space-y-2 text-sm">
                        <SummaryRow label="Down Payment" value={formatCurrency(calcs.downPaymentAmount)} />
                        <SummaryRow label="Rehab Cost" value={formatCurrency(financials.rehabCost)} />
                        <h4 className="font-semibold text-gray-600 text-xs uppercase pt-2">Closing Costs</h4>
                        <SummaryRow label="Origination Fee" value={formatCurrency(originationFeeAmount)} isSub />
                        <SummaryRow label="Closing Fee" value={formatCurrency(financials.closingFee)} isSub />
                        <SummaryRow label="Processing Fee" value={formatCurrency(financials.processingFee)} isSub />
                        <SummaryRow label="Appraisal Fee" value={formatCurrency(financials.appraisalFee)} isSub />
                        <SummaryRow label="Title Fee" value={formatCurrency(financials.titleFee)} isSub />
                        <SummaryRow label="Broker/Agent Fee" value={formatCurrency(financials.brokerAgentFee || 0)} isSub />
                        <SummaryRow label="Home Warranty Fee" value={formatCurrency(financials.homeWarrantyFee || 0)} isSub />
                        <SummaryRow label="Attorney Fee" value={formatCurrency(financials.attorneyFee || 0)} isSub />
                        <SummaryRow label="Misc. Fees" value={formatCurrency(financials.closingMiscFee || 0)} isSub />
                        <SummaryRow label="Total Closing Costs" value={formatCurrency(calcs.totalClosingCosts)} isSubTotal />
                        <SummaryRow label="Less: Seller Credits" value={formatCurrency(totalSellerCredits)} isNegative />
                        <SummaryRow label="Total Cash To Close" value={formatCurrency(calcs.totalCashToClose)} isTotal />
                    </div>
                </div>
                {/* Monthly Cash Flow Section */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 pb-2 border-b">Monthly Cash Flow</h3>
                    <div className="space-y-2 text-sm">
                        <SummaryRow label="Gross Rent" value={formatCurrency(totalMonthlyRent)} />
                        <SummaryRow label="Operating Expenses" value={formatCurrency(calcs.totalOperatingExpenses)} isNegative />
                        <SummaryRow label="Net Operating Income" value={formatCurrency(calcs.netOperatingIncome)} isSubTotal />
                        <SummaryRow label="Debt Service" value={formatCurrency(calcs.monthlyDebtService)} isNegative />
                        <SummaryRow label="Net Cash Flow" value={formatCurrency(calcs.monthlyCashFlowWithDebt)} isTotal />
                    </div>
                </div>
            </div>
        </div>
    );
};
const SummaryRow = ({ label, value, isTotal = false, isSubTotal = false, isNegative = false, isSub = false }: { label: string, value: string, isTotal?: boolean, isSubTotal?: boolean, isNegative?: boolean, isSub?: boolean }) => {
    const baseClasses = "flex justify-between items-center";
    const totalClasses = isTotal ? "pt-2 mt-2 border-t font-bold" : "";
    const subTotalClasses = isSubTotal ? "pt-2 mt-2 border-t" : "";
    
    return (
        <div className={`${baseClasses} ${totalClasses} ${subTotalClasses}`}>
            <span className={`text-gray-600 ${isTotal ? 'text-gray-800' : ''} ${isSub ? 'pl-4' : ''}`}>{label}</span>
            <span className={`font-semibold ${isTotal ? 'text-lg text-gray-900' : 'text-gray-700'} ${isNegative ? 'text-red-600' : ''}`}>{isNegative ? '-' + value: value}</span>
        </div>
    );
};


export default PropertyDetail;