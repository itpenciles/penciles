import React, { useState } from 'react';

interface MathItemProps {
    label: string;
    formula?: string;
    calculation: string;
    result: string | number;
    description?: string;
    resultColor?: string;
}

const MathItem: React.FC<MathItemProps> = ({ label, formula, calculation, result, description, resultColor }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Determine color: use explicit prop if available, otherwise default to green for strings or red/green for numbers
    const colorClass = resultColor
        ? resultColor
        : (typeof result === 'number' && result < 0 ? 'text-red-600' : 'text-green-700');

    return (
        <div className="border border-gray-200 rounded-lg p-3 bg-white hover:shadow-sm transition-shadow">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-left"
            >
                <div>
                    <h4 className="font-semibold text-gray-800 text-sm whitespace-pre-line">{label}</h4>
                    <p className={`text-lg font-bold ${colorClass}`}>
                        {result}
                    </p>
                </div>
                <div className="text-gray-400">
                    {isOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="mt-3 pt-3 border-t border-gray-100 text-sm space-y-2">
                    {description && (
                        <p className="text-gray-500 italic text-xs mb-2">{description}</p>
                    )}

                    {formula && (
                        <div>
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Formula</span>
                            <div className="font-mono text-gray-700 bg-gray-50 p-1.5 rounded mt-0.5 text-xs overflow-x-auto">
                                {formula}
                            </div>
                        </div>
                    )}

                    <div>
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Math</span>
                        <div className="font-mono text-gray-700 bg-gray-50 p-1.5 rounded mt-0.5 text-xs overflow-x-auto">
                            {calculation} = <span className="font-bold">{result}</span>
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
