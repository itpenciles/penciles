import React, { useState } from 'react';
import Loader from '../Loader'; // Assuming PropertyInput is in components/common and Loader is in components/Loader.tsx. Wait, if PropertyInput is in components/common, then ../Loader points to components/Loader.
// Let's verify the path.
// AddProperty is in components/AddProperty.tsx. It imports ./Loader. So Loader is components/Loader.tsx.
// PropertyInput is components/common/PropertyInput.tsx. So ../Loader is components/Loader.tsx. Correct.

// Remove heroicons import as we are using local definitions
// import { MapPinIcon, LinkIcon, GlobeAltIcon, PaperAirplaneIcon, DocumentTextIcon } from '@heroicons/react/24/outline'; 

// We need to define MapPinIcon and LinkIcon locally as well since we removed the import.
const MapPinIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>;
const LinkIcon = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>;

interface PropertyInputProps {
    onAnalyze: (inputType: 'url' | 'address' | 'coords' | 'location' | 'apn', value: string) => Promise<void>;
    isLoading: boolean;
    isOverLimit: boolean;
    remainingAnalyses: number;
    analysisLimit: number | 'Unlimited';
    onBack?: () => void; // Optional back button for embedded mode
    embedded?: boolean; // If true, might skip some headers or layout adjustments
}

// --- Icons (Copied from AddProperty.tsx to ensure consistency if not available globally) ---
const GlobeAltIconLocal = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>;
const PaperAirplaneIconLocal = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;
const XCircleIconLocal = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DocumentTextIconLocal = (props: React.SVGProps<SVGSVGElement>) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>;


