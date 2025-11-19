
import React, { useState, useEffect } from 'react';
import apiClient from '../services/apiClient';
import Loader from './Loader';
import { Plan } from '../types';

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
        if (type === 'number') val = Number(value);
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

        try {
            const endpoint = `/admin/plans/${formData.key}`;
            const method = 'PUT'; // We use PUT for upsert logic in backend
            
            await apiClient.request(method, endpoint, formData);
            alert("Plan saved successfully.");
            setEditMode(null);
            fetchPlans();
        } catch (e: any) {
            console.error("Save failed", e);
            alert(`Failed to save plan: ${e.message}`);
        }
    };

    const handleDelete = async (key: string) => {
        if (window.confirm(`Are you sure you want to delete the plan '${key}'? Users currently on this plan may experience issues.`)) {
            try {
                await apiClient.delete(`/admin/plans/${key}`);
                fetchPlans();
            } catch (e: any) {
                alert(`Failed to delete plan: ${e.message}`);
            }
        }
    };

    if (isLoading) return <div className="p-8 text-center"><Loader text="Loading Plans..." /></div>;

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
                                placeholder="e.g., Enterprise"
                            />
                            <p className="text-xs text-gray-500">Unique identifier (no spaces recommended).</p>
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
                                value={formData.monthlyPrice || 0} 
                                onChange={handleChange} 
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Annual Price ($)</label>
                            <input 
                                type="number" 
                                name="annualPrice" 
                                value={formData.annualPrice || 0} 
                                onChange={handleChange} 
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded"
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Analysis Limit (per month)</label>
                            <input 
                                type="number" 
                                name="analysisLimit" 
                                value={formData.analysisLimit || 0} 
                                onChange={handleChange} 
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded"
                            />
                            <p className="text-xs text-gray-500">Use -1 for Unlimited.</p>
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

            {/* Plans List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map(plan => (
                    <div key={plan.key} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden relative">
                        {plan.isPopular && <div className="bg-yellow-400 text-xs font-bold text-center py-1 text-yellow-900 uppercase">Most Popular</div>}
                        <div className="p-6">
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
                            
                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Features</h4>
                                <ul className="text-sm text-gray-600 space-y-1 h-32 overflow-y-auto">
                                    {plan.features.map((f, i) => (
                                        <li key={i} className="flex items-start">
                                            <span className="mr-2">•</span> {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 flex justify-between">
                            <button onClick={() => handleEdit(plan)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Edit Plan</button>
                            <button onClick={() => handleDelete(plan.key)} className="text-red-500 hover:text-red-700 font-medium text-sm">Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-gray-800 mb-2">Configuration Help</h3>
                <p className="text-sm text-gray-600">
                    Use this page to configure subscription tiers. The backend logic for limits and pricing will automatically pull the values set here.
                    <br/><br/>
                    <strong>Pay As You Go:</strong> To create a pay-as-you-go model, create a new plan named "Pay As You Go", set the monthly price to 0, and set the limit to 0. (Note: Full credit-based logic requires additional backend development).
                </p>
            </div>
        </div>
    );
};

export default AdminSetup;
