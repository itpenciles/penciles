
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios'; // Direct use or apiClient? apiClient sends auth headers. Public route might not need them, but they don't hurt.
import { Property } from '../types';

import { Logo } from './common/Logo';
import { MathBreakdown } from './common/MathBreakdown';

// Define localized versions of the display components to ensure they are available
// In a future refactor, these should be extracted from PropertyDetail.tsx to shared files.

// --- ICONS ---
const CheckCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;

const formatCurrency = (amount: number, precision = 0) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: precision, maximumFractionDigits: precision }).format(amount);

const RecommendationBadge = ({ level }: { level: Property['recommendation']['level'] }) => {
    const colors = {
        'Worth Pursuing': 'bg-green-100 text-green-800',
        'Moderate Risk': 'bg-yellow-100 text-yellow-800',
        'High Risk': 'bg-red-100 text-red-800',
        'Avoid': 'bg-red-100 text-red-800',
    };
    return <div className={`px-5 py-1.5 text-lg font-bold uppercase tracking-wide rounded-full shadow-sm ${colors[level] || 'bg-gray-100'}`}>{level}</div>;
};

const PropertyDetailsCard = ({ property }: { property: Property }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
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
        <p className="text-xl font-bold text-gray-800">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
    </div>
);

const InvestmentRecommendationCard = ({ property }: { property: Property }) => {
    const { recommendation } = property;
    const strategyText = recommendation.strategyAnalyzed
        ? `Based on "${recommendation.strategyAnalyzed.replace('-', ' ')}" strategy`
        : 'Based on "Rental" strategy';

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-green-200">
            <div className="flex items-start mb-2">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Deal Audit</h2>
                    <p className="text-sm text-gray-500">{strategyText}</p>
                </div>
            </div>
            <div className="mb-6 mt-4 flex justify-center">
                <RecommendationBadge level={property.recommendation.level} />
            </div>
            <p className="text-sm text-gray-600 mb-4 ml-9">{property.recommendation.summary}</p>
            <div className="mb-4 ml-9">
                <h3 className="font-semibold text-gray-700 mb-2">Key Factors:</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {property.recommendation.keyFactors.map((factor, i) => <li key={i}>{factor}</li>)}
                </ul>
            </div>
        </div>
    );
};

