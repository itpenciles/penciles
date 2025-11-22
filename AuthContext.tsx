
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, SubscriptionTier, Plan } from '../types';
import apiClient from '../services/apiClient';

interface FeatureAccess {
    canCompare: boolean;
    canUseWholesale: boolean;
    canUseSubjectTo: boolean;
    canUseSellerFinancing: boolean;
    canExportCsv: boolean;
}

interface AnalysisStatus {
    count: number;
    limit: number | 'Unlimited';
    isOverLimit: boolean;
    renewsOn?: string | null;
}

interface AuthContextType {
    user: User | null;
    logout: () => void;
    isLoading: boolean;
    isAuthEnabled: boolean;
    authError: any | null;
    clientIdForDebugging: string | null;
    handleGoogleLogin: (response: any) => void;
    updateSubscription: (tier: SubscriptionTier) => Promise<void>;
    featureAccess: FeatureAccess;
    analysisStatus: AnalysisStatus;
    refreshUser: () => Promise<void>;
    incrementAnalysisCount: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Add google to the window interface for the GSI library
declare global {
    interface Window {
        google: any;
    }
}

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const isAuthEffectivelyEnabled = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'undefined' && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID_HERE'));

const initialFeatureAccess: FeatureAccess = {
    canCompare: false,
    canUseWholesale: false,
    canUseSubjectTo: false,
    canUseSellerFinancing: false,
    canExportCsv: false,
};

const initialAnalysisStatus: AnalysisStatus = {
    count: 0,
    limit: 0,
    isOverLimit: true,
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<any | null>(null);
    const [clientIdForDebugging, setClientIdForDebugging] = useState<string | null>(null);
    const [featureAccess, setFeatureAccess] = useState<FeatureAccess>(initialFeatureAccess);
    const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>(initialAnalysisStatus);
    const [plans, setPlans] = useState<Plan[]>([]);
    const navigate = useNavigate();

    // Fetch plans on mount
    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const fetchedPlans = await apiClient.get('/plans');
                setPlans(fetchedPlans);
            } catch (error) {
                console.error("Failed to fetch plans:", error);
            }
        };
        fetchPlans();
    }, []);

    // Effect to calculate feature flags and analysis status when user changes
    useEffect(() => {
        if (user && user.subscriptionTier) {
            const tier = user.subscriptionTier;

            // Calculate feature access booleans
            const canCompare = ['Starter', 'Pro', 'Team'].includes(tier);
            const canUseAdvancedStrategies = ['Pro', 'Team'].includes(tier);
            const canExportCsv = ['Pro', 'Team'].includes(tier);

            setFeatureAccess({
                canCompare,
                canUseWholesale: canUseAdvancedStrategies,
                canUseSubjectTo: canUseAdvancedStrategies,
                canUseSellerFinancing: canUseAdvancedStrategies,
                canExportCsv,
            });

            // Calculate analysis status
            // Calculate analysis status
            let limit: number | 'Unlimited' = 0;

            // Try to find in dynamic plans first
            const plan = plans.find(p => p.key === tier);

            if (plan) {
                limit = plan.analysisLimit === -1 ? 'Unlimited' : plan.analysisLimit;
            } else {
                // Fallback defaults (legacy)
                const limits: { [key: string]: number | 'Unlimited' } = {
                    'Free': 3,
                    'Starter': 15,
                    'Experienced': 40,
                    'Pro': 100,
                    'Team': 'Unlimited'
                };
                limit = limits[tier] !== undefined ? limits[tier] : 0;
            }

            const count = user.analysisCount || 0;
            const isOverLimit = limit !== 'Unlimited' && count >= limit;
            const renewsOn = user.analysisLimitResetAt ? new Date(user.analysisLimitResetAt).toLocaleDateString() : null;

            setAnalysisStatus({ count, limit, isOverLimit, renewsOn });

        } else {
            setFeatureAccess(initialFeatureAccess);
            setAnalysisStatus(initialAnalysisStatus);
        }
    }, [user, plans]);

    const updateSubscription = useCallback(async (tier: SubscriptionTier) => {
        if (user) {
            try {
                // This is now a real API call to persist the subscription change.
                const { token, user: updatedUser } = await apiClient.put('/user/subscription', { tier });
                localStorage.setItem('authToken', token); // Update the token
                setUser(updatedUser); // Update the user state
            } catch (error) {
                console.error("Failed to update subscription:", error);
                setAuthError(error); // Optionally show an error to the user
            }
        }
    }, [user]);

    const handleGoogleLogin = useCallback(async (response: any) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const res = await apiClient.post('/auth/google', { token: response.credential });
            const { token, user: loggedInUser } = res;

            localStorage.setItem('authToken', token);
            setUser(loggedInUser);

            if (loggedInUser.subscriptionTier) {
                navigate('/dashboard');
            } else {
                navigate('/subscribe');
            }
        } catch (error: any) {
            console.error("Error logging in with backend:", error);
            setAuthError(error);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    const refreshUser = useCallback(async () => {
        if (!user) return;
        try {
            const res = await apiClient.get('/user/profile');
            setUser(prev => prev ? { ...prev, ...res } : res);
        } catch (error) {
            console.error("Failed to refresh user profile:", error);
        }
    }, [user]);

    const incrementAnalysisCount = useCallback(() => {
        if (!user) return;
        setUser(prev => {
            if (!prev) return prev;
            return { ...prev, analysisCount: (prev.analysisCount || 0) + 1 };
        });
    }, [user]);

    // This effect runs on initial load to check for an existing session
    useEffect(() => {
        setClientIdForDebugging(GOOGLE_CLIENT_ID || 'Not Found in environment variables');
        if (!isAuthEffectivelyEnabled) {
            console.warn("VITE_GOOGLE_CLIENT_ID is not configured. Google Sign-In is disabled.");
            setAuthError({ message: "Configuration Error: Your Google Client ID is missing or is a placeholder. Please check your .env file and restart your server." });
            setIsLoading(false);
            return;
        }

        const validateToken = async () => {
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                try {
                    const base64Url = storedToken.split('.')[1];
                    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                    const decodedToken = JSON.parse(jsonPayload);

                    if (decodedToken.exp * 1000 > Date.now()) {
                        const userFromToken: User = {
                            id: decodedToken.id,
                            name: decodedToken.name,
                            email: decodedToken.email,
                            profilePictureUrl: decodedToken.profilePictureUrl,
                            subscriptionTier: decodedToken.subscriptionTier || null,
                            analysisCount: decodedToken.analysisCount || 0,
                            analysisLimitResetAt: decodedToken.analysisLimitResetAt || null,
                            credits: decodedToken.credits || 0,
                            role: decodedToken.role || 'user', // Restore role from token
                        };
                        setUser(userFromToken);
                    } else {
                        localStorage.removeItem('authToken');
                    }
                } catch (e) {
                    console.error("Could not decode stored token", e);
                    localStorage.removeItem('authToken');
                }
            }
            setIsLoading(false);
        };
        validateToken();
    }, []);

    const logout = () => {
        setUser(null);
        localStorage.removeItem('authToken');
        if (isAuthEffectivelyEnabled && typeof window.google !== 'undefined') {
            window.google.accounts.id.disableAutoSelect();
        }
        navigate('/');
    };

    const contextValue: AuthContextType = {
        user,
        logout,
        isLoading,
        isAuthEnabled: isAuthEffectivelyEnabled,
        authError,
        clientIdForDebugging,
        handleGoogleLogin,
        updateSubscription,
        featureAccess,
        analysisStatus,
        refreshUser,
        incrementAnalysisCount,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
