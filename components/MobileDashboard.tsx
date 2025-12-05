import React from 'react';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../contexts/AuthContext';
import { ArrowTrendingUpIcon, BanknotesIcon } from '../constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const MobileDashboard = () => {
    const { properties } = useProperties();
    const { user, analysisStatus } = useAuth();

    const activeProperties = properties.filter(p => !p.deletedAt);
    const archivedProperties = properties.filter(p => p.deletedAt);

    const avgCapRate = activeProperties.length > 0 ? activeProperties.reduce((acc, p) => acc + p.calculations.capRate, 0) / activeProperties.length : 0;
    const totalCashFlow = activeProperties.reduce((acc, p) => acc + p.calculations.monthlyCashFlowWithDebt, 0);

    // --- Data for Portfolio Chart ---
    const remainingAnalyses = analysisStatus.limit === 'Unlimited' ? 0 : Math.max(0, analysisStatus.limit - analysisStatus.count);
    // If unlimited, we don't show "Remaining" slice, just Active vs Archived
    const portfolioData = [
        { name: 'Active', value: activeProperties.length, color: '#3B82F6' }, // Blue
        { name: 'Archived', value: archivedProperties.length, color: '#9CA3AF' }, // Gray
    ];
    if (analysisStatus.limit !== 'Unlimited') {
        portfolioData.push({ name: 'Remaining', value: remainingAnalyses, color: '#E5E7EB' }); // Light Gray
    }

    // --- Data for Risk Chart ---
    const riskDistribution = activeProperties.reduce((acc, p) => {
        const level = p.recommendation?.level || 'Unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const riskData = Object.entries(riskDistribution).map(([name, value]) => {
        let color = '#D1D5DB'; // Default Gray
        if (name === 'High Risk' || name === 'Avoid') color = '#EF4444'; // Red
        if (name === 'Moderate Risk' || name === 'Hold') color = '#F59E0B'; // Amber
        if (name === 'Buy' || name === 'Strong Buy') color = '#10B981'; // Emerald
        return { name, value, color };
    });

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

    const ChartCard = ({ title, data, centerText, subText }: { title: string, data: any[], centerText: string, subText?: string }) => (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-800 mb-2 w-full text-left">{title}</h3>
            <div className="h-48 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-2xl font-bold text-gray-800">{centerText}</span>
                    {subText && <span className="text-[10px] text-gray-500">{subText}</span>}
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
                />

                <ChartCard
                    title="Risk Analysis"
                    data={riskData}
                    centerText={`${activeProperties.length}`}
                    subText="Active Properties"
                />
            </div>
        </div>
    );
};

export default MobileDashboard;
