import React from 'react';
import { BuildingOfficeIcon, SparklesIcon, UsersIcon } from '../constants';
import { Link } from 'react-router-dom';

const AboutPage = () => {
    return (
        <div className="bg-white">
            {/* Hero Section */}
            <section className="bg-gray-50 py-20">
                <div className="container mx-auto px-6 text-center">
                    <BuildingOfficeIcon className="h-16 w-16 text-brand-blue mx-auto mb-4" />
                    <h1 className="text-4xl md:text-5xl font-extrabold text-brand-gray-900">About It Pencils</h1>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-gray-600">
                        Our mission is to empower real estate investors with the clarity and confidence to make smarter, data-driven decisions.
                    </p>
                </div>
            </section>

            {/* Our Story Section */}
            <section className="py-20">
                <div className="container mx-auto px-6 max-w-4xl">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                             <h2 className="text-3xl font-bold text-brand-gray-900 mb-4">From Frustration to Innovation</h2>
                            <p className="text-brand-gray-600 mb-4">
                                As active real estate investors, we spent countless hours buried in spreadsheets, manually pulling comps, and wrestling with complex calculations. We knew there had to be a better way. The question "Does it pencil?" shouldn't take hours to answer.
                            </p>
                            <p className="text-brand-gray-600">
                                It Pencils was born from that necessity. We combined our passion for real estate with the power of cutting-edge AI, leveraging Google's Gemini API, to create a tool that automates the tedious parts of deal analysis, so you can focus on what matters: finding great investments.
                            </p>
                        </div>
                        <div className="bg-brand-blue-light p-8 rounded-xl">
                            <SparklesIcon className="h-12 w-12 text-brand-blue mb-4" />
                            <h3 className="text-xl font-bold text-brand-gray-800">Powered by AI</h3>
                             <p className="text-brand-gray-600 mt-2">
                                We utilize the advanced reasoning and search capabilities of Google's Gemini models to provide you with real-time market data, accurate financial projections, and unbiased investment recommendations.
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
             {/* Team Section Placeholder */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-brand-gray-900">Meet the Team</h2>
                     <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-gray-600">
                        We're a team of investors, engineers, and designers dedicated to building the future of real estate analysis.
                    </p>
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        <TeamMember name="Wesley Lin" title="Founder & Lead Investor" icon={UsersIcon} />
                        <TeamMember name="Maria Garcia" title="Lead Frontend Engineer" icon={UsersIcon} />
                        <TeamMember name="Sam Chen" title="UX/UI Designer" icon={UsersIcon} />
                    </div>
                </div>
            </section>
            
             {/* CTA Section */}
            <section className="py-20">
                <div className="container mx-auto px-6 text-center">
                     <h2 className="text-3xl font-bold text-brand-gray-900">Ready to Analyze Your Next Deal?</h2>
                    <p className="mt-4 max-w-xl mx-auto text-lg text-brand-gray-600">
                        Join hundreds of investors who are saving time and making more confident offers.
                    </p>
                    <div className="mt-8">
                        <Link to="/add-property" className="inline-block bg-brand-blue text-white px-8 py-3 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1">
                            Get Started for Free
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

const TeamMember = ({ name, title, icon: Icon }: { name: string, title: string, icon: React.ElementType }) => (
    <div className="bg-white p-6 rounded-xl shadow-md">
        <Icon className="h-16 w-16 text-brand-blue-light bg-brand-blue rounded-full mx-auto p-2 mb-4" />
        <h3 className="text-lg font-bold text-gray-800">{name}</h3>
        <p className="text-brand-gray-500">{title}</p>
    </div>
);

export default AboutPage;