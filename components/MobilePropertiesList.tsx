import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { MapPinIcon, ListBulletIcon, ClockIcon, CalendarDaysIcon } from '../constants';
import { DealStage } from '../types';

const MobilePropertiesList = () => {
    const { properties, loading, error, updateProperty, deleteProperty } = useProperties();
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');
    const [sortBy, setSortBy] = useState<'date' | 'strategy' | 'status'>('date');

    const truncateAddress = (address: string, limit: number = 25) => {
        if (address.length <= limit) return address;
        return address.slice(0, limit) + '...';
    };

    const StatusOrder: Record<string, number> = {
        'Lead': 1,
        'Analyzing': 2,
        'Offer Sent': 3,
        'Under Contract': 4,
        'Closed': 5,
        'Archived': 6
    };

    const filteredProperties = properties.filter(p =>
        viewMode === 'active'
            ? !p.deletedAt && p.status !== 'Archived'
            : p.deletedAt || p.status === 'Archived'
    );

    const sortedProperties = [...filteredProperties].sort((a, b) => {
        if (sortBy === 'strategy') {
            const strategyA = a.recommendation?.strategyAnalyzed || 'Rental';
            const strategyB = b.recommendation?.strategyAnalyzed || 'Rental';
            return strategyA.localeCompare(strategyB);
        }
        if (sortBy === 'status') {
            const statusA = a.status || 'Lead';
            const statusB = b.status || 'Lead';
            return (StatusOrder[statusA] || 99) - (StatusOrder[statusB] || 99);
        }
        // Default to date (assuming properties are already sorted by date desc from hook, or we leave as is)
        // If we strictly needed to sort by date string, we'd need to parse "Oct 12, 2023", but usually the API returns sorted.
        return 0;
    });

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="p-4 pb-24 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
            </div>

            {/* View Mode Tabs */}
            <div className="flex p-1 bg-gray-200 rounded-lg mb-4">
                <button
                    onClick={() => setViewMode('active')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center space-x-1 transition-all ${viewMode === 'active' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ListBulletIcon className="h-3 w-3" />
                    <span>Active</span>
                </button>
                <button
                    onClick={() => setViewMode('archived')}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center space-x-1 transition-all ${viewMode === 'archived' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <ClockIcon className="h-3 w-3" />
                    <span>Archived</span>
                </button>
            </div>

            {/* Sort Control */}
            <div className="flex justify-end mb-3">
                <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Sort By:</span>
                    <button
                        onClick={() => setSortBy('date')}
                        className={`text-xs font-medium ${sortBy === 'date' ? 'text-teal-600' : 'text-gray-500'}`}
                    >
                        Date
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={() => setSortBy('strategy')}
                        className={`text-xs font-medium ${sortBy === 'strategy' ? 'text-teal-600' : 'text-gray-500'}`}
                    >
                        Strategy
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                        onClick={() => setSortBy('status')}
                        className={`text-xs font-medium ${sortBy === 'status' ? 'text-teal-600' : 'text-gray-500'}`}
                    >
                        Status
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {sortedProperties.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>No {viewMode} properties found.</p>
                        {viewMode === 'active' && (
                            <button onClick={() => navigate('/add-property')} className="mt-2 text-teal-600 font-semibold">
                                Add your first property
                            </button>
                        )}
                    </div>
                ) : (
                    sortedProperties.map((property) => (
                        <div
                            key={property.id}
                            onClick={() => navigate(`/property/${property.id}`)}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors relative overflow-hidden"
                        >
                            {/* Strategy Badge */}
                            <div className="absolute top-0 right-0 bg-gray-100 px-2 py-1 rounded-bl-lg border-b border-l border-gray-50">
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">
                                    {property.recommendation?.strategyAnalyzed || 'Rental'}
                                </span>
                            </div>

                            <div className="flex justify-between items-start mt-2">
                                <div className="flex items-start space-x-3 w-full">
                                    <div className="bg-teal-50 p-2 rounded-lg mt-1 flex-shrink-0">
                                        <MapPinIcon className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-800 text-sm truncate pr-2">
                                            {truncateAddress(property.address)}
                                        </h3>
                                        <p className="text-xs text-gray-500 flex items-center mt-0.5">
                                            <CalendarDaysIcon className="h-3 w-3 mr-1" />
                                            {property.dateAnalyzed}
                                        </p>

                                        <div className="flex items-center space-x-4 mt-3">
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase">Cap Rate</p>
                                                <p className="font-bold text-teal-600">{property.calculations.capRate.toFixed(1)}%</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase">Cash Flow</p>
                                                <p className="font-bold text-gray-800">${Math.round(property.calculations.monthlyCashFlowWithDebt)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Recommendation Badge (Bottom Right or separate) */}
                                <div className={`flex-shrink-0 px-2 py-1 rounded-full text-[10px] font-bold mt-8 ${['Worth Pursuing', 'Strong'].includes(property.recommendation?.level) ? 'bg-green-100 text-green-700' :
                                    property.recommendation?.level === 'Moderate Risk' ? 'bg-yellow-100 text-yellow-700' :
                                        ['High Risk', 'Avoid'].includes(property.recommendation?.level) ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                                    }`}>
                                    {property.recommendation?.level || 'Unknown'}
                                </div>
                            </div>

                            {viewMode === 'active' && (
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Status</span>
                                    <div className="relative w-2/3" onClick={(e) => e.stopPropagation()}>
                                        <select
                                            value={property.status || 'Lead'}
                                            onChange={async (e) => {
                                                const newStatus = e.target.value as DealStage;
                                                if (newStatus === 'Archived') {
                                                    if (window.confirm('Are you sure you want to delete this property analysis?\n\nThis action cannot be undone immediately, but the property will remain in your history.')) {
                                                        try {
                                                            await deleteProperty(property.id);
                                                        } catch (err) {
                                                            console.error('Failed to delete property:', err);
                                                        }
                                                    }
                                                    // If cancelled, the value prop didn't change, so it reverts.
                                                } else {
                                                    updateProperty(property.id, { ...property, status: newStatus });
                                                }
                                            }}
                                            className="block w-full rounded-md border-gray-300 py-3 pl-3 pr-10 text-sm focus:border-teal-500 focus:ring-teal-500 bg-white text-gray-900 font-medium shadow-sm transition-shadow hover:border-teal-400"
                                        >
                                            <option value="Lead">Lead</option>
                                            <option value="Analyzing">Analyzing</option>
                                            <option value="Offer Sent">Offer Sent</option>
                                            <option value="Under Contract">Under Contract</option>
                                            <option value="Closed">Closed</option>
                                            <option value="Archived">Archived</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MobilePropertiesList;
