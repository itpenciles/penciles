import React from 'react';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../contexts/AuthContext';
import { ArrowTrendingUpIcon, BanknotesIcon, ExclamationTriangleIcon, ChartBarIcon } from '../constants';

const MobileDashboard = () => {
    const { properties } = useProperties();
    const { user } = useAuth();

    const activeProperties = properties.filter(p => !p.deletedAt);
    const avgCapRate = activeProperties.length > 0 ? activeProperties.reduce((acc, p) => acc + p.calculations.capRate, 0) / activeProperties.length : 0;
    const totalCashFlow = activeProperties.reduce((acc, p) => acc + p.calculations.monthlyCashFlowWithDebt, 0);
    const highRiskCount = activeProperties.filter(p => p.recommendation?.level === 'High Risk' || p.recommendation?.level === 'Avoid').length;

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

            {/* Secondary Metrics */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="bg-orange-100 p-2 rounded-lg">
                        <ExclamationTriangleIcon className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-800">Risk Alert</p>
                        <p className="text-xs text-gray-500">{highRiskCount} properties flagged</p>
                    </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    {highRiskCount}
                </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <ChartBarIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-800">Total Analyzed</p>
                        <p className="text-xs text-gray-500">{activeProperties.length} properties</p>
                    </div>
                </div>
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                    {activeProperties.length}
                </div>
            </div>

            {/* Recent Activity / Quick Actions could go here */}
        </div>
    );
};

export default MobileDashboard;
