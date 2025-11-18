import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckIcon, BuildingOfficeIcon } from '../constants';
import Loader from './Loader';

const UpgradePage = () => {
    const navigate = useNavigate();
    const { user, updateSubscription } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const currentTier = user?.subscriptionTier || 'Free';

    const handleDowngradeToFree = async () => {
        if (window.confirm("Are you sure you want to downgrade to the Free plan? You will lose access to advanced calculators and historical data access limits may apply.")) {
            setIsLoading(true);
            try {
                await updateSubscription('Free');
                navigate('/dashboard');
            } catch (error) {
                console.error("Downgrade failed", error);
                alert("Failed to downgrade. Please try again.");
            } finally {
                setIsLoading(false);
            }
        }
    };

    const plans = [
        {
            name: 'Free',
            price: 0,
            description: 'Basic access for new investors.',
            features: [
                '3 AI Property Analyses (Lifetime)',
                'Standard Rental Analysis',
                'Save Properties to Browser',
            ],
            action: handleDowngradeToFree
        },
        {
            name: 'Starter',
            price: 9,
            description: 'For active investors analyzing a few deals a month.',
            features: [
                '15 AI Property Analyses per Month',
                'Standard Rental Analysis',
                'Property Comparison Tool (up to 4)',
                'Save Properties to Browser',
                'Email Support',
            ],
            action: () => navigate('/checkout/starter')
        },
        {
            name: 'Pro',
            price: 29,
            description: 'For serious investors who need advanced tools.',
            features: [
                '100 AI Property Analyses per Month',
                'All Creative Finance Calculators (Wholesale, Sub-To, Seller Financing)',
                'Property Comparison Tool (up to 4)',
                'Save & Export Data',
                'Priority Email Support',
            ],
            action: () => navigate('/checkout/pro')
        },
        {
            name: 'Team',
            price: 79,
            description: 'For professional teams needing high volume.',
            features: [
                'Unlimited AI Property Analyses',
                'All Pro Features Included',
                'Multi-user Access (coming soon)',
                'Dedicated Support',
            ],
            action: () => navigate('/contact')
        },
    ];

    return (
        <div className="bg-gray-50 min-h-screen p-8">
             <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Your Subscription</h1>
                    <p className="mt-2 text-gray-600">Upgrade to unlock more analyses and advanced strategy tools.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                    {plans.map(plan => {
                        const isCurrent = currentTier === plan.name;
                        const isUpgrade = !isCurrent && (
                             (currentTier === 'Free') || 
                             (currentTier === 'Starter' && (plan.name === 'Pro' || plan.name === 'Team')) ||
                             (currentTier === 'Pro' && plan.name === 'Team')
                        );

                        return (
                            <div key={plan.name} className={`bg-white p-6 rounded-xl shadow-sm border relative ${isCurrent ? 'border-gray-300 opacity-75' : 'border-gray-200 hover:shadow-md transition-shadow'}`}>
                                {isCurrent && (
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2">
                                        <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Current Plan</span>
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                                <div className="mt-4 mb-4">
                                    <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                                    <span className="text-base font-medium text-gray-500">/mo</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-6 h-10">{plan.description}</p>
                                
                                <button
                                    onClick={plan.action}
                                    disabled={isCurrent || isLoading}
                                    className={`w-full text-center px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center justify-center mb-6
                                        ${isCurrent 
                                            ? 'bg-gray-100 text-gray-500 cursor-default' 
                                            : isUpgrade 
                                                ? 'bg-brand-blue text-white hover:bg-blue-700 shadow-md' 
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    {isLoading && plan.name === 'Free' ? <Loader text="..." /> : 
                                        isCurrent ? 'Current Plan' : 
                                        isUpgrade ? `Upgrade to ${plan.name}` : 'Downgrade'}
                                </button>

                                <ul className="space-y-3 text-sm">
                                    {plan.features.map(feature => (
                                        <li key={feature} className="flex items-start">
                                            <CheckIcon className={`h-5 w-5 mr-2 flex-shrink-0 ${isCurrent ? 'text-gray-400' : 'text-green-500'}`} />
                                            <span className="text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
             </div>
        </div>
    );
};

export default UpgradePage;