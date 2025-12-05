
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import Loader from './Loader';
import { ArrowLeftIcon, LockClosedIcon } from '../constants';
import PropertyInput from './common/PropertyInput';


const AddProperty = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { addProperty } = useProperties();
    const { analysisStatus } = useAuth();

    const remainingAnalyses = analysisStatus.limit === 'Unlimited' ? Infinity : Math.max(0, analysisStatus.limit - analysisStatus.count);
    const isOverLimit = analysisStatus.isOverLimit;

    const analyzeAndSaveProperty = async (
        inputType: 'url' | 'address' | 'coords' | 'location' | 'apn',
        value: string
    ) => {
        setIsLoading(true);
        setError(null);
        try {
            const analyzedData = await apiClient.post('/analyze', { inputType, value });
            const newProperty = await addProperty(analyzedData);
            if (newProperty) {
                navigate(`/property/${newProperty.id}`);
            }
        } catch (e: any) {
            setError(e.response?.data?.message || e.message || 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="flex items-center mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 mr-4">
                        <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Add Property for Analysis</h1>
                        <p className="text-gray-600 mt-1">Choose how you'd like to input the property information</p>
                    </div>
                </div>

                {isOverLimit && (
                    <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
                        <div className="flex items-center text-red-800">
                            <LockClosedIcon className="h-6 w-6 mr-3" />
                            <div>
                                <span className="font-bold block">Analysis Limit Reached</span>
                                <span className="text-sm">You have used all available analyses for your current plan.</span>
                            </div>
                        </div>
                        <button onClick={() => navigate('/upgrade')} className="bg-red-600 text-white text-sm font-bold px-4 py-2 rounded hover:bg-red-700">Upgrade Plan</button>
                    </div>
                )}

                <div className="relative">
                    {isLoading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-20"><Loader text="Analyzing property..." /></div>}

                    {error && <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>}

                    <PropertyInput
                        onAnalyze={analyzeAndSaveProperty}
                        isLoading={isLoading}
                        isOverLimit={isOverLimit}
                        remainingAnalyses={remainingAnalyses}
                        analysisLimit={analysisStatus.limit}
                    />
                </div>
            </div>
        </div>
    );
};


export default AddProperty;

