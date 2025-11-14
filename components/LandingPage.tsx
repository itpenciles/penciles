import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LightningBoltIcon, ShieldCheckIcon, SparklesIcon, UsersIcon, ArrowTrendingUpIcon, HomeIcon, BanknotesIcon } from '../constants';

const AuthButton: React.FC = () => {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate('/login')}
            className="bg-brand-blue text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1"
        >
            Login / Register
        </button>
    );
};


const LandingPage: React.FC = () => {
    return (
        <>
            <HeroSection />
            <FeaturesSection />
            <HowItWorksSection />
            <UseCasesSection />
            <TestimonialsSection />
            <CtaSection />
        </>
    );
};

const HeroSection: React.FC = () => (
    <section className="bg-gray-50">
        <div className="container mx-auto px-6 py-20 text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-brand-gray-900 leading-tight">
                Does It Pencil?
                <br />
                <span className="text-brand-blue">Instantly Know if Your Deal Makes Sense.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-brand-gray-500">
                Stop guessing. Start analyzing. Turn complex real estate deals into clear, actionable insights in seconds.
            </p>
            <div className="mt-8 flex justify-center">
                <AuthButton />
            </div>
            <div className="mt-12 max-w-4xl mx-auto bg-white p-4 rounded-xl shadow-2xl border border-gray-200">
                <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                    <img 
                        src="/dashboard-preview.png" 
                        alt="Dashboard preview of It Pencils showing property analysis" 
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
        </div>
    </section>
);

const FeaturesSection: React.FC = () => (
    <section id="features" className="py-20 scroll-mt-20">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900">Simplify Real Estate Investing</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-gray-500">
                    Analyze any property in seconds—single-family, multi-unit, or complex investment scenarios.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard
                    icon={LightningBoltIcon}
                    title="Instant Financial Analysis"
                    description="Enter property details and let It Pencils instantly calculate Cash Flow, ROI, Cash-on-Cash Return, and Cap Rate."
                />
                <FeatureCard
                    icon={SparklesIcon}
                    title="AI-Powered Insights"
                    description="Go beyond the numbers with AI-driven recommendations, market analysis, and key factors to consider for any deal."
                />
                <FeatureCard
                    icon={ShieldCheckIcon}
                    title="Comprehensive Risk Assessment"
                    description="Factor in repairs, carry costs, vacancy, and market trends to get a full picture of a deal's potential risks and rewards."
                />
            </div>
        </div>
    </section>
);

const FeatureCard: React.FC<{ icon: React.ElementType; title: string; description: string }> = ({ icon: Icon, title, description }) => (
    <div className="bg-gray-50 p-8 rounded-xl text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-brand-blue-light mx-auto mb-6">
            <Icon className="h-8 w-8 text-brand-blue" />
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-brand-gray-500">{description}</p>
    </div>
);

const HowItWorksSection: React.FC = () => (
    <section id="how-it-works" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900">From Input to Insight in 3 Simple Steps</h2>
            </div>
            <div className="relative">
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-200" aria-hidden="true"></div>
                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
                    <StepCard
                        step="1"
                        title="Provide Property Info"
                        description="Paste a listing URL from Zillow/Redfin or use your current location to start an analysis."
                    />
                    <StepCard
                        step="2"
                        title="Analyze Instantly"
                        description="Our AI-powered engine crunches the numbers, gathering market data and calculating key financial metrics."
                    />
                    <StepCard
                        step="3"
                        title="Get Actionable Insights"
                        description="Receive a clear report with financials and a recommendation to guide your next move."
                    />
                </div>
            </div>
            <div className="text-center mt-12">
                <AuthButton />
            </div>
        </div>
    </section>
);

const StepCard: React.FC<{ step: string; title: string; description: string }> = ({ step, title, description }) => (
    <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-brand-blue text-white font-bold text-xl mb-4">
            {step}
        </div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-brand-gray-500">{description}</p>
    </div>
);

const UseCasesSection: React.FC = () => (
    <section id="use-cases" className="py-20 scroll-mt-20">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900">See How Deals Pencil in Real Scenarios</h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-gray-500">
                    From simple rentals to complex strategies, It Pencils has you covered.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <UseCaseCard icon={UsersIcon} title="Multi-Unit Analysis" description="Analyze duplexes, triplexes, and quadplexes with detailed per-unit rent and expense breakdowns." example="Projected ROI: 18%" />
                <UseCaseCard icon={ShieldCheckIcon} title="Wholesale Opportunities" description="Use the dedicated wholesale calculator to determine your Maximum Allowable Offer (MAO) and potential assignment fees." example="Profit Potential: $35,000" />
                <UseCaseCard icon={LightningBoltIcon} title="Creative Finance Modeling" description="Explore Subject-To and Seller Financing strategies to find hidden opportunities in any market." example="Cash-on-Cash Return: 22%" />
                <UseCaseCard icon={ArrowTrendingUpIcon} title="BRRRR Strategy Modeling" description="Plan your Buy, Rehab, Rent, Refinance, Repeat project, from purchase to post-refinance cash flow and cash-out potential." example="Refinance pulls out 100% of capital" />
                <UseCaseCard icon={HomeIcon} title="House Hacking Scenarios" description="See how living in one unit of a multi-family property can drastically reduce or even eliminate your housing costs." example="Live for free + $250/mo profit" />
                <UseCaseCard icon={BanknotesIcon} title="Find Value-Add Deals" description="Adjust rehab costs and projected rents to uncover properties where strategic improvements can significantly boost value and cash flow." example="Forced appreciation: +$75,000" />
            </div>
        </div>
    </section>
);

const UseCaseCard: React.FC<{ icon: React.ElementType, title: string, description: string, example: string }> = ({ icon: Icon, title, description, example }) => (
    <div className="border border-gray-200 rounded-xl p-6">
        <div className="flex items-center mb-3">
            <Icon className="h-6 w-6 text-brand-blue mr-3" />
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        </div>
        <p className="text-sm text-brand-gray-500 mb-4">{description}</p>
        <div className="bg-green-50 text-green-700 text-sm font-semibold px-3 py-1 rounded-full inline-block">
            {example}
        </div>
    </div>
);


const TestimonialsSection: React.FC = () => (
    <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-6">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900">Investors Who Trust It Pencils</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                <blockquote className="bg-white p-8 rounded-xl shadow-md">
                    <p className="text-brand-gray-600 mb-4">"It Pencils has completely changed how I evaluate deals. I know within minutes if a property is worth pursuing, saving me hours of spreadsheet work."</p>
                    <footer className="font-semibold text-gray-800">Jane D., Real Estate Investor</footer>
                </blockquote>
                <blockquote className="bg-white p-8 rounded-xl shadow-md">
                    <p className="text-brand-gray-600 mb-4">"I love how it accounts for wholesale and creative finance strategies. The AI recommendations give me an extra layer of confidence. No more guessing!"</p>
                    <footer className="font-semibold text-gray-800">Marcus R., Wholesale Investor</footer>
                </blockquote>
            </div>
        </div>
    </section>
);

const CtaSection: React.FC = () => (
    <section className="py-20">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-brand-gray-900">Start Penciling Your Deals Today</h2>
            <p className="mt-4 max-w-xl mx-auto text-lg text-brand-gray-500">
                Get instant clarity on your next real estate investment. It's powerful, easy to use, and completely free.
            </p>
            <div className="mt-8 flex justify-center">
                 <AuthButton />
            </div>
        </div>
    </section>
);

export default LandingPage;