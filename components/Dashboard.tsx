import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../contexts/AuthContext';
import { PlusIcon, ChartBarIcon, ArrowTrendingUpIcon, BanknotesIcon, ExclamationTriangleIcon, LockClosedIcon } from '../constants';
import { Property, SubscriptionTier } from '../types';

const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

const truncateAddress = (address: string, limit: number = 25) => {
    if (address.length <= limit) return address;
    return address.slice(0, limit) + '...';
};

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
    isLocked: boolean;
    userTier: SubscriptionTier | undefined;
    isArchived?: boolean;
}

const PropertyRow: React.FC<PropertyRowProps> = React.memo(({ property, isSelected, onSelect, onDelete, isLocked, userTier, isArchived }) => {
    const navigate = useNavigate();
    const { calculations, recommendation } = property;

    // Risk Color Logic: Orange for High Risk/Avoid
    let recBadgeColor = 'bg-gray-100 text-gray-800';
    if (recommendation?.level === 'Worth Pursuing') recBadgeColor = 'bg-green-100 text-green-800';
    else if (recommendation?.level === 'Moderate Risk') recBadgeColor = 'bg-yellow-100 text-yellow-800';
    else if (recommendation?.level === 'High Risk' || recommendation?.level === 'Avoid') recBadgeColor = 'bg-orange-100 text-orange-800'; // Changed to Orange

    const rowOpacity = isLocked || isArchived ? 'opacity-60 bg-gray-50' : 'hover:bg-gray-50';
    const textColor = isLocked || isArchived ? 'text-gray-500' : 'text-gray-800';

    const isFreeTier = !userTier || userTier === 'Free';

    return (
        <tr className={`border-b border-gray-200 ${rowOpacity}`}>
            <td className="py-3 px-4">
                <div className="flex items-center">
                    {!isArchived && (
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue disabled:bg-gray-100 disabled:cursor-not-allowed"
                            checked={isSelected}
                            onChange={() => onSelect(property.id)}
                            disabled={isLocked}
                        />
                    )}
                    <div className={isArchived ? 'ml-0' : 'ml-4'}>
                        <p className={`font-semibold ${textColor}`} title={property.address}>
                            {truncateAddress(property.address)}
                        </p>
                        <p className="text-sm text-gray-500">{property.propertyType}</p>
                    </div>
                </div>
            </td>
            <td className="py-3 px-4 text-sm text-gray-600">{property.dateAnalyzed}</td>
            {/* Strategy Column */}
            <td className="py-3 px-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {recommendation?.strategyAnalyzed || 'Rental'}
                </span>
            </td>
            <td className={`py-3 px-4 text-sm font-semibold ${isLocked || isArchived ? 'text-gray-400' : 'text-green-600'}`}>{calculations.capRate.toFixed(1)}%</td>
            <td className={`py-3 px-4 text-sm font-semibold ${isLocked || isArchived ? 'text-gray-400' : 'text-gray-700'}`}>{formatCurrency(calculations.monthlyCashFlowNoDebt)}</td>
            <td className={`py-3 px-4 text-sm font-semibold ${isLocked || isArchived ? 'text-gray-400' : 'text-red-600'}`}>{calculations.cashOnCashReturn.toFixed(1)}%</td>
            <td className="py-3 px-4">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${isLocked || isArchived ? 'bg-gray-200 text-gray-500' : recBadgeColor}`}>
                    {recommendation?.level}
                </span>
            </td>
            <td className="py-3 px-4">
                {isArchived ? (
                    <span className="text-xs text-red-600 font-medium bg-red-50 px-2 py-1 rounded">
                        Deleted on {property.deletedAt ? new Date(property.deletedAt).toLocaleDateString() : 'Unknown'}
                    </span>
                ) : (
                    <div className="flex items-center space-x-2">
                        {isLocked ? (
                            <button
                                onClick={() => navigate('/upgrade')}
                                className="p-1.5 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-md group relative"
                                title="Upgrade to view"
                            >
                                <LockClosedIcon className="h-5 w-5" />
                                <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                                    Upgrade to View
                                </span>
                            </button>
                        ) : (
                            <button
                                onClick={() => {
                                    if (property.id) {
                                        navigate(`/property/${property.id}`);
                                    } else {
                                        console.error("Property ID is missing", property);
                                        alert("Error: Property ID is missing. Cannot navigate.");
                                    }
                                }}
                                className="p-1.5 text-gray-500 hover:bg-gray-200 rounded-md"
                                disabled={!property.id}
                                title={!property.id ? "Invalid Property ID" : "View Details"}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" /></svg>
                            </button>
                        )}

                        <button
                            onClick={() => onDelete(property.id, property.address)}
                            disabled={isFreeTier}
                            className={`p-1.5 rounded-md ${isFreeTier ? 'text-gray-300 cursor-not-allowed' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}
                            title={isFreeTier ? "Free tier analyses are permanent records. Upgrade to manage portfolio." : "Delete property"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                )}
            </td>
        </tr>
    );
});

