import React from 'react';
import { Link } from 'react-router-dom';
import { LightningBoltIcon, SparklesIcon, ShieldCheckIcon, UsersIcon, ArrowTrendingUpIcon, BanknotesIcon } from '../constants';
import FeaturesTable from './FeaturesTable';


const FeatureDetail = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex items-start">
        <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-brand-blue text-white">
                <Icon className="h-6 w-6" />
            </div>
        </div>
        <div className="ml-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
            <p className="mt-2 text-base text-gray-500">{description}</p>
        </div>
    </div>
);


const FeaturesPage = () => {
    return (
        <div className="bg-white">
            <div className="py-20 text-center bg-gray-50">
                <div className="container mx-auto px-6">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-brand-gray-900">A Smarter Way to Invest</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-gray-600">
                        Explore the powerful features that make "It Pencils" the essential tool for modern real estate investors.
                    </p>
                </div>
            </div>

            <div className="py-20">
                <div className="container mx-auto px-6 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                         <FeatureDetail
                            icon={LightningBoltIcon}
                            title="Instant Deal Analysis"
                            description="Paste a URL from Zillow or Redfin, or enter an address, and instantly get a full financial breakdown. No more manual data entry."
                        />
                         <FeatureDetail
                            icon={SparklesIcon}
                            title="AI-Powered Recommendations"
                            description="Leverage Google's Gemini API for an unbiased, data-driven recommendation on whether a deal is worth pursuing, a moderate risk, or should be avoided."
                        />
                         <FeatureDetail
                            icon={BanknotesIcon}
                            title="Comprehensive Financial Metrics"
                            description="Automatically calculate Cap Rate, Cash-on-Cash Return, ROI, DSCR, and detailed monthly cash flow projections to understand the true potential of an investment."
                        />
                        <FeatureDetail
                            icon={ShieldCheckIcon}
                            title="Advanced Strategy Calculators"
                            description="Go beyond simple rentals. Model complex scenarios with dedicated calculators for Wholesale (MAO), Subject-To, and Seller Financing deals."
                        />
                         <FeatureDetail
                            icon={ArrowTrendingUpIcon}
                            title="Dynamic Scenario Modeling"
                            description="Adjust purchase price, rehab costs, loan terms, and operating expenses on the fly to see how changes impact your returns and overall profitability."
                        />
                         <FeatureDetail
                            icon={UsersIcon}
                            title="Side-by-Side Property Comparison"
                            description="Select up to four analyzed properties and compare them across dozens of key financial and property metrics to easily identify the best opportunity."
                        />
                    </div>
                </div>
            </div>
            
            <section id="features-table" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900">Feature Breakdown by Plan</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-gray-500">
                    Find the right set of tools for your investment strategy, no matter the scale.
                    </p>
                </div>
                    <FeaturesTable />
                <div className="text-center mt-10">
                        <Link to="/pricing" className="inline-block bg-brand-blue text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1">
                            View Pricing Plans
                        </Link>
                </div>
                </div>
            </section>
        </div>
    );
};
  
export default FeaturesPage;
