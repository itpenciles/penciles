import React from 'react';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../contexts/AuthContext';
import { ArrowTrendingUpIcon, BanknotesIcon } from '../constants';
import { Logo } from './common/Logo';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const MobileDashboard = () => {
    const { properties } = useProperties();
    const { user, analysisStatus } = useAuth();

    const activeProperties = properties.filter(p => !p.deletedAt);
    const archivedProperties = properties.filter(p => p.deletedAt);

    const avgCapRate = activeProperties.length > 0 ? activeProperties.reduce((acc, p) => acc + p.calculations.capRate, 0) / activeProperties.length : 0;
    const totalCashFlow = activeProperties.reduce((acc, p) => acc + p.calculations.monthlyCashFlowWithDebt, 0);

    // --- Data for Portfolio Chart ---
    // Note: We do NOT include "Remaining" in the pie chart because "Active" + "Archived" (Lifetime) 
    // does not sum with "Remaining" (Monthly Limit) to equal a meaningful whole.
    const portfolioData = [
        { name: 'Active', value: activeProperties.length, color: '#3B82F6' }, // Blue
        { name: 'Archived', value: archivedProperties.length, color: '#9CA3AF' }, // Gray
    ];

    // --- Data for Risk Chart ---
    const riskDistribution = activeProperties.reduce((acc, p) => {
        const level = p.recommendation?.level || 'Unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const riskData = Object.entries(riskDistribution).map(([name, value]) => {
        let color = '#D1D5DB'; // Default Gray
        if (name === 'High Risk') color = '#F97316'; // Orange
        if (name === 'Avoid') color = '#EF4444'; // Red
        if (name === 'Moderate Risk' || name === 'Hold') color = '#F59E0B'; // Amber
        if (name === 'Buy' || name === 'Strong Buy' || name === 'Worth Pursuing') color = '#10B981'; // Emerald
        return { name, value, color };
    });

    // --- Data for Strategy Chart ---
    const strategyDistribution = activeProperties.reduce((acc, p) => {
        const strategy = p.recommendation?.strategyAnalyzed || 'Rental';
        acc[strategy] = (acc[strategy] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const strategyData = Object.entries(strategyDistribution).map(([name, value]) => {
        let color = '#3B82F6'; // Default Blue
        if (name === 'Rental') color = '#3B82F6';
        if (name === 'BRRRR') color = '#8B5CF6'; // Purple
        if (name === 'Wholesale') color = '#F59E0B'; // Amber
        if (name === 'Subject-To') color = '#10B981'; // Emerald
        if (name === 'Seller Financing') color = '#EC4899'; // Pink
        return { name, value, color };
    });

    // If no data, show a placeholder
    if (strategyData.length === 0) {
        strategyData.push({ name: 'No Data', value: 1, color: '#E5E7EB' });
    }

    // If no data, show a placeholder
    if (riskData.length === 0) {
        riskData.push({ name: 'No Data', value: 1, color: '#E5E7EB' });
    }

    const MetricCard = ({ title, value, subtext, icon: Icon, colorClass }: { title: string, value: string, subtext?: string, icon: any, colorClass: string }) => (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center h-40 w-full relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-3 opacity-10 ${colorClass}`}>
                <Icon className="h-16 w-16" />
            </div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider mb-1">{title}</p>
            <h3 className={`text-3xl font-bold ${colorClass.replace('bg-', 'text-').replace('100', '600')}`}>{value}</h3>
            {subtext && <p className="text-gray-400 text-[10px] mt-1">{subtext}</p>}
        </div>
    );

    const ChartCard = ({ title, data, centerText, subText, extraInfo }: { title: string, data: any[], centerText: string, subText?: string, extraInfo?: React.ReactNode }) => (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-bold text-gray-800">{title}</h3>
                {extraInfo}
            </div>
            <div className="flex items-center h-48 w-full">
                {/* Chart Container (Left 2/3) */}
                <div className="relative w-2/3 h-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={55}
                                outerRadius={75}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text Overlay - Perfectly centered in the chart container */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-1">
                        <span className="text-2xl font-bold text-gray-800">{centerText}</span>
                        {subText && <span className="text-[10px] text-gray-500">{subText}</span>}
                    </div>
                </div>

                {/* Custom Legend (Right 1/3) */}
                <div className="w-1/3 flex flex-col justify-center space-y-3 pl-2">
                    {data.map((item, index) => (
                        <div key={index} className="flex items-start">
                            <div className="w-3 h-3 rounded-full mt-0.5 mr-2 flex-shrink-0" style={{ backgroundColor: item.color }}></div>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium text-gray-700 leading-tight">{item.name}</span>
                                <span className="text-[10px] text-gray-400">{item.value} props</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <div className="p-4 pb-24 space-y-6 bg-gray-50 min-h-screen">
            {/* Welcome Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Hello, {user?.name?.split(' ')[0] || 'Investor'}</h1>
                    <p className="text-sm text-gray-500">Your portfolio at a glance</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                    {user?.name?.charAt(0) || 'U'}
                </div>
            </div>

            {/* Main Metrics Grid */}
            <div className="grid grid-cols-2 gap-4">
                <MetricCard
                    title="Avg Cap Rate"
                    value={`${avgCapRate.toFixed(1)}%`}
                    subtext="Target: 8%"
                    icon={ArrowTrendingUpIcon}
                    colorClass="text-teal-600"
                />
                <MetricCard
                    title="Cash Flow"
                    value={`$${Math.round(totalCashFlow)}`}
                    subtext="Monthly Total"
                    icon={BanknotesIcon}
                    colorClass="text-blue-600"
                />
            </div>

            {/* Charts Section */}
            <div className="space-y-4">
                <ChartCard
                    title="Portfolio Status"
                    data={portfolioData}
                    centerText={`${activeProperties.length + archivedProperties.length}`}
                    subText="Total Analyzed"
                    extraInfo={
                        analysisStatus.limit !== 'Unlimited' && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                {Math.max(0, analysisStatus.limit - analysisStatus.count)} Left
                            </span>
                        )
                    }
                />

                <ChartCard
                    title="Risk Analysis"
                    data={riskData}
                    centerText={`${activeProperties.length}`}
                    subText="Active Properties"
                />

                <ChartCard
                    title="Strategies"
                    data={strategyData}
                    centerText={`${activeProperties.length}`}
                    subText="By Strategy"
                />
            </div>
        </div>
    );
};

export default MobileDashboard;
