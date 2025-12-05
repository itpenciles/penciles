import React, { useState, useMemo } from 'react';
import { Financials } from '../types';
import { calculateProjections, ProjectionAssumptions } from '../utils/projections';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Legend,
    LineChart,
    Line
} from 'recharts';

interface ProjectionsTabProps {
    financials: Financials;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

const formatK = (value: number) =>
    `$${(value / 1000).toFixed(0)}k`;

export const ProjectionsTab: React.FC<ProjectionsTabProps> = ({ financials }) => {
    const [assumptions, setAssumptions] = useState<ProjectionAssumptions>({
        appreciationRate: 3,
        incomeGrowthRate: 3,
        expenseGrowthRate: 2
    });

    const projections = useMemo(() => calculateProjections(financials, assumptions), [financials, assumptions]);

    const totalReturn30Years = projections[29].totalReturn;
    const equity30Years = projections[29].equity;
    const cashFlow30Years = projections[29].cumulativeCashFlow;

    return (
        <div className="space-y-8">
            {/* Assumptions Controls */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Projection Assumptions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Appreciation Rate: <span className="text-brand-blue font-bold">{assumptions.appreciationRate}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={assumptions.appreciationRate}
                            onChange={(e) => setAssumptions(prev => ({ ...prev, appreciationRate: Number(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                        />
                        <p className="text-xs text-gray-500 mt-1">Historical avg: 3-5%</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rent Growth: <span className="text-brand-blue font-bold">{assumptions.incomeGrowthRate}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={assumptions.incomeGrowthRate}
                            onChange={(e) => setAssumptions(prev => ({ ...prev, incomeGrowthRate: Number(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                        />
                        <p className="text-xs text-gray-500 mt-1">Historical avg: 3-4%</p>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expense Inflation: <span className="text-brand-blue font-bold">{assumptions.expenseGrowthRate}%</span>
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.5"
                            value={assumptions.expenseGrowthRate}
                            onChange={(e) => setAssumptions(prev => ({ ...prev, expenseGrowthRate: Number(e.target.value) }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-blue"
                        />
                        <p className="text-xs text-gray-500 mt-1">Historical avg: 2-3%</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-600 font-semibold uppercase">Total Wealth (30 Years)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(totalReturn30Years)}</p>
                    <p className="text-xs text-gray-500 mt-2">Equity + Cash Flow</p>
                </div>
                <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                    <p className="text-sm text-green-600 font-semibold uppercase">Projected Equity (30 Years)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(equity30Years)}</p>
                    <p className="text-xs text-gray-500 mt-2">Property Value - Loan Balance</p>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                    <p className="text-sm text-purple-600 font-semibold uppercase">Total Cash Flow (30 Years)</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(cashFlow30Years)}</p>
                    <p className="text-xs text-gray-500 mt-2">Cumulative Net Income</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Equity Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Equity Buildup Over Time</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={projections} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorLoan" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="year" />
                                <YAxis tickFormatter={formatK} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Area type="monotone" dataKey="equity" stackId="1" stroke="#10B981" fill="url(#colorEquity)" name="Equity" />
                                <Area type="monotone" dataKey="loanBalance" stackId="1" stroke="#EF4444" fill="url(#colorLoan)" name="Loan Balance" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Cash Flow Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Annual Cash Flow Growth</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projections} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="year" />
                                <YAxis tickFormatter={formatK} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="cashFlow" fill="#8884d8" name="Annual Cash Flow" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="netOperatingIncome" stroke="#ff7300" name="NOI" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Projections Table</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-semibold uppercase">
                            <tr>
                                <th className="px-6 py-3">Year</th>
                                <th className="px-6 py-3">Property Value</th>
                                <th className="px-6 py-3">Loan Balance</th>
                                <th className="px-6 py-3">Equity</th>
                                <th className="px-6 py-3">Gross Income</th>
                                <th className="px-6 py-3">Expenses</th>
                                <th className="px-6 py-3">Cash Flow</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {projections.filter(p => p.year % 5 === 0 || p.year === 1).map((row) => (
                                <tr key={row.year} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">Year {row.year}</td>
                                    <td className="px-6 py-4">{formatCurrency(row.propertyValue)}</td>
                                    <td className="px-6 py-4 text-red-600">{formatCurrency(row.loanBalance)}</td>
                                    <td className="px-6 py-4 text-green-600 font-bold">{formatCurrency(row.equity)}</td>
                                    <td className="px-6 py-4">{formatCurrency(row.grossIncome)}</td>
                                    <td className="px-6 py-4">{formatCurrency(row.operatingExpenses)}</td>
                                    <td className="px-6 py-4 font-bold text-brand-blue">{formatCurrency(row.cashFlow)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
