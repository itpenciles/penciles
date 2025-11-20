

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckIcon, BuildingOfficeIcon, BanknotesIcon } from '../constants';
import Loader from './Loader';
import apiClient from '../services/apiClient';

const UpgradePage = () => {
    const navigate = useNavigate();
    const { user, updateSubscription } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const currentTier = user?.subscriptionTier || 'Free';
    const isPayAsYouGo = currentTier === 'PayAsYouGo';

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
    
    const handlePurchaseCredits = async (amount: number) => {
        if(window.confirm(`Purchase $${amount} in credits? This will be charged to your method on file.`)) {
            setIsLoading(true);
            try {
                await apiClient.post('/user/credits', { amount });
                alert(`Successfully added $${amount} to your balance.`);
                // Force reload to update context (or context should ideally update itself via response, but simple reload works for now to sync sidebar)
                window.location.reload(); 
            } catch (e) {
                alert('Purchase failed. Please try again.');
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
            name: 'Experienced',
            price: 19,
            description: 'For growing investors building their portfolio.',
            features: [
                '40 AI Property Analyses per Month',
                'Export Data to CSV & PDF',
                'Property Comparison Tool',
                'Standard Rental Analysis',
                'Email Support',
            ],
            action: () => navigate('/checkout/experienced')
        },
        {
            name: 'Pro',
            price: 29,
            description: 'For serious investors who need advanced tools.',
            features: [
                '100 AI Property Analyses per Month',
                'All Creative Finance Calculators',
                'Property Comparison Tool',
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
         {
            name: 'PayAsYouGo',
            price: 0, // Special case
            description: 'No monthly fees. Just pay for what you use.',
            features: [
                '$7 per Analysis',
                'No Monthly Subscription',
                'Purchase Credits as Needed',
                'Full Pro Features Access'
            ],
            action: () => {
                if (window.confirm("Switching to Pay As You Go requires a $35 initial retainer deposit. This will be added to your credit balance. Proceed?")) {
                    navigate('/checkout/payasyougo');
                }
            },
            special: true
        },
    ];

    return (
        <div className="bg-gray-50 min-h-screen p-8">
             <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Your Subscription</h1>
                    <p className="mt-2 text-gray-600">Upgrade to unlock more analyses and advanced strategy tools.</p>
                </div>

                {isPayAsYouGo && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-10 max-w-3xl mx-auto shadow-sm">
                        <div className="flex items-center mb-4">
                            <div className="p-2 bg-green-100 rounded-full mr-3">
                                <BanknotesIcon className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-green-900">Pay As You Go Balance</h2>
                                <p className="text-green-700">Current Credits: <span className="font-bold text-xl">${user?.credits?.toFixed(2) || '0.00'}</span></p>
                            </div>
                        </div>
                        <p className="text-sm text-green-800 mb-6">
                            Each analysis costs $7.00. Purchase more credits below to continue analyzing deals.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <button 
                                onClick={() => handlePurchaseCredits(35)}
                                disabled={isLoading}
                                className="bg-white border border-green-300 text-green-700 hover:bg-green-600 hover:text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors"
                            >
                                Buy $35 (5 Rpts)
                            </button>
                            <button 
                                onClick={() => handlePurchaseCredits(70)}
                                disabled={isLoading}
                                className="bg-white border border-green-300 text-green-700 hover:bg-green-600 hover:text-white font-bold py-3 px-4 rounded-lg shadow-sm transition-colors"
                            >
                                Buy $70 (10 Rpts)
                            </button>
                            <button 
                                onClick={() => handlePurchaseCredits(140)}
                                disabled={isLoading}
                                className="bg-green-600 text-white hover:bg-green-700 font-bold py-3 px-4 rounded-lg shadow-md transition-colors"
                            >
                                Buy $140 (20 Rpts)
                            </button>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                    {plans.filter(p => !p.special || !isPayAsYouGo).map(plan => { // Don't show PAYG card if already on it (shown above)
                        const isCurrent = currentTier === plan.name;
                        const isPayGoCard = plan.name === 'PayAsYouGo';

                        return (
                            <div key={plan.name} className={`bg-white p-6 rounded-xl shadow-sm border relative ${isCurrent ? 'border-gray-300 opacity-75' : 'border-gray-200 hover:shadow-md transition-shadow'} ${isPayGoCard ? 'border-green-200 bg-green-50/30' : ''}`}>
                                {isCurrent && (
                                    <div className="absolute top-0 right-0 -mt-2 -mr-2">
                                        <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Current Plan</span>
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                                <div className="mt-4 mb-4">
                                    {isPayGoCard ? (
                                        <div>
                                             <span className="text-3xl font-extrabold text-gray-900">$35</span>
                                             <span className="text-sm font-medium text-gray-500 block">Retainer Deposit</span>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                                            <span className="text-base font-medium text-gray-500">/mo</span>
                                        </>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mb-6 h-12">{plan.description}</p>
                                
                                <button
                                    onClick={() => {
                                        if (plan.name === 'PayAsYouGo') {
                                            // Direct to checkout for retainer
                                            navigate('/checkout/payasyougo');
                                        } else {
                                            plan.action();
                                        }
                                    }}
                                    disabled={isCurrent || isLoading}
                                    className={`w-full text-center px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center justify-center mb-6
                                        ${isCurrent 
                                            ? 'bg-gray-100 text-gray-500 cursor-default' 
                                            : (plan.name === 'Free' ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-brand-blue text-white hover:bg-blue-700 shadow-md')
                                        }
                                    `}
                                >
                                    {isLoading && plan.name === 'Free' ? <Loader text="..." /> : 
                                        isCurrent ? 'Current Plan' : 
                                        (plan.name === 'Free' ? 'Downgrade' : (plan.name === 'PayAsYouGo' ? 'Deposit $35' : `Upgrade to ${plan.name}`))
                                    }
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
