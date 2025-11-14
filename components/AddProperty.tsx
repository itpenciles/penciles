import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../hooks/useProperties';
import apiClient from '../services/apiClient';
import Loader from './Loader';
import { ArrowLeftIcon, MapPinIcon, LinkIcon } from '../constants';
import { Property } from '../types';

// --- Icons ---
const GlobeAltIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
const PaperAirplaneIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const XCircleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;


const analyzeAndSaveProperty = async (
    inputType: 'url' | 'address' | 'coords' | 'location',
    value: string,
    addPropertyHook: (propertyData: Omit<Property, 'id'>) => Promise<Property>
): Promise<Property> => {
    // Step 1: Call backend to get AI analysis
    const analysisResponse = await apiClient.post('/analyze', { inputType, value });
    const analyzedData = analysisResponse.data;

    // Step 2: Call backend to save the analyzed property to the user's account
    const newProperty = await addPropertyHook(analyzedData);
    return newProperty;
};


const AddProperty = () => {
    const [view, setView] = useState<'options' | 'url' | 'address' | 'coords'>('options');
    
    // States for inputs
    const [urls, setUrls] = useState<string[]>(['']);
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState({ lat: '', lon: '' });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const { addProperty } = useProperties();

    // URL input handlers
    const handleUrlChange = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };
    const handleAddUrl = () => { if (urls.length < 4) { setUrls([...urls, '']); } };
    const handleRemoveUrl = (index: number) => { setUrls(urls.filter((_, i) => i !== index)); };

    // Coords input handler
    const handleCoordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCoords(prev => ({...prev, [name]: value}));
    };

    // Analysis handlers
    const handleUrlAnalyze = async () => {
        const validUrls = urls.map(u => u.trim()).filter(u => u.length > 0);
        if (validUrls.length === 0) {
            setError('Please enter at least one valid URL.');
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            // We analyze and save them one by one
            for (const url of validUrls) {
                await analyzeAndSaveProperty('url', url, addProperty);
            }
            navigate('/dashboard');
        } catch (e: any) {
            setError(e.response?.data?.message || e.message || 'An unknown error occurred while analyzing one or more properties.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSinglePropertyAnalysis = async (inputType: 'address' | 'coords' | 'location', value: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const newProperty = await analyzeAndSaveProperty(inputType, value, addProperty);
            navigate(`/property/${newProperty.id}`);
        } catch (e: any) {
            setError(e.response?.data?.message || e.message || 'An unknown error occurred while analyzing.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddressAnalyze = async () => {
        if (!address.trim()) {
            setError('Please enter a valid address.');
            return;
        }
        await handleSinglePropertyAnalysis('address', address);
    };
    
    const handleCoordsAnalyze = async () => {
        const { lat, lon } = coords;
        if (!lat.trim() || !lon.trim() || isNaN(Number(lat)) || isNaN(Number(lon))) {
            setError('Please enter valid latitude and longitude numbers.');
            return;
        }
        await handleSinglePropertyAnalysis('coords', `${lat},${lon}`);
    };

    const handleCurrentLocation = () => {
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                handleSinglePropertyAnalysis('location', `${latitude},${longitude}`);
            },
            (err) => {
                setError(`Geolocation error: ${err.message}`);
                setIsLoading(false);
            }
        );
    }

    const renderOptions = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <OptionCard icon={MapPinIcon} title="Manual Entry" description="Type in the property address" bgColor="bg-blue-100" iconColor="text-blue-600" onClick={() => setView('address')} />
            <OptionCard icon={LinkIcon} title="Listing URL" description="Paste a Zillow, Redfin, or MLS link" bgColor="bg-purple-100" iconColor="text-purple-600" onClick={() => setView('url')} />
            <OptionCard icon={GlobeAltIcon} title="GPS Coordinates" description="Enter latitude and longitude" bgColor="bg-green-100" iconColor="text-green-600" onClick={() => setView('coords')} />
            <OptionCard icon={PaperAirplaneIcon} title="Current Location" description="Use your device's GPS" bgColor="bg-orange-100" iconColor="text-orange-600" onClick={handleCurrentLocation} />
        </div>
    );

    const renderUrlInput = () => {
        const validUrlCount = urls.filter(u => u.trim().length > 0).length;
        return (
            <div className="w-full max-w-2xl mx-auto">
                 {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
                <div className="bg-white p-8 rounded-xl shadow-md">
                    <div className="flex items-center mb-6">
                        <LinkIcon className="h-6 w-6 text-gray-500" />
                        <h3 className="text-xl font-bold text-gray-800 ml-3">Listing URL(s)</h3>
                    </div>
                    <div className="mb-4 space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Property Listing URLs (up to 4) <span className="text-red-500">*</span>
                        </label>
                        {urls.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => handleUrlChange(index, e.target.value)}
                                    placeholder="https://www.zillow.com/homedetails/..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                                />
                                {urls.length > 1 && (
                                    <button onClick={() => handleRemoveUrl(index)} className="p-1 text-gray-400 hover:text-red-500">
                                        <XCircleIcon className="h-6 w-6" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {urls.length < 4 && (
                        <button onClick={handleAddUrl} className="text-sm font-semibold text-brand-blue hover:text-blue-700 mb-6">
                            + Add another URL
                        </button>
                    )}
                    <div className="flex justify-between items-center mt-6">
                        <button onClick={() => setView('options')} className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                            Back
                        </button>
                        <button onClick={handleUrlAnalyze} disabled={isLoading || validUrlCount === 0} className="px-6 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center">
                            {isLoading ? <Loader /> : `Analyze ${validUrlCount > 0 ? validUrlCount : ''} ${validUrlCount === 1 ? 'Property' : 'Properties'}`.trim()}
                        </button>
                    </div>
                </div>
            </div>
        );
    };
    
    const renderAddressInput = () => (
        <div className="w-full max-w-2xl mx-auto">
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-6">
                    <MapPinIcon className="h-6 w-6 text-gray-500" />
                    <h3 className="text-xl font-bold text-gray-800 ml-3">Property Address</h3>
                </div>
                <div className="mb-4">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                        Enter the full property address <span className="text-red-500">*</span>
                    </label>
                    <input
                        id="address"
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Main St, Anytown, USA 12345"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                    />
                </div>
                <div className="flex justify-between items-center mt-6">
                    <button onClick={() => setView('options')} className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        Back
                    </button>
                    <button onClick={handleAddressAnalyze} disabled={isLoading || !address.trim()} className="px-6 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center">
                        {isLoading ? <Loader /> : 'Analyze Property'}
                    </button>
                </div>
            </div>
        </div>
    );
    
    const renderCoordsInput = () => (
        <div className="w-full max-w-2xl mx-auto">
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-md mb-4">{error}</p>}
            <div className="bg-white p-8 rounded-xl shadow-md">
                <div className="flex items-center mb-6">
                    <GlobeAltIcon className="h-6 w-6 text-gray-500" />
                    <h3 className="text-xl font-bold text-gray-800 ml-3">GPS Coordinates</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="lat" className="block text-sm font-medium text-gray-700 mb-2">
                            Latitude <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="lat"
                            name="lat"
                            type="number"
                            value={coords.lat}
                            onChange={handleCoordChange}
                            placeholder="e.g., 40.7128"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                    <div>
                        <label htmlFor="lon" className="block text-sm font-medium text-gray-700 mb-2">
                            Longitude <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="lon"
                            name="lon"
                            type="number"
                            value={coords.lon}
                            onChange={handleCoordChange}
                            placeholder="e.g., -74.0060"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                </div>
                <div className="flex justify-between items-center mt-6">
                    <button onClick={() => setView('options')} className="px-6 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">
                        Back
                    </button>
                    <button onClick={handleCoordsAnalyze} disabled={isLoading || !coords.lat.trim() || !coords.lon.trim()} className="px-6 py-2 text-sm font-semibold text-white bg-brand-blue rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center">
                        {isLoading ? <Loader /> : 'Analyze Coordinates'}
                    </button>
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch(view) {
            case 'url': return renderUrlInput();
            case 'address': return renderAddressInput();
            case 'coords': return renderCoordsInput();
            case 'options':
            default: return renderOptions();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="flex items-center mb-8">
                    <button onClick={() => view !== 'options' ? setView('options') : navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 mr-4">
                        <ArrowLeftIcon className="h-6 w-6 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Add Property for Analysis</h1>
                        <p className="text-gray-600 mt-1">Choose how you'd like to input the property information</p>
                    </div>
                </div>

                <div className="relative">
                    {isLoading && view === 'options' && <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-xl z-10"><Loader text="Analyzing location..." /></div>}
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};


interface OptionCardProps {
    icon: React.ElementType;
    title: string;
    description: string;
    bgColor: string;
    iconColor: string;
    onClick: () => void;
}

const OptionCard: React.FC<OptionCardProps> = ({ icon: Icon, title, description, bgColor, iconColor, onClick }) => (
    <button onClick={onClick} className="bg-white p-8 rounded-xl shadow-sm text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
        <div className={`w-16 h-16 ${bgColor} rounded-xl flex items-center justify-center mb-4`}>
            <Icon className={`h-8 w-8 ${iconColor}`} />
        </div>
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <p className="text-gray-500 mt-1">{description}</p>
    </button>
);

export default AddProperty;