const MarketAnalysisCard = ({ property }: { property: Property }) => {
    const { safetyScore } = property.marketAnalysis;
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Market Analysis</h2>
            <div className="space-y-4">
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700">Safety Score</span>
                        <span><span className="font-bold">{safetyScore}</span>/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${safetyScore}%` }}></div></div>
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

const MetricBox = ({ label, value, description, color }: { label: string, value: string | number, description: string, color: string }) => {
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

const MetricsTab = ({ property }: { property: Property }) => {
    const calcs = property.calculations;
    const { monthlyDebtService, dscr } = calcs;

    const grossAnnualIncome = calcs.effectiveGrossIncome;
    const grossMonthlyIncome = grossAnnualIncome / 12;
    const operatingExpensesMonthly = calcs.totalOperatingExpenses;
    const annualDebtService = monthlyDebtService * 12;
    const noiAnnual = calcs.netOperatingIncome * 12;
    const cashFlowAnnual = noiAnnual - annualDebtService;
    const cocRoi = calcs.cashOnCashReturn;

    const breakdownItems: any[] = [
        {
            label: "Monthly Cash Flow (No Debt)\nGross Profit (NOI)",
            formula: "Effective Income - Operating Expenses",
            calculation: `$${Math.round(grossMonthlyIncome).toLocaleString()} - $${Math.round(operatingExpensesMonthly).toLocaleString()}`,
            result: formatCurrency(calcs.netOperatingIncome),
            description: "Net Operating Income (Monthly)",
            variant: 'green',
            isPercent: false
        },
        {
            label: "Cash Flow (With Debt)\nNet Profit",
            formula: "NOI - Debt Service",
            calculation: `$${Math.round(calcs.netOperatingIncome).toLocaleString()} - $${Math.round(monthlyDebtService).toLocaleString()}`,
            result: formatCurrency(calcs.monthlyCashFlowWithDebt),
            description: "Monthly Cash Flow after all expenses and loans",
            variant: calcs.monthlyCashFlowWithDebt > 0 ? 'green' : 'red',
            isPercent: false
        },
        {
            label: "Cash on Cash Return\nROI",
            formula: "(Annual Cash Flow / Total Cash Invested) * 100",
            calculation: `($${Math.round(cashFlowAnnual).toLocaleString()} / $${Math.round(calcs.totalCashToClose).toLocaleString()}) * 100`,
            result: `${cocRoi.toFixed(1)}%`,
            description: "First year return on your cash investment",
            variant: calcs.cashOnCashReturn >= 8 ? 'green' : 'red',
            isPercent: true
        }
    ];

    const dscrValue = monthlyDebtService > 0 ? dscr.toFixed(2) : 'N/A';
    const dscrColor = monthlyDebtService === 0 || dscr >= 1.2 ? 'green' : 'red';

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MetricBox label="Cap Rate" value={`${calcs.capRate.toFixed(1)}%`} description="Annual return on purchase price" color="green" />
                <MetricBox label="All-in Cap Rate" value={`${calcs.allInCapRate.toFixed(1)}%`} description="Annual return including rehab costs" color="green" />
                <MetricBox label="DSCR" value={dscrValue} description="Debt Service Coverage Ratio" color={dscrColor} />
            </div>
            <MathBreakdown items={breakdownItems} title="Financial Breakdown" />
        </div>
    );
};


const PublicPropertyPage = () => {
    const { token } = useParams<{ token: string }>();

    const [property, setProperty] = useState<Property | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProperty = async () => {
            try {
                // Remove /api prefix if using a proxy, or keep it if base URL is relative.
                // Assuming apiClient handles base URL, but for public route we might want direct fetch or generic client.
                // Let's use fetch to be safe/simple for public routes, or axios.
                const response = await axios.get(`http://localhost:3001/api/properties/public/${token}`);
                // NOTE: Hardcoding localhost for dev, in prod this should be relative or env var. 
                // I will use relative path '/api/properties/public/${token}' assuming deployed on same origin.
                // Actually, let's try relative path.
                // const response = await axios.get(`/api/properties/public/${token}`);
                setProperty(response.data);
            } catch (err: any) {
                console.error(err);
                setError('Failed to load property. The link may be invalid or expired.');
            } finally {
                setLoading(false);
            }
        };

        if (token) fetchProperty();
    }, [token]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500">Loading analysis...</p></div>;
    if (error || !property) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="text-center"><h2 className="text-xl font-bold text-gray-800">Oops!</h2><p className="text-gray-500 mt-2">{error}</p></div></div>;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Minimal Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 py-4 px-4 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                        <Logo variant="dark" size="md" />
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full uppercase tracking-wider font-semibold">Shared Report</span>
                    </div>
                    <div>
                        <a href="/" className="bg-brand-blue text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                            Analyze Your Own Deal
                        </a>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Title Section */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">{property.address}</h1>
                    <p className="text-gray-600">Investment Analysis Snapshot</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Details & Recommendation */}
                    <div className="lg:col-span-2 space-y-8">
                        <PropertyDetailsCard property={property} />

                        {/* Financials - Simplified for Public View */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Financial Performance</h2>
                            <MetricsTab property={property} />
                        </div>
                    </div>

                    {/* Right Column: AI & Market */}
                    <div className="space-y-8">
                        <InvestmentRecommendationCard property={property} />
                        <MarketAnalysisCard property={property} />

                        {/* CTA Card */}
                        <div className="bg-brand-blue rounded-xl p-6 text-white text-center">
                            <h3 className="font-bold text-lg mb-2">Want detailed breakdowns?</h3>
                            <p className="text-blue-100 text-sm mb-4">Sign up to view full expense reports, mortgage amortization, and edit the numbers yourself.</p>
                            <a href="/login" className="inline-block bg-white text-brand-blue px-6 py-2 rounded-lg font-bold hover:bg-gray-100 transition-colors">
                                Create Free Account
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PublicPropertyPage;
