import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { MapPinIcon } from '../constants';

const MobilePropertiesList = () => {
    const { properties, loading, error } = useProperties();
    const navigate = useNavigate();

    const activeProperties = properties.filter(p => !p.deletedAt);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="p-4 pb-24 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">My Properties</h1>

            <div className="space-y-4">
                {activeProperties.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>No properties yet.</p>
                        <button onClick={() => navigate('/add-property')} className="mt-2 text-teal-600 font-semibold">
                            Add your first property
                        </button>
                    </div>
                ) : (
                    activeProperties.map((property) => (
                        <div
                            key={property.id}
                            onClick={() => navigate(`/property/${property.id}`)}
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 active:bg-gray-50 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-3">
                                    <div className="bg-teal-50 p-2 rounded-lg mt-1">
                                        <MapPinIcon className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 line-clamp-1">{property.address}</h3>
                                        <p className="text-xs text-gray-500">{property.propertyType} • {property.dateAnalyzed}</p>

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
                                <div className={`px-2 py-1 rounded-full text-[10px] font-bold ${property.recommendation?.level === 'Worth Pursuing' ? 'bg-green-100 text-green-700' :
                                    property.recommendation?.level === 'Moderate Risk' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                    {property.recommendation?.level === 'Worth Pursuing' ? 'Good' :
                                        property.recommendation?.level === 'Moderate Risk' ? 'Okay' : 'Risk'}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MobilePropertiesList;
