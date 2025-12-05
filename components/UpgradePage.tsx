import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckIcon, BuildingOfficeIcon, BanknotesIcon } from '../constants';
import Loader from './Loader';
import apiClient from '../services/apiClient';
import { Plan } from '../types';

const UpgradePage = () => {
    const navigate = useNavigate();
    const { user, updateSubscription } = useAuth();
    const [isLoading, setIsLoading] = useState(false); // For button actions
    const [plans, setPlans] = useState<Plan[]>([]);
    const [plansLoading, setPlansLoading] = useState(true); // For fetching data

    const currentTier = user?.subscriptionTier || 'Free';
    const isPayAsYouGo = currentTier === 'PayAsYouGo';

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await apiClient.get('/plans');
                setPlans(res);
            } catch (e) {
                console.error("Failed to fetch plans");
            } finally {
                setPlansLoading(false);
            }
        };
        fetchPlans();
    }, []);

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
                window.location.reload(); 
            } catch (e) {
                alert('Purchase failed. Please try again.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handlePlanAction = (plan: Plan) => {
        if (plan.key === 'Free') {
            handleDowngradeToFree();
        } else if (plan.key === 'Team') {
            navigate('/contact');
        } else if (plan.key === 'PayAsYouGo') {
            if (window.confirm("Switching to Pay As You Go requires a $35 initial retainer deposit. This will be added to your credit balance. Proceed?")) {
                navigate('/checkout/payasyougo');
            }
        } else {
            navigate(`/checkout/${plan.key.toLowerCase()}`);
        }
    };

    const getButtonText = (plan: Plan, isCurrent: boolean) => {
        if (isLoading && plan.key === 'Free') return <Loader text="..." />; // Show loader only on Free if downgrading
        if (isCurrent) return 'Current Plan';
        if (plan.key === 'Free') return 'Downgrade';
        if (plan.key === 'PayAsYouGo') return 'Deposit $35';
        if (plan.key === 'Team') return 'Contact Sales';
        return `Upgrade to ${plan.name}`;
    };

    // Filter plans
    const monthlyPlans = plans.filter(p => p.key !== 'PayAsYouGo');
    const paygPlans = plans.filter(p => p.key === 'PayAsYouGo');

    const renderPlanCard = (plan: Plan) => {
        const isCurrent = currentTier === plan.key; // Compare Keys not Names for robustness
        const isPayGoCard = plan.key === 'PayAsYouGo';

        // Don't render the PAYG subscription card if user is already ON PAYG (they see the top-up panel instead)
        if (isPayGoCard && isPayAsYouGo) return null;

        return (
            <div key={plan.key} className={`bg-white p-6 rounded-xl shadow-sm border relative flex flex-col h-full ${isCurrent ? 'border-gray-300 opacity-75' : 'border-gray-200 hover:shadow-md transition-shadow'} ${isPayGoCard ? 'border-green-200 bg-green-50/30' : ''}`}>
                {isCurrent && (
                    <div className="absolute top-0 right-0 -mt-2 -mr-2">
                        <span className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">Current Plan</span>
                    </div>
                )}
                {plan.isPopular && !isCurrent && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -mt-3">
                        <span className="bg-brand-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">Most Popular</span>
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
                            <span className="text-4xl font-extrabold text-gray-900">${plan.monthlyPrice}</span>
                            <span className="text-base font-medium text-gray-500">/mo</span>
                        </>
                    )}
                </div>
                <p className="text-sm text-gray-500 mb-6 min-h-[3rem]">{plan.description}</p>
                
                <button
                    onClick={() => handlePlanAction(plan)}
                    disabled={isCurrent || isLoading}
                    className={`w-full text-center px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center justify-center mb-6
                        ${isCurrent 
                            ? 'bg-gray-100 text-gray-500 cursor-default' 
                            : (plan.key === 'Free' ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-brand-blue text-white hover:bg-blue-700 shadow-md')
                        }
                    `}
                >
                    {getButtonText(plan, isCurrent)}
                </button>

                <ul className="space-y-3 text-sm flex-1">
                    {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                            <CheckIcon className={`h-5 w-5 mr-2 flex-shrink-0 ${isCurrent ? 'text-gray-400' : 'text-green-500'}`} />
                            <span className="text-gray-600">{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 min-h-screen p-8">
             <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-3xl font-bold text-gray-900">Manage Your Subscription</h1>
                    <p className="mt-2 text-gray-600">Upgrade to unlock more analyses and advanced strategy tools.</p>
                </div>

                {/* Top-Up Panel for PAYG Users */}
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

                {plansLoading ? (
                    <div className="text-center py-20"><Loader text="Loading current plans..." /></div>
                ) : (
                    <>
                        {/* Monthly Plans Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 items-stretch mb-12">
                            {monthlyPlans.map(renderPlanCard)}
                        </div>

                        {/* PAYG Section (if not already subscribed) */}
                        {!isPayAsYouGo && paygPlans.length > 0 && (
                            <div className="max-w-5xl mx-auto mt-12 border-t border-gray-200 pt-12">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Or Pay As You Go</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 justify-center gap-8 items-stretch">
                                    <div className="md:col-start-2">
                                        {paygPlans.map(renderPlanCard)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
             </div>
        </div>
    );
};

export default UpgradePage;