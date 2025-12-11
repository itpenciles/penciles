import React, { useState } from 'react';

interface MathItemProps {
    label: string;
    formula?: string;
    calculation: string;
    result: string | number;
    description?: string;
    variant?: 'green' | 'red' | 'blue' | 'gray';
}

const MathItem: React.FC<MathItemProps> = ({ label, formula, calculation, result, description, variant = 'gray' }) => {
    const [isOpen, setIsOpen] = useState(false);

    const colorClasses = {
        green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
        red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
        gray: { bg: 'bg-white', text: 'text-gray-800', border: 'border-gray-200' }
    };

    const c = colorClasses[variant] || colorClasses.gray;

    return (
        <div className={`border rounded-lg p-4 ${c.bg} ${c.border} hover:shadow-sm transition-shadow`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left"
            >
                <div>
                    <h4 className="text-sm text-gray-500 whitespace-pre-line mb-1">{label}</h4>
                    <p className={`text-2xl font-bold ${c.text}`}>
                        {result}
                    </p>
                </div>
                {isOpen ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                )}
            </button>

            {isOpen && (
                <div className="mt-4 pt-4 border-t border-gray-200/60 space-y-3">
                    {description && (
                        <p className="text-sm text-gray-600 italic">{description}</p>
                    )}

                    <div className="bg-white/50 p-3 rounded text-sm font-mono text-gray-700">
                        {formula && (
                            <div className="flex justify-between mb-1">
                                <span className="text-gray-500">Formula:</span>
                                <span>{formula}</span>
                            </div>
                        )}
                        <div className="flex justify-between">
                            <span className="text-gray-500">Calc:</span>
                            <span>{calculation} = <span className="font-bold">{result}</span></span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface MathBreakdownProps {
    items: MathItemProps[];
    title?: string;
}

export const MathBreakdown: React.FC<MathBreakdownProps> = ({ items, title = "Metric Breakdown (How it's calculated)" }) => {
    return (
        <div className="mt-6">
            <h3 className="text-md font-bold text-gray-800 mb-3 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-brand-blue">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((item, index) => (
                    <MathItem key={index} {...item} />
                ))}
            </div>
        </div>
    );
};
