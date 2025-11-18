import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftIcon } from '../constants';
import Loader from './Loader';

type TierDetails = {
    [key: string]: {
        name: string;
        price: number;
    }
}

const tierDetails: TierDetails = {
    starter: { name: 'Starter', price: 9 },
    pro: { name: 'Pro', price: 29 },
    team: { name: 'Team', price: 79 },
}

const CheckoutPage = () => {
    const { tier } = useParams<{ tier: string }>();
    const navigate = useNavigate();
    const { updateSubscription } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const currentTier = tier && tierDetails[tier.toLowerCase()]
        ? tierDetails[tier.toLowerCase()]
        : { name: 'Selected', price: 0 };
    
    const handlePurchase = async () => {
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        await updateSubscription(currentTier.name as 'Starter' | 'Pro' | 'Team');
        setIsLoading(false);
        navigate('/dashboard');
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full">
                <button onClick={() => navigate('/subscribe')} className="flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    Back to Plans
                </button>
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <h1 className="text-2xl font-bold text-gray-900">Complete Your Purchase</h1>
                    <p className="text-gray-500 mt-1">You're subscribing to the <span className="font-semibold text-brand-blue">{currentTier.name}</span> plan.</p>
                    
                    <div className="mt-6 bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                        <span className="font-semibold text-gray-800">Amount Due Today</span>
                        <span className="text-2xl font-bold text-gray-900">${currentTier.price}.00</span>
                    </div>

                    <div className="mt-6 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Card Number</label>
                            <input type="text" placeholder="•••• •••• •••• 4242" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
                        </div>
                        <div className="flex space-x-4">
                             <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">Expiration</label>
                                <input type="text" placeholder="MM / YY" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
                            </div>
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700">CVC</label>
                                <input type="text" placeholder="•••" className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100" readOnly />
                            </div>
                        </div>
                    </div>
                    
                    <button
                        onClick={handlePurchase}
                        disabled={isLoading}
                        className="mt-8 w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-brand-blue hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isLoading ? <Loader text="Processing..." /> : `Pay $${currentTier.price} Now`}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-4">This is a simulated checkout process for demonstration purposes.</p>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
