import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BuildingOfficeIcon, ExclamationTriangleIcon } from '../constants';

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;

const LoginPage: React.FC = () => {
    const { user, isLoading, authError, isAuthEnabled, clientIdForDebugging, handleGoogleLogin } = useAuth();
    const navigate = useNavigate();
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [gsiError, setGsiError] = useState<string | null>(null);
    const [currentOrigin, setCurrentOrigin] = useState('');

    useEffect(() => {
        // Set the current origin dynamically for the troubleshooting guide
        setCurrentOrigin(window.location.origin);
    }, []);

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (!isAuthEnabled || isLoading || user) {
            return;
        }

        setGsiError(null); // Clear previous errors on re-run

        const initializeAndRenderButton = () => {
            if (window.google?.accounts?.id) {
                try {
                    window.google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: handleGoogleLogin,
                        use_fedcm_for_prompt: true,
                    });
    
                    if (googleButtonRef.current && googleButtonRef.current.childElementCount === 0) {
                        window.google.accounts.id.renderButton(
                            googleButtonRef.current,
                            { theme: "outline", size: "large", type: "standard" }
                        );
                    }
                } catch (error: any) {
                    console.error("Error initializing or rendering Google Sign-In:", error);
                    const errorMessage = error.message || "An unknown error occurred during Google Sign-In setup.";
                    setGsiError(`Google Sign-In Error: ${errorMessage}. This is likely caused by a misconfiguration in your Google Cloud Console. Please carefully check your 'Authorized JavaScript Origins' and Client ID.`);
                }
            }
        };

        if (typeof window.google !== 'undefined') {
            initializeAndRenderButton();
            return;
        }

        // Poll for the GSI script if it's not immediately available
        let attemptCount = 0;
        const maxAttempts = 30; // Poll for 3 seconds
        const intervalId = setInterval(() => {
            if (typeof window.google !== 'undefined') {
                clearInterval(intervalId);
                initializeAndRenderButton();
            } else if (attemptCount >= maxAttempts) {
                clearInterval(intervalId);
                console.error("Google GSI script did not load in time.");
                setGsiError("The Google Sign-In script failed to load. Please check your internet connection and try again.");
            }
            attemptCount++;
        }, 100);

        return () => clearInterval(intervalId);

    }, [isAuthEnabled, isLoading, user, handleGoogleLogin]);
    
    const finalError = authError || gsiError;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="max-w-md w-full mx-auto">
                <div className="flex justify-center items-center mb-6">
                    <BuildingOfficeIcon className="h-10 w-10 text-brand-blue" />
                    <h1 className="ml-3 text-3xl font-bold text-gray-800">It Pencils</h1>
                </div>
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Sign in or create an account to save your properties and access your dashboard.
                        </p>
                    </div>

                    <div className="mt-8">
                        {finalError && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg mb-4 text-sm">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="font-semibold">Configuration Notice</h3>
                                        <p className="mt-1">{finalError}</p>
                                        {clientIdForDebugging && (
                                            <div className="mt-3 pt-3 border-t border-yellow-200">
                                                <h4 className="font-semibold">Troubleshooting Steps:</h4>
                                                <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                                                    <li>Ensure the Client ID below exactly matches the one in your Google Console.</li>
                                                    <li>In Google Console, verify "Authorized JavaScript origins" includes <code className="bg-yellow-100 text-yellow-900 p-1 rounded">{currentOrigin}</code>.</li>
                                                     <li>Make sure "Authorized redirect URIs" is **empty**.</li>
                                                    <li>After changing your `.env` file or server environment variables, **you must restart/re-deploy the server.**</li>
                                                </ul>
                                                 <p className="font-mono bg-yellow-100 text-yellow-900 p-2 mt-2 rounded break-all select-all text-xs">
                                                    Current Client ID: {clientIdForDebugging}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {isLoading ? (
                            <div className="flex items-center justify-center py-3 text-gray-600">
                                <div className="w-5 h-5 border-2 border-gray-300 border-t-brand-blue rounded-full animate-spin mr-2"></div>
                                <span>Loading Login...</span>
                            </div>
                        ) : (
                             <div ref={googleButtonRef} className="flex justify-center"></div>
                        )}
                       
                    </div>

                    <div className="mt-6">
                        <p className="text-center text-xs text-gray-500">
                            By continuing, you agree to our <a href="#" className="font-medium text-brand-blue hover:underline">Terms of Service</a> and <a href="#" className="font-medium text-brand-blue hover:underline">Privacy Policy</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;