
import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Loader from './Loader';
import { Plan } from '../types';

interface PlanCardProps {
    plan: Plan;
    onEdit: (plan: Plan) => void;
    onDelete: (key: string) => void;
}

const PlanCard: React.FC<PlanCardProps> = ({ plan, onEdit, onDelete }) => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative flex flex-col h-full">
        {plan.isPopular && <div className="bg-yellow-400 text-xs font-bold text-center py-1 text-yellow-900 uppercase">Most Popular</div>}
        <div className="p-6 flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">{plan.key}</span>
            </div>
            <div className="mb-4">
                <span className="text-3xl font-bold">${plan.monthlyPrice}</span>
                <span className="text-gray-500 text-sm">/mo</span>
                <span className="text-gray-400 text-sm ml-2">(${plan.annualPrice}/yr)</span>
            </div>
            <div className="mb-4 text-sm text-gray-600">
                <strong>Limit:</strong> {plan.analysisLimit === -1 ? 'Unlimited' : plan.analysisLimit} analyses
            </div>
            <p className="text-sm text-gray-500 h-10 overflow-hidden mb-4">{plan.description}</p>
            
            <div className="border-t border-gray-100 pt-4 flex-1">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Features</h4>
                <ul className="text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                    {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start">
                            <span className="mr-2">•</span> {f}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
        <div className="bg-gray-50 px-6 py-3 flex justify-between mt-auto">
            <button onClick={() => onEdit(plan)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit Plan</button>
            <button onClick={() => onDelete(plan.key)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
        </div>
    </div>
);

const AdminSetup = () => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editMode, setEditMode] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Plan>>({});

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        setIsLoading(true);
        try {
            const res = await apiClient.get('/plans');
            setPlans(res);
        } catch (e) {
            console.error("Failed to fetch plans", e);
            alert("Failed to fetch plans. Ensure the backend is running.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (plan: Plan) => {
        setEditMode(plan.key);
        setFormData(plan);
    };

    const handleCancelEdit = () => {
        setEditMode(null);
        setFormData({});
    };

    const handleAddNew = () => {
        setEditMode('NEW');
        setFormData({
            key: '',
            name: '',
            description: '',
            monthlyPrice: 0,
            annualPrice: 0,
            analysisLimit: 0,
            features: [],
            isPopular: false
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let val: any = value;
        // Don't convert numbers here immediately to avoid weird UX with clearing inputs, 
        // but ensure we send numbers in handleSave. 
        if (type === 'checkbox') val = (e.target as HTMLInputElement).checked;

        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleFeatureChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures[index] = e.target.value;
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const addFeature = () => {
        setFormData(prev => ({ ...prev, features: [...(prev.features || []), ''] }));
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(formData.features || [])];
        newFeatures.splice(index, 1);
        setFormData(prev => ({ ...prev, features: newFeatures }));
    };

    const handleSave = async () => {
        if (!formData.key || !formData.name) {
            alert("Key and Name are required.");
            return;
        }

        // Clean data before sending to API
        // Ensure numbers are strictly numbers to avoid database errors
        const payload = {
            key: formData.key,
            name: formData.name,
            description: formData.description,
            monthlyPrice: Number(formData.monthlyPrice),
            annualPrice: Number(formData.annualPrice),
            analysisLimit: Number(formData.analysisLimit),
            features: (formData.features || []).filter(f => f.trim() !== ''), // Remove empty features
            isPopular: !!formData.isPopular
        };

        try {
            // FIX: The route is mounted at /api/plans, so client should request /plans/{key}
            const endpoint = `/plans/${formData.key}`;
            const method = 'PUT'; // We use PUT for upsert logic in backend
            
            await apiClient.request(method, endpoint, payload);
            alert("Plan saved successfully.");
            setEditMode(null);
            fetchPlans();
        } catch (e: any) {
            console.error("Save failed", e);
            const errorMsg = e.response?.data?.message || e.message || "Unknown Error";
            alert(`Failed to save plan: ${errorMsg}`);
        }
    };

    const handleDelete = async (key: string) => {
        if (window.confirm(`Are you sure you want to delete the plan '${key}'? Users currently on this plan may experience issues.`)) {
            try {
                // FIX: The route is mounted at /api/plans, so client should request /plans/{key}
                await apiClient.delete(`/plans/${key}`);
                fetchPlans();
            } catch (e: any) {
                console.error("Delete failed", e);
                const errorMsg = e.response?.data?.message || e.message || "Unknown Error";
                alert(`Failed to delete plan: ${errorMsg}`);
            }
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader text="Loading Plans..." /></div>;

    const monthlyPlans = plans.filter(p => p.key !== 'PayAsYouGo');
    const paygPlans = plans.filter(p => p.key === 'PayAsYouGo');

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Subscription Plans Setup</h1>
            
            <div className="mb-8 flex justify-end">
                 <button 
                    onClick={handleAddNew}
                    className="bg-brand-blue text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700"
                >
                    + Add New Plan
                </button>
            </div>

            {/* Edit Form */}
            {editMode && (
                <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 mb-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4">{editMode === 'NEW' ? 'Add New Plan' : `Edit Plan: ${editMode}`}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Plan Key (ID)</label>
                            <input 
                                type="text" 
                                name="key" 
                                value={formData.key || ''} 
                                onChange={handleChange} 
                                disabled={editMode !== 'NEW'}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
                                placeholder="e.g., PayAsYouGo"
                            />
                            <p className="text-xs text-gray-500">Unique identifier. No spaces recommended.</p>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Display Name</label>
                            <input 
                                type="text" 
                                name="name" 
                                value={formData.name || ''} 
                                onChange={handleChange} 
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Monthly Price ($)</label>
                            <input 
                                type="number" 
                                name="monthlyPrice" 
                                value={formData.monthlyPrice} 
                                onChange={handleChange} 
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Annual Price ($)</label>
                            <input 
                                type="number" 
                                name="annualPrice" 
                                value={formData.annualPrice} 
                                onChange={handleChange} 
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Analysis Limit (per month)</label>
                            <input 
                                type="number" 
                                name="analysisLimit" 
                                value={formData.analysisLimit} 
                                onChange={handleChange} 
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded"
                            />
                            <p className="text-xs text-gray-500">Use -1 for Unlimited. Use 0 for Pay-As-You-Go.</p>
                        </div>
                         <div className="flex items-center pt-6">
                             <label className="flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="isPopular" 
                                    checked={formData.isPopular || false} 
                                    onChange={handleChange} 
                                    className="h-4 w-4 text-brand-blue border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">Mark as "Most Popular"</span>
                            </label>
                        </div>
                        <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-gray-700">Description</label>
                             <textarea 
                                name="description" 
                                value={formData.description || ''} 
                                onChange={handleChange} 
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded h-20"
                             />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Features List</label>
                        {formData.features?.map((feat, idx) => (
                            <div key={idx} className="flex mb-2">
                                <input 
                                    type="text" 
                                    value={feat} 
                                    onChange={(e) => handleFeatureChange(e, idx)} 
                                    className="flex-1 px-3 py-1 border border-gray-300 rounded mr-2"
                                />
                                <button onClick={() => removeFeature(idx)} className="text-red-500 hover:text-red-700 px-2">X</button>
                            </div>
                        ))}
                        <button onClick={addFeature} className="text-sm text-brand-blue hover:underline">+ Add Feature</button>
                    </div>

                    <div className="flex justify-end space-x-4 border-t pt-4">
                        <button onClick={handleCancelEdit} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save Changes</button>
                    </div>
                </div>
            )}

            {/* Monthly Plans Section */}
            <h2 className="text-lg font-bold text-gray-700 mb-4">Monthly Subscriptions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
                {monthlyPlans.map(plan => (
                    <PlanCard key={plan.key} plan={plan} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
            </div>

            {/* Pay As You Go Section */}
            <h2 className="text-lg font-bold text-gray-700 mb-4">On-Demand</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {paygPlans.map(plan => (
                    <PlanCard key={plan.key} plan={plan} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
            </div>

            <div className="mt-12 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2">Configuration Help</h3>
                <p className="text-sm text-gray-600">
                    Use this page to configure subscription tiers. The backend logic for limits and pricing will automatically pull the values set here.
                    <br/><br/>
                    <strong>Pay As You Go:</strong> To use the Pay As You Go logic, set the Key to "PayAsYouGo". The backend is hardcoded to look for this specific key to trigger credit deduction logic ($7 per report). Set the monthly price to 0.
                </p>
            </div>
        </div>
    );
};

export default AdminSetup;