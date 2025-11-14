import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BuildingOfficeIcon, PlusIcon, ChartBarIcon, LinkIcon, MapPinIcon } from '../constants';

const Welcome = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
            <div className="max-w-3xl">
                <div className="flex justify-center items-center mb-6">
                    <BuildingOfficeIcon className="h-16 w-16 text-brand-blue" />
                    <h1 className="ml-4 text-5xl font-bold text-gray-800">Welcome to It Pencils</h1>
                </div>
                <p className="text-xl text-gray-600 mb-8">
                    You're all set! Let's start analyzing your first property to find out if it pencils.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <button
                        onClick={() => navigate('/add-property')}
                        className="flex items-center justify-center bg-brand-blue text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1 w-full sm:w-auto"
                    >
                        <PlusIcon className="h-6 w-6 mr-3" />
                        Analyze First Property
                    </button>
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center justify-center bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:bg-gray-100 border border-gray-300 transition w-full sm:w-auto"
                    >
                        <ChartBarIcon className="h-6 w-6 mr-3" />
                        View Dashboard
                    </button>
                </div>


                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <FeatureCard
                        icon={LinkIcon}
                        title="Analyze from URL"
                        description="Paste a link from Zillow or Redfin to instantly pull property data and get a detailed report."
                    />
                    <FeatureCard
                        icon={ChartBarIcon}
                        title="In-Depth Financials"
                        description="Calculate Cap Rate, Cash-on-Cash Return, and other key metrics to understand an investment's potential."
                    />
                    <FeatureCard
                        icon={MapPinIcon}
                        title="AI-Powered Insights"
                        description="Leverage AI to get a clear recommendation, market analysis, and notes on any property."
                    />
                </div>
            </div>
        </div>
    );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-blue-light mb-4">
            <Icon className="h-6 w-6 text-brand-blue" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
    </div>
);

export default Welcome;