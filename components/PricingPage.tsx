
import React, { useState, useEffect } from 'react';
import { CheckIcon } from '../constants';
import { Link } from 'react-router-dom';
import FeaturesTable from './FeaturesTable';
import apiClient from '../services/apiClient';
import { Plan } from '../types';
import Loader from './Loader';

interface PlanCardProps {
    plan: Plan;
    billingCycle: 'monthly' | 'annually';
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, billingCycle }) => {
    const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    let href = '#';
    let cta = 'Choose ' + plan.name;
    if (plan.key === 'Free') { href = '/add-property'; cta = 'Get Started'; }
    else if (plan.key === 'Team') { href = '/contact'; cta = 'Contact Sales'; }
    else if (plan.key === 'PayAsYouGo') { href = '/add-property'; cta = 'Start Now'; } // or login
    
    return (
        <div className={`bg-white p-8 rounded-xl shadow-lg border ${plan.isPopular ? 'border-brand-blue' : 'border-gray-200'} relative flex flex-col h-full`}>
                {plan.isPopular && <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}
            <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
            <p className="text-sm text-gray-500 mt-2 min-h-[3rem]">{plan.description}</p>
            <div className="mt-6">
                <span className="text-5xl font-extrabold text-gray-900">${price}</span>
                <span className="text-lg font-medium text-gray-500">{billingCycle === 'monthly' ? '/mo' : '/yr'}</span>
            </div>
                <Link to={href} className={`mt-8 block w-full text-center px-6 py-3 rounded-lg font-semibold text-lg transition ${plan.isPopular ? 'bg-brand-blue text-white hover:bg-blue-700' : 'bg-gray-100 text-brand-blue hover:bg-gray-200'}`}>
                {cta}
            </Link>
            <ul className="mt-8 space-y-4 text-sm flex-1">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

const PricingPage = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await apiClient.get('/plans');
                setPlans(res);
            } catch (error) {
                console.error("Failed to fetch pricing plans", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPlans();
    }, []);

    const monthlyPlans = plans.filter(p => p.key !== 'PayAsYouGo');
    const paygPlans = plans.filter(p => p.key === 'PayAsYouGo');

    return (
        <div className="bg-gray-50">
            {/* Header */}
            <div className="py-20 text-center">
                <div className="container mx-auto px-6">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-brand-gray-900">Find the Perfect Plan</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-gray-600">
                        Start for free, then upgrade as you grow. All plans are designed to provide more value than they cost.
                    </p>
                    <div className="mt-8 inline-flex items-center bg-white p-1 rounded-full border border-gray-200">
                         <button onClick={() => setBillingCycle('monthly')} className={`px-4 py-2 text-sm font-semibold rounded-full ${billingCycle === 'monthly' ? 'bg-brand-blue text-white' : 'text-gray-600'}`}>
                            Monthly
                        </button>
                        <button onClick={() => setBillingCycle('annually')} className={`px-4 py-2 text-sm font-semibold rounded-full relative ${billingCycle === 'annually' ? 'bg-brand-blue text-white' : 'text-gray-600'}`}>
                            Annually
                            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">Save 20%</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Pricing Grid */}
            <div className="container mx-auto px-6 pb-20">
                {loading ? <div className="text-center py-12"><Loader text="Loading Plans..." /></div> : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-8 items-stretch mb-12">
                        {monthlyPlans.map(plan => <PlanCard key={plan.key} plan={plan} billingCycle={billingCycle} />)}
                    </div>
                    
                    {paygPlans.length > 0 && (
                        <div className="max-w-5xl mx-auto">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Pay As You Go</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 justify-center gap-8 items-stretch">
                                <div className="md:col-start-2">
                                    {paygPlans.map(plan => <PlanCard key={plan.key} plan={plan} billingCycle={billingCycle} />)}
                                </div>
                            </div>
                        </div>
                    )}
                </>
                )}
            </div>
            
            <section className="py-20">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900">Compare All Features</h2>
                    </div>
                    <FeaturesTable />
                </div>
            </section>
        </div>
    );
};

export default PricingPage;