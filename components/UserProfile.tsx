import React, { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import Loader from './Loader';
import { UserCircleIcon, CreditCardIcon, CalendarDaysIcon } from '../constants';

interface BillingHistoryItem {
    id: string;
    date: string;
    amount: number;
    description: string;
    status: string;
}

interface ExtendedUser {
    id: string;
    name: string;
    email: string;
    subscriptionTier: string;
    createdAt: string;
    analysisLimitResetAt?: string;
    billingHistory: BillingHistoryItem[];
}

const UserProfile = () => {
    const [user, setUser] = useState<ExtendedUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const data = await apiClient.get('/user/me');
                setUser(data);
            } catch (err) {
                console.error("Failed to fetch profile", err);
                setError("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) return <div className="p-8 text-center"><Loader text="Loading Profile..." /></div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
    if (!user) return <div className="p-8 text-center">User not found.</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>

            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
                <div className="h-24 w-24 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-3xl font-bold">
                    {user.name.charAt(0)}
                </div>
                <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-gray-500">{user.email}</p>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
                        <div className="flex items-center text-sm text-gray-600">
                            <UserCircleIcon className="h-5 w-5 mr-2 text-gray-400" />
                            Member since {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <CreditCardIcon className="h-5 w-5 mr-2 text-gray-400" />
                            {user.subscriptionTier || 'Free'} Plan
                        </div>
                    </div>
                </div>
            </div>

            {/* Subscription Details */}
            <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Subscription Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Current Plan</p>
                        <p className="text-xl font-bold text-brand-blue">{user.subscriptionTier || 'Free'}</p>
                    </div>
                    {user.analysisLimitResetAt && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Next Billing Date</p>
                            <div className="flex items-center">
                                <CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-400" />
                                <p className="text-lg font-semibold text-gray-800">
                                    {new Date(user.analysisLimitResetAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Billing History */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Billing History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase">
                            <tr>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Description</th>
                                <th className="px-6 py-3">Amount</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {user.billingHistory && user.billingHistory.length > 0 ? (
                                user.billingHistory.map((item) => (
                                    <tr key={item.id}>
                                        <td className="px-6 py-4 text-gray-900">{item.date}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.description}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">${item.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No billing history available.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