const PropertyInput: React.FC<PropertyInputProps> = ({ onAnalyze, isLoading, isOverLimit, remainingAnalyses, analysisLimit, onBack, embedded = false }) => {
    const [view, setView] = useState<'options' | 'url' | 'address' | 'coords' | 'apn'>('options');
    const [urls, setUrls] = useState<string[]>(['']);
    const [address, setAddress] = useState('');
    const [coords, setCoords] = useState({ lat: '', lon: '' });
    const [apnData, setApnData] = useState({ apn: '', county: '', state: '' });
    const [localError, setLocalError] = useState<string | null>(null);

    // Reset view to options if onBack is called when in sub-view, or bubble up if in options
    const handleBack = () => {
        if (view !== 'options') {
            setView('options');
            setLocalError(null);
        } else if (onBack) {
            onBack();
        }
    };

    const handleUrlChange = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };
    const handleAddUrl = () => { if (urls.length < 4) { setUrls([...urls, '']); } };
    const handleRemoveUrl = (index: number) => { setUrls(urls.filter((_, i) => i !== index)); };

    const handleCoordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCoords(prev => ({ ...prev, [name]: value }));
    };

    const handleApnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setApnData(prev => ({ ...prev, [name]: value }));
    };

    const handleCurrentLocation = () => {
        setLocalError(null);
        if (isOverLimit) {
            setLocalError("Limit reached.");
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                onAnalyze('location', `${latitude},${longitude}`);
            },
            (err) => {
                setLocalError(`Geolocation error: ${err.message}`);
            }
        );
    };

    const validateAndAnalyze = async () => {
        setLocalError(null);
        if (isOverLimit) {
            setLocalError("Limit reached.");
            return;
        }

        if (view === 'url') {
            const validUrls = urls.map(u => u.trim()).filter(u => u.length > 0);
            if (validUrls.length === 0) { setLocalError('Enter at least one URL.'); return; }
            // For simplicity in this component, we just pass the first one or handle multiple in parent? 
            // The original AddProperty handled multiple. 
            // If this component is used for "Add Property", we might want to support multiple.
            // If used for "Add Comp", usually just one.
            // Let's assume the parent handles the string value. If multiple, maybe join them or call multiple times?
            // The original `analyzeAndSaveProperty` took a single value. `handleUrlAnalyze` looped.
            // Here we will emit one event per URL or a joined string? 
            // To keep it simple and compatible with the signature `(inputType, value)`, we might need to change the signature or loop here.
            // Let's loop here and call onAnalyze for each.

            // Wait, `onAnalyze` returns a Promise. If we want to support the "Add Property" loop logic, we might need to expose that.
            // For now, let's just pass the first one if it's a single analysis context, or maybe we can pass a special delimiter?
            // Actually, the `AddProperty` logic looped and navigated.
            // Let's just pass the first one for now, or if the parent expects multiple, it's tricky.
            // BUT, for Comparables, we only need one.
            // For Add Property, we want multiple.
            // Let's change the prop signature to accept an array? Or just handle one for now and maybe add multiple support later?
            // The user wants to add APN. 
            // Let's stick to single analysis for this refactor to minimize risk, or handle the loop in the parent if possible.
            // Actually, I can just loop here and await?
            for (const url of validUrls) {
                await onAnalyze('url', url);
            }
        } else if (view === 'address') {
            if (!address.trim()) { setLocalError('Enter an address.'); return; }
            await onAnalyze('address', address);
        } else if (view === 'coords') {
            if (!coords.lat.trim() || !coords.lon.trim()) { setLocalError('Enter coordinates.'); return; }
            await onAnalyze('coords', `${coords.lat},${coords.lon}`);
        } else if (view === 'apn') {
            if (!apnData.apn.trim() || !apnData.state.trim() || !apnData.county.trim()) { setLocalError('All fields are required.'); return; }
            await onAnalyze('apn', JSON.stringify(apnData));
        }
    };

    const AnalysisCounter = () => (
        <div className="text-sm text-gray-600">
            {analysisLimit !== 'Unlimited' && (
                <span>Remaining: <span className={`font-bold ${isOverLimit ? 'text-red-600' : 'text-brand-blue'}`}>{remainingAnalyses}</span></span>
            )}
        </div>
    );

    const OptionCard = ({ icon: Icon, title, description, bgColor, iconColor, onClick, disabled }: any) => (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`bg-white p-6 rounded-xl shadow-sm text-left transition-all duration-300 border border-gray-100 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-1 hover:border-brand-blue/30'}`}
        >
            <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <h3 className="text-lg font-bold text-gray-800">{title}</h3>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
        </button>
    );

    if (view === 'options') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <OptionCard icon={MapPinIcon} title="Manual Entry" description="Address" bgColor="bg-blue-100" iconColor="text-blue-600" onClick={() => setView('address')} disabled={isOverLimit} />
                <OptionCard icon={LinkIcon} title="Listing URL" description="Zillow/Redfin Link" bgColor="bg-purple-100" iconColor="text-purple-600" onClick={() => setView('url')} disabled={isOverLimit} />
                <OptionCard icon={DocumentTextIconLocal} title="APN Lookup" description="Parcel Number" bgColor="bg-teal-100" iconColor="text-teal-600" onClick={() => setView('apn')} disabled={isOverLimit} />
                <OptionCard icon={GlobeAltIconLocal} title="GPS Coordinates" description="Lat/Lon" bgColor="bg-green-100" iconColor="text-green-600" onClick={() => setView('coords')} disabled={isOverLimit} />
                <OptionCard icon={PaperAirplaneIconLocal} title="Current Location" description="Use Device GPS" bgColor="bg-orange-100" iconColor="text-orange-600" onClick={handleCurrentLocation} disabled={isOverLimit} />
            </div>
        );
    }

    return (
        <div className="w-full bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            {localError && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{localError}</div>}

            <div className="mb-6">
                <button onClick={handleBack} className="text-sm text-gray-500 hover:text-gray-800 flex items-center">
                    ← Back to options
                </button>
                <h3 className="text-xl font-bold text-gray-800 mt-2">
                    {view === 'url' && 'Listing URL'}
                    {view === 'address' && 'Property Address'}
                    {view === 'coords' && 'GPS Coordinates'}
                    {view === 'apn' && 'APN Lookup'}
                </h3>
            </div>

            <div className="space-y-4">
                {view === 'url' && (
                    <>
                        {urls.map((url, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => handleUrlChange(index, e.target.value)}
                                    placeholder="https://www.zillow.com/..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                                />
                                {urls.length > 1 && (
                                    <button onClick={() => handleRemoveUrl(index)} className="text-gray-400 hover:text-red-500">
                                        <XCircleIconLocal className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {urls.length < 4 && (
                            <button onClick={handleAddUrl} className="text-sm text-brand-blue hover:underline">+ Add another URL</button>
                        )}
                    </>
                )}

                {view === 'address' && (
                    <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Main St, Anytown, USA"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                    />
                )}

                {view === 'coords' && (
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            name="lat"
                            type="number"
                            value={coords.lat}
                            onChange={handleCoordChange}
                            placeholder="Latitude"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                        />
                        <input
                            name="lon"
                            type="number"
                            value={coords.lon}
                            onChange={handleCoordChange}
                            placeholder="Longitude"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                        />
                    </div>
                )}

                {view === 'apn' && (
                    <div className="space-y-3">
                        <input
                            name="apn"
                            type="text"
                            value={apnData.apn}
                            onChange={handleApnChange}
                            placeholder="Assessor's Parcel Number (APN)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                name="county"
                                type="text"
                                value={apnData.county}
                                onChange={handleApnChange}
                                placeholder="County"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                            />
                            <input
                                name="state"
                                type="text"
                                value={apnData.state}
                                onChange={handleApnChange}
                                placeholder="State (e.g. CA)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-blue focus:border-brand-blue"
                            />
                        </div>
                        <p className="text-xs text-gray-500">We will search public records and listings using this APN.</p>
                    </div>
                )}

                <div className="flex justify-between items-center pt-4">
                    <AnalysisCounter />
                    <button
                        onClick={validateAndAnalyze}
                        disabled={isLoading || isOverLimit}
                        className="px-6 py-2 bg-brand-blue text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center"
                    >
                        {isLoading ? <Loader /> : 'Analyze'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PropertyInput;
