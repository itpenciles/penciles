
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CheckIcon, BuildingOfficeIcon } from '../constants';
import Loader from './Loader';
import apiClient from '../services/apiClient';
import { Plan } from '../types';

const SubscriptionPage = () => {
    const navigate = useNavigate();
    const { updateSubscription } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [fetchingPlans, setFetchingPlans] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await apiClient.get('/plans');
                setPlans(res);
            } catch (e) {
                console.error("Failed to fetch plans");
            } finally {
                setFetchingPlans(false);
            }
        };
        fetchPlans();
    }, []);

    const handleSelectPlan = async (plan: Plan) => {
        if (plan.key === 'Free') {
            setIsLoading(true);
            await updateSubscription('Free');
            navigate('/dashboard');
        } else if (plan.key === 'Team') {
            navigate('/contact');
        } else {
            navigate(`/checkout/${plan.key.toLowerCase()}`);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
             <div className="text-center max-w-7xl w-full">
                <div className="flex justify-center items-center mb-4">
                    <BuildingOfficeIcon className="h-10 w-10 text-brand-blue" />
                    <h1 className="ml-3 text-3xl font-bold text-gray-800">Welcome to It Pencils</h1>
                </div>

                <h2 className="text-4xl font-extrabold text-brand-gray-900">Choose Your Plan</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-gray-600">
                    You're almost in! Select a plan to continue to your dashboard. You can always upgrade later.
                </p>

                {fetchingPlans ? (
                    <div className="mt-12"><Loader text="Loading Plans..." /></div>
                ) : (
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                        {plans.map(plan => (
                            <div key={plan.key} className={`bg-white p-8 rounded-xl shadow-lg border text-left ${plan.isPopular ? 'border-brand-blue' : 'border-gray-200'} relative`}>
                                {plan.isPopular && <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}
                                <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                                <p className="text-sm text-gray-500 mt-2 h-12">{plan.description}</p>
                                <div className="mt-6">
                                    <span className="text-5xl font-extrabold text-gray-900">${plan.monthlyPrice}</span>
                                    <span className="text-lg font-medium text-gray-500">/mo</span>
                                </div>
                                <button
                                    onClick={() => handleSelectPlan(plan)}
                                    disabled={isLoading}
                                    className={`mt-8 w-full text-center px-6 py-3 rounded-lg font-semibold text-lg transition flex items-center justify-center ${plan.isPopular ? 'bg-brand-blue text-white hover:bg-blue-700' : 'bg-gray-100 text-brand-blue hover:bg-gray-200'} disabled:bg-gray-300`}
                                >
                                    {isLoading && plan.key === 'Free' ? <Loader text="Loading..." /> : (plan.key === 'Team' ? 'Contact Sales' : `Choose ${plan.name}`)}
                                </button>
                                <ul className="mt-8 space-y-4 text-sm">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start">
                                            <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                            <span className="text-gray-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
             </div>
        </div>
    );
};

export default SubscriptionPage;