const CompareButtonWrapper: React.FC<{ children: React.ReactNode; canCompare: boolean }> = ({ children, canCompare }) => {
    const navigate = useNavigate();
    if (canCompare) {
        return <>{children}</>;
    }
    return (
        <div className="relative group">
            {children}
            <div className="absolute bottom-full mb-2 w-60 bg-gray-800 text-white text-xs rounded-lg shadow-lg p-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none right-0">
                <h4 className="font-bold">Property Comparison is a Starter feature</h4>
                <p className="mt-1">Upgrade your plan to compare properties side-by-side.</p>
                <button
                    onClick={() => navigate('/pricing')}
                    className="mt-2 w-full bg-brand-blue text-white px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700 pointer-events-auto"
                >
                    View Plans
                </button>
            </div>
        </div>
    );
};

type SortKey = 'capRate' | 'cashFlow' | 'cashOnCash' | 'recommendation' | 'strategy';
type SortDirection = 'asc' | 'desc';

import MobileDashboard from './MobileDashboard';
import { useMobile } from '../hooks/useMobile';

const Dashboard = () => {
    const navigate = useNavigate();
    const { properties, deleteProperty, loading, error } = useProperties();
    const { user, featureAccess } = useAuth();
    const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
    const isMobile = useMobile();

    if (isMobile) {
        return <MobileDashboard />;
    }

    // Sorting and Filtering State
    const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection }>({ key: null, direction: 'desc' });
    const [filterRecommendation, setFilterRecommendation] = useState<string>('All');

    // Separate Active vs Archived properties
    const activeProperties = useMemo(() => properties.filter(p => !p.deletedAt), [properties]);
    const archivedProperties = useMemo(() => properties.filter(p => p.deletedAt), [properties]);

    const avgCapRate = activeProperties.length > 0 ? activeProperties.reduce((acc, p) => acc + p.calculations.capRate, 0) / activeProperties.length : 0;
    const highRiskProperties = activeProperties.filter(p => p.recommendation?.level === 'High Risk' || p.recommendation?.level === 'Avoid').length;

    const totalProperties = activeProperties.length;
    const positiveCashFlowCount = activeProperties.filter(p => p.calculations.monthlyCashFlowWithDebt > 0).length;

    const recommendationCounts = activeProperties.reduce((acc, p) => {
        const level = p.recommendation?.level;
        if (level) {
            acc[level] = (acc[level] || 0) + 1;
        }
        return acc;
    }, {} as Record<string, number>);

    // Logic for gating properties based on subscription plan
    const getTierLimit = (tier: string | undefined | null, role: string | undefined): number => {
        if (role === 'admin') return 999999;
        switch (tier) {
            case 'Starter': return 15;
            case 'Experienced': return 40;
            case 'Pro': return 100;
            case 'Team': return 999999;
            case 'PayAsYouGo': return 999999; // PayAsYouGo users pay per report, so they should see everything they bought
            case 'Free':
            default: return 3;
        }
    };

    const propertyLimit = getTierLimit(user?.subscriptionTier, user?.role);
    const tier = user?.subscriptionTier || 'Free';


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
        if (!idToDelete) return;

        // Explicit warning about credits not being restored
        const warningMessage = `Are you sure you want to delete the property at ${address}?\n\nIMPORTANT: Deleting this property removes it from your active dashboard, but it will remain in your archive as proof of usage.Usage credits ARE NOT REFUNDED.`;

        if (window.confirm(warningMessage)) {
            try {
                await deleteProperty(idToDelete);
                setSelectedPropertyIds(prev => prev.filter(id => id !== idToDelete));
            } catch (err) {
                alert(`Failed to delete property: ${err} `);
            }
        }
    }, [deleteProperty]);


    const handleCompare = () => {
        if (selectedPropertyIds.length < 2 || !featureAccess.canCompare) return;
        navigate(`/compare?ids=${selectedPropertyIds.join(',')}`);
    };

    // --- Sorting and Filtering Logic ---

    const handleSort = (key: SortKey) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const processedProperties = useMemo(() => {
        let processed = [...activeProperties]; // Only sort/filter active ones for main table

        // 1. Filter
        if (filterRecommendation !== 'All') {
            processed = processed.filter(p => p.recommendation.level === filterRecommendation);
        }

        // 2. Sort
        if (sortConfig.key) {
            const recommendationRank: Record<string, number> = {
                'Worth Pursuing': 4,
                'Moderate Risk': 3,
                'High Risk': 2,
                'Avoid': 1
            };

            processed.sort((a, b) => {
                let valA: number | string = 0;
                let valB: number | string = 0;

                switch (sortConfig.key) {
                    case 'capRate':
                        valA = a.calculations.capRate;
                        valB = b.calculations.capRate;
                        break;
                    case 'cashFlow':
                        valA = a.calculations.monthlyCashFlowNoDebt;
                        valB = b.calculations.monthlyCashFlowNoDebt;
                        break;
                    case 'cashOnCash':
                        valA = a.calculations.cashOnCashReturn;
                        valB = b.calculations.cashOnCashReturn;
                        break;
                    case 'recommendation':
                        valA = recommendationRank[a.recommendation.level] || 0;
                        valB = recommendationRank[b.recommendation.level] || 0;
                        break;
                    case 'strategy':
                        valA = a.recommendation?.strategyAnalyzed || 'Rental';
                        valB = b.recommendation?.strategyAnalyzed || 'Rental';
                        break;
                }

                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return processed;
    }, [activeProperties, sortConfig, filterRecommendation]);


    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortConfig.key !== columnKey) {
            return <span className="ml-1 text-gray-300 text-[10px]">⇅</span>; // Inactive
        }
        return (
            <span className="ml-1 text-brand-blue text-xs">
                {sortConfig.direction === 'asc' ? '▲' : '▼'}
            </span>
        );
    };

    const SortableHeader = ({ label, columnKey }: { label: string, columnKey: SortKey }) => (
        <th
            className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer hover:bg-gray-100 hover:text-brand-blue transition-colors select-none"
            onClick={() => handleSort(columnKey)}
        >
            <div className="flex items-center">
                {label} <SortIcon columnKey={columnKey} />
            </div>
        </th>
    );


    const renderTableContent = () => {
        if (loading) {
            return <tr><td colSpan={8} className="text-center py-12 text-gray-500">Loading properties...</td></tr>;
        }
        if (error) {
            return <tr><td colSpan={8} className="text-center py-12 text-red-500">{error}</td></tr>;
        }
        if (processedProperties.length > 0) {
            return processedProperties.map((prop) =>
                <PropertyRow
                    key={prop.id}
                    property={prop}
                    isSelected={selectedPropertyIds.includes(prop.id)}
                    onSelect={handleSelectProperty}
                    onDelete={handleDelete}
                    isLocked={activeProperties.findIndex(p => p.id === prop.id) >= propertyLimit}
                    userTier={tier}
                />
            );
        }
        return (
            <tr>
                <td colSpan={8}>
                    <div className="text-center py-12 text-gray-500">
                        <p>No active properties match your criteria.</p>
                        {filterRecommendation !== 'All' && (
                            <button onClick={() => setFilterRecommendation('All')} className="mt-2 text-brand-blue font-semibold">
                                Clear Filter
                            </button>
                        )}
                        {activeProperties.length === 0 && (
                            <button onClick={() => navigate('/add-property')} className="mt-2 text-brand-blue font-semibold">
                                Analyze your first property
                            </button>
                        )}
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
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/add-property')} className="flex items-center bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-blue-700 transition">
                        <PlusIcon className="h-5 w-5 mr-2" />
                        Analyze New Property
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <SummaryCard title="Properties Analyzed" value={activeProperties.length.toString()} icon={ChartBarIcon} iconBgColor="bg-blue-500" />
                <SummaryCard title="Avg Cap Rate" value={`${avgCapRate.toFixed(1)}%`} icon={ArrowTrendingUpIcon} change="Good" changeType="good" iconBgColor="bg-green-500" />
                <SummaryCard title="Total Monthly Cash Flow" value={`$${Math.round(activeProperties.reduce((acc, p) => acc + p.calculations.monthlyCashFlowWithDebt, 0))}`} icon={BanknotesIcon} iconBgColor="bg-purple-500" />
                <SummaryCard title="High-Risk Properties" value={highRiskProperties.toString()} icon={ExclamationTriangleIcon} iconBgColor="bg-orange-500" />
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                <div className="flex-grow">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                        <h2 className="text-xl font-bold text-gray-800">Active Property Analyses</h2>

                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            {/* Filter Dropdown */}
                            <div className="flex items-center">
                                <span className="text-sm text-gray-600 mr-2">Filter:</span>
                                <select
                                    value={filterRecommendation}
                                    onChange={(e) => setFilterRecommendation(e.target.value)}
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-brand-blue focus:border-brand-blue bg-white"
                                >
                                    <option value="All">All Recommendations</option>
                                    <option value="Worth Pursuing">Worth Pursuing</option>
                                    <option value="Moderate Risk">Moderate Risk</option>
                                    <option value="High Risk">High Risk</option>
                                    <option value="Avoid">Avoid</option>
                                </select>
                            </div>

                            {selectedPropertyIds.length >= 2 && (
                                <CompareButtonWrapper canCompare={featureAccess.canCompare}>
                                    <button
                                        onClick={handleCompare}
                                        className="bg-purple-600 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:bg-purple-700 transition-colors flex items-center disabled:bg-purple-300 disabled:cursor-not-allowed ml-auto sm:ml-0"
                                        disabled={!featureAccess.canCompare}
                                    >
                                        <ChartBarIcon className="h-5 w-5 mr-2" />
                                        Compare ({selectedPropertyIds.length})
                                    </button>
                                </CompareButtonWrapper>
                            )}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm overflow-x-auto mb-8">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Property</th>
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date Analyzed</th>
                                    <SortableHeader label="Strategy" columnKey="strategy" />
                                    <SortableHeader label="Cap Rate" columnKey="capRate" />
                                    <SortableHeader label="Cash Flow (No-Debt)" columnKey="cashFlow" />
                                    <SortableHeader label="Cash-on-Cash" columnKey="cashOnCash" />
                                    <SortableHeader label="Recommendation" columnKey="recommendation" />
                                    <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renderTableContent()}
                            </tbody>
                        </table>
                    </div>

                    {activeProperties.length > propertyLimit && (
                        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex items-center justify-between">
                            <div className="flex items-center">
                                <LockClosedIcon className="h-5 w-5 mr-2 text-blue-600" />
                                <span>
                                    You have <strong>{activeProperties.length - propertyLimit}</strong> older analyses locked.
                                    Upgrade your plan to unlock all your historical data.
                                </span>
                            </div>
                            <button
                                onClick={() => navigate('/upgrade')}
                                className="text-blue-700 font-bold hover:underline"
                            >
                                Upgrade Now
                            </button>
                        </div>
                    )}

                    {/* Archived / Deleted History Section */}
                    {archivedProperties.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-lg font-bold text-gray-600 mb-2">Archived / Deleted History (Credits Used)</h2>
                            <div className="bg-gray-50 rounded-xl shadow-sm overflow-hidden border border-gray-200 opacity-80">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-100 border-b border-gray-200">
                                        <tr>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Property</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Date Analyzed</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Strategy</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cap Rate</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cash Flow</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Cash-on-Cash</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Recommendation</th>
                                            <th className="py-3 px-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {archivedProperties.map((prop) => (
                                            <PropertyRow
                                                key={prop.id}
                                                property={prop}
                                                isSelected={false}
                                                onSelect={() => { }}
                                                onDelete={() => { }}
                                                isLocked={false} // Always unlocked but read-only visually
                                                userTier={tier}
                                                isArchived={true}
                                            />
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-gray-400 mt-2 italic">
                                * These records are preserved for audit purposes and count towards your analysis usage limits.
                            </p>
                        </div>
                    )}
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
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${Math.min(100, (avgCapRate / 8) * 100)}%` }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Target: 8% cap rate</p>
                        </div>

                        <div className="mb-6">
                            <div className="flex justify-between items-center text-sm mb-1">
                                <span className="font-semibold text-gray-700">Total Monthly Cash Flow</span>
                                <span className="font-bold text-green-600 text-lg">
                                    {formatCurrency(activeProperties.reduce((sum, p) => sum + p.calculations.monthlyCashFlowWithDebt, 0))}
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
                                        const percentage = totalProperties > 0 ? ((Number(count) / totalProperties) * 100).toFixed(0) : 0;
                                        return (
                                            <div className="flex justify-between" key={level}>
                                                <span>{level}</span>
                                                <span>{count}{' '}<span className="text-gray-500">({percentage}%)</span></span>
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
