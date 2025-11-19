
import React, { useState, useEffect } from 'react';
import { AdminStats, User, UserDetailStats, BillingHistoryItem } from '../types';
import apiClient from '../services/apiClient';
import { XMarkIcon, UsersIcon, BanknotesIcon, ArrowTrendingUpIcon, DocumentArrowDownIcon, TableCellsIcon, ExclamationTriangleIcon } from '../constants';
import Loader from './Loader';

const AdminDashboard = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userDetailStats, setUserDetailStats] = useState<UserDetailStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDetailLoading, setIsDetailLoading] = useState(false);
    const [range, setRange] = useState('7');
    const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Cancelled'>('All');

    useEffect(() => {
        fetchData();
    }, [range]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [statsRes, usersRes] = await Promise.all([
                apiClient.get(`/admin/stats?range=${range}`),
                apiClient.get('/admin/users')
            ]);
            setStats(statsRes);
            setUsers(usersRes);
        } catch (e) {
            console.error("Failed to load admin data", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUserClick = async (user: User) => {
        setSelectedUser(user);
        setIsDetailLoading(true);
        try {
            const detail = await apiClient.get(`/admin/users/${user.id}`);
            setUserDetailStats(detail);
        } catch (e) {
            console.error("Failed to load user details", e);
        } finally {
            setIsDetailLoading(false);
        }
    };

    const handleCancelSubscription = async (userId: string) => {
        if (window.confirm("Are you sure you want to cancel this user's subscription? This action cannot be undone.")) {
            try {
                await apiClient.post(`/admin/users/${userId}/cancel`, {});
                alert("Subscription cancelled successfully.");
                // Refresh data
                handleUserClick(selectedUser!);
                fetchData();
            } catch (e: any) {
                alert("Failed to cancel subscription: " + e.message);
            }
        }
    };

    const filteredUsers = users.filter(user => {
        if (filterStatus === 'All') return true;
        return user.status === filterStatus;
    });

    if (isLoading && !stats) return <div className="p-8 text-center"><Loader text="Loading Admin Dashboard..." /></div>;

    const maxSubscribers = stats ? Math.max(1, ...stats.subscriberGraph.map(p => p.count)) : 1;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

            {/* Instrument Cluster */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <StatCard title="Today's New Subscribers" value={stats.today.newSubscribers} icon={UsersIcon} color="blue" />
                    <StatCard title="Today's Revenue Impact" value={`$${stats.today.revenue}`} icon={BanknotesIcon} color="green" subtext={`Upgrades: ${stats.today.upgrades} | Downs: ${stats.today.downgrades} | Cancel: ${stats.today.cancellations}`} />
                    <StatCard title="Total Subscribers" value={(Object.values(stats.subscribersByTier) as number[]).reduce((a, b) => a + b, 0)} icon={UsersIcon} color="purple" />
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                         <h3 className="text-sm text-gray-500 font-medium mb-2">Subscribers by Tier</h3>
                         <div className="space-y-1 text-sm">
                            {Object.entries(stats.subscribersByTier).map(([tier, count]) => (
                                <div key={tier} className="flex justify-between">
                                    <span>{tier}</span>
                                    <span className="font-bold">{count}</span>
                                </div>
                            ))}
                         </div>
                    </div>
                </div>
            )}

            {/* Graph Section */}
            {stats && (
                <div className="bg-white p-6 rounded-xl shadow-sm mb-8 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-800">Subscriber Growth</h2>
                        <div className="flex space-x-2">
                            {['7', '14', '30', '60', 'YTD'].map(r => (
                                <button 
                                    key={r} 
                                    onClick={() => setRange(r)}
                                    className={`px-3 py-1 text-xs rounded-md ${range === r ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {r === 'YTD' ? 'YTD' : `${r} Days`}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-64 flex items-end space-x-2 pb-2 border-b border-gray-100">
                        {stats.subscriberGraph.length > 0 ? stats.subscriberGraph.map((point, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                <div 
                                    className="w-full bg-brand-blue/80 rounded-t hover:bg-brand-blue transition-all min-h-[4px]"
                                    style={{ height: `${(point.count / maxSubscribers) * 100}%` }}
                                ></div>
                                <span className="text-[10px] text-gray-500 mt-2 truncate w-full text-center absolute -bottom-6">{point.date}</span>
                                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs p-1 rounded z-10 pointer-events-none">
                                    {point.count} users
                                </div>
                            </div>
                        )) : (
                            <div className="w-full text-center text-gray-400 py-10">No data available for this period</div>
                        )}
                    </div>
                </div>
            )}

            {/* User Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mt-8">
                <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800 mb-2 sm:mb-0">Subscribers List</h2>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Status:</span>
                        <select 
                            value={filterStatus} 
                            onChange={(e) => setFilterStatus(e.target.value as any)}
                            className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-brand-blue focus:border-brand-blue"
                        >
                            <option value="All">All</option>
                            <option value="Active">Active</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-semibold">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Email</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Tier</th>
                            <th className="px-6 py-3">Monthly $</th>
                            <th className="px-6 py-3">Annual $</th>
                            <th className="px-6 py-3">Joined</th>
                            <th className="px-6 py-3"># Props</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-sm">
                        {filteredUsers.map(user => (
                            <tr key={user.id} onClick={() => handleUserClick(user)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4 text-gray-500">{user.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">{user.subscriptionTier || 'Free'}</span></td>
                                <td className="px-6 py-4">${(user as any).monthlyVal || 0}</td>
                                <td className="px-6 py-4">${(user as any).annualVal || 0}</td>
                                <td className="px-6 py-4">{user.createdAt || 'N/A'}</td>
                                <td className="px-6 py-4 font-bold">{(user as any).propertyCount || 0}</td>
                            </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No users found matching filter.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* User Detail Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
                                <p className="text-gray-500 text-sm">{selectedUser.email}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-full">
                                <XMarkIcon className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="p-6">
                            {isDetailLoading || !userDetailStats ? (
                                <div className="py-12 text-center"><Loader text="Loading details..." /></div>
                            ) : (
                                <>
                                    {/* --- Activity Overview --- */}
                                    <h3 className="font-bold text-gray-700 mb-4">Activity Overview</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        <DetailStat label="Logins" value={userDetailStats.activity.logins} />
                                        <DetailStat label="Last Login" value={userDetailStats.activity.lastLogin} />
                                        <DetailStat label="Reports Downloaded" value={userDetailStats.activity.downloads} icon={DocumentArrowDownIcon} />
                                        <DetailStat label="CSV Exports" value={userDetailStats.activity.exports} icon={TableCellsIcon} />
                                    </div>

                                    {/* --- Strategy Usage --- */}
                                    <h3 className="font-bold text-gray-700 mb-4">Strategy Usage</h3>
                                    <div className="space-y-4 mb-8">
                                        {userDetailStats.strategyUsage.map(s => (
                                            <div key={s.name}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>{s.name}</span>
                                                    <span className="font-semibold">{s.count}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-2">
                                                    <div 
                                                        className="bg-brand-blue h-2 rounded-full" 
                                                        style={{ width: `${Math.min(100, (s.count / Math.max(1, ...userDetailStats.strategyUsage.map(x => x.count))) * 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* --- Billing Summary --- */}
                                    {userDetailStats.billingSummary && (
                                        <div className="mb-8">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="font-bold text-gray-700">Billing Summary</h3>
                                                {userDetailStats.billingSummary.status === 'Active' && userDetailStats.billingSummary.plan !== 'Free' && (
                                                    <button 
                                                        onClick={() => handleCancelSubscription(selectedUser.id)}
                                                        className="text-xs bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded hover:bg-red-100"
                                                    >
                                                        Cancel Subscription
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-xs text-gray-500 block uppercase">Current Plan</span>
                                                        <span className="font-bold text-gray-800">{userDetailStats.billingSummary.plan}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-gray-500 block uppercase">Status</span>
                                                        <span className={`font-bold ${userDetailStats.billingSummary.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                                                            {userDetailStats.billingSummary.status}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-gray-500 block uppercase">Billing Cycle</span>
                                                        <span className="font-semibold text-gray-800">{userDetailStats.billingSummary.billingType}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-gray-500 block uppercase">Start Date</span>
                                                        <span className="font-semibold text-gray-800">{userDetailStats.billingSummary.startDate}</span>
                                                    </div>
                                                    
                                                    {userDetailStats.billingSummary.status === 'Active' && userDetailStats.billingSummary.plan !== 'Free' && (
                                                        <div>
                                                            <span className="text-xs text-gray-500 block uppercase">Next Billing Date</span>
                                                            <span className="font-semibold text-gray-800">{userDetailStats.billingSummary.nextBillingDate}</span>
                                                        </div>
                                                    )}

                                                    {userDetailStats.billingSummary.status === 'Cancelled' && (
                                                        <>
                                                            <div>
                                                                <span className="text-xs text-gray-500 block uppercase">Cancellation Date</span>
                                                                <span className="font-semibold text-red-600">{userDetailStats.billingSummary.cancellationDate}</span>
                                                            </div>
                                                            <div className="col-span-2 md:col-span-3 mt-2 pt-2 border-t border-gray-200">
                                                                <span className="text-xs text-gray-500 block uppercase">Cancellation Reason</span>
                                                                <span className="text-gray-700 italic">{userDetailStats.billingSummary.cancellationReason || 'Not specified'}</span>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* --- Billing History --- */}
                                    {userDetailStats.billingHistory && (
                                        <div>
                                            <h3 className="font-bold text-gray-700 mb-4">Billing History</h3>
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                                <table className="w-full text-left text-sm">
                                                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                                                        <tr>
                                                            <th className="px-4 py-3">Date</th>
                                                            <th className="px-4 py-3">Description</th>
                                                            <th className="px-4 py-3">Amount</th>
                                                            <th className="px-4 py-3">Payment Method</th>
                                                            <th className="px-4 py-3">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-200">
                                                        {userDetailStats.billingHistory.length > 0 ? (
                                                            userDetailStats.billingHistory.map((item) => (
                                                                <tr key={item.id}>
                                                                    <td className="px-4 py-3 text-gray-900">{item.date}</td>
                                                                    <td className="px-4 py-3 text-gray-600">{item.billingType} Subscription</td>
                                                                    <td className="px-4 py-3 font-medium text-gray-900">${item.amount.toFixed(2)}</td>
                                                                    <td className="px-4 py-3 text-gray-600">
                                                                        <span className="inline-flex items-center">
                                                                            {item.cardType} •••• {item.last4}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs font-medium">
                                                                            {item.status}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                                                                    No billing history available.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, subtext }: { title: string, value: string | number, icon: any, color: string, subtext?: string }) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600'
    };
    // @ts-ignore
    const c = colors[color] || colors.blue;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-500 font-medium">{title}</h3>
                <div className={`p-2 rounded-lg ${c}`}>
                    <Icon className="h-5 w-5" />
                </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
        </div>
    );
};

const DetailStat = ({ label, value, icon: Icon }: { label: string, value: string | number, icon?: any }) => (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500 uppercase font-semibold">{label}</span>
            {Icon && <Icon className="h-4 w-4 text-gray-400" />}
        </div>
        <p className="text-lg font-bold text-gray-800 break-words">{value}</p>
    </div>
);

export default AdminDashboard;
