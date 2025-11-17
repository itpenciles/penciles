import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BuildingOfficeIcon, ExclamationTriangleIcon } from '../constants';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const LoginPage: React.FC = () => {
    const { user, isLoading, authError, isAuthEnabled, clientIdForDebugging, handleGoogleLogin } = useAuth();
    const navigate = useNavigate();
    const googleButtonRef = useRef<HTMLDivElement>(null);
    const [gsiError, setGsiError] = useState<string | null>(null);

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
    const isDatabaseError = authError && authError.toLowerCase().includes('database');

    const ClientIdErrorDisplay = () => (
        <>
            <h3 className="font-semibold">We're very close! Let's solve this.</h3>
            <p className="mt-1">
                The server is rejecting the login. This almost always means the server is using a different (likely outdated) Client ID than the one on this page, even if you've updated it in Render.
            </p>
            
            <div className="mt-3 pt-3 border-t border-yellow-200">
                <h4 className="font-bold">Final Debugging Checklist:</h4>
                <ol className="list-decimal list-inside text-xs mt-2 space-y-2">
                    <li>
                        Go to your service on your <strong>Render Dashboard</strong> and click the <strong>"Logs"</strong> tab.
                    </li>
                    <li>
                        Look for a message block at the top of your logs that says:<br/>
                        <code className="bg-yellow-100 text-yellow-900 p-1 rounded text-[10px]">--- SERVER STARTUP ---</code>
                    </li>
                    <li>
                        Inside that block, find the line:<br/>
                        <code className="bg-yellow-100 text-yellow-900 p-1 rounded text-[10px]">Server will use Client ID ending in: ...xxxxxxxxxxxxxxx</code>
                    </li>
                    <li>
                        <strong>Compare the ID from your logs</strong> to the ID this page is using below. They **MUST** match exactly.
                    </li>
                    <li>
                        <strong>If they do NOT match:</strong> Go to your <strong>"Environment"</strong> tab in Render, confirm the `VITE_GOOGLE_CLIENT_ID` is correct, then click <strong>"Manual Deploy" &gt; "Deploy latest commit"</strong> to force the server to restart with the new, correct value.
                    </li>
                </ol>

                <p className="font-semibold mt-3 text-xs">This Page is Using:</p>
                <p className="font-mono bg-yellow-100 text-yellow-900 p-2 mt-1 rounded break-all select-all text-xs">
                    {clientIdForDebugging}
                </p>
            </div>
        </>
    );

    const DatabaseErrorDisplay = () => (
        <>
            <h3 className="font-semibold">Database Connection Issue Detected!</h3>
            <p className="mt-1">
                Your login was successful, but the server failed to save your data. This is because the server is connected to the **wrong database**.
            </p>
            
            <div className="mt-3 pt-3 border-t border-yellow-200">
                <h4 className="font-bold">Final Database Checklist:</h4>
                <ol className="list-decimal list-inside text-xs mt-2 space-y-2">
                    <li>
                        Go to your service on your <strong>Render Dashboard</strong> and click the <strong>"Logs"</strong> tab.
                    </li>
                    <li>
                        Look for a message at the top of your logs that says:<br/>
                        <code className="bg-yellow-100 text-yellow-900 p-1 rounded text-[10px]">✅ Successfully connected to database: 'your_db_name'</code>
                    </li>
                    <li>
                        Compare <code className="bg-yellow-100 text-yellow-900 p-1 rounded text-[10px]">'your_db_name'</code> from the log with the database you configured (e.g., <code className="bg-yellow-100 text-yellow-900 p-1 rounded text-[10px]">'terrace_db'</code>). They **MUST** be the same.
                    </li>
                    <li>
                        <strong>If they do NOT match:</strong> Go to your <strong>"Environment"</strong> tab in Render and edit your `DATABASE_URL` variable. The database name is the part at the very end of the URL after the last slash (`/`). Correct it to match your intended database name and save the change.
                    </li>
                    <li>
                         A new deployment will start automatically, and the issue will be resolved.
                    </li>
                </ol>
            </div>
        </>
    );

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
                                        {isDatabaseError ? <DatabaseErrorDisplay /> : <ClientIdErrorDisplay />}
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