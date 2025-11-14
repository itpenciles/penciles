import React, { useState } from 'react';
import { CheckIcon } from '../constants';
import { Link } from 'react-router-dom';
import FeaturesTable from './FeaturesTable';

const PricingPage = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

    const plans = [
        {
            name: 'Free',
            price: { monthly: 0, annually: 0 },
            description: 'For investors just getting started and wanting to try the platform.',
            features: [
                '3 AI Property Analyses (Lifetime)',
                'Standard Rental Analysis',
                'Save Properties to Browser',
            ],
            cta: 'Get Started',
            href: '/add-property'
        },
        {
            name: 'Starter',
            price: { monthly: 9, annually: 90 },
            description: 'For active investors analyzing a few deals a month.',
            features: [
                '15 AI Property Analyses per Month',
                'Standard Rental Analysis',
                'Property Comparison Tool (up to 4)',
                'Save Properties to Browser',
                'Email Support',
            ],
            cta: 'Choose Starter',
            isPopular: false,
            href: '#'
        },
        {
            name: 'Pro',
            price: { monthly: 29, annually: 290 },
            description: 'For serious investors and small teams who need advanced tools.',
            features: [
                '100 AI Property Analyses per Month',
                'All Creative Finance Calculators (Wholesale, Sub-To, Seller Financing)',
                'Property Comparison Tool (up to 4)',
                'Save & Export Data',
                'Priority Email Support',
            ],
            cta: 'Choose Pro',
            isPopular: true,
            href: '#'
        },
        {
            name: 'Team',
            price: { monthly: 79, annually: 790 },
            description: 'For professional teams and brokerages needing high volume and collaboration.',
            features: [
                'Unlimited AI Property Analyses',
                'All Pro Features Included',
                'Multi-user Access (coming soon)',
                'Centralized Team Dashboard (coming soon)',
                'Dedicated Support',
            ],
            cta: 'Contact Sales',
            isPopular: false,
            href: '/contact'
        },
    ];

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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
                    {plans.map(plan => (
                        <div key={plan.name} className={`bg-white p-8 rounded-xl shadow-lg border ${plan.isPopular ? 'border-brand-blue' : 'border-gray-200'} relative`}>
                             {plan.isPopular && <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-blue text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>}
                            <h3 className="text-2xl font-bold text-gray-800">{plan.name}</h3>
                            <p className="text-sm text-gray-500 mt-2 h-12">{plan.description}</p>
                            <div className="mt-6">
                                <span className="text-5xl font-extrabold text-gray-900">${plan.price[billingCycle]}</span>
                                <span className="text-lg font-medium text-gray-500">/mo</span>
                                {plan.name !== 'Free' && billingCycle === 'annually' && <p className="text-sm text-gray-500">billed annually</p>}
                            </div>
                             <Link to={plan.href} className={`mt-8 block w-full text-center px-6 py-3 rounded-lg font-semibold text-lg transition ${plan.isPopular ? 'bg-brand-blue text-white hover:bg-blue-700' : 'bg-gray-100 text-brand-blue hover:bg-gray-200'}`}>
                                {plan.cta}
                            </Link>
                            <ul className="mt-8 space-y-4 text-sm">
                                {plan.features.map(feature => (
                                    <li key={feature} className="flex items-start">
                                        <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                        <span className="text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
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
