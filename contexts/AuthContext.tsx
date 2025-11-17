import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import apiClient from '../services/apiClient';

interface AuthContextType {
    user: User | null;
    logout: () => void;
    isLoading: boolean;
    isAuthEnabled: boolean;
    authError: string | null;
    clientIdForDebugging: string | null;
    handleGoogleLogin: (response: any) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

// Add google to the window interface for the GSI library
declare global {
  interface Window {
    google: any;
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const isAuthEffectivelyEnabled = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'undefined' && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID_HERE'));


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [clientIdForDebugging, setClientIdForDebugging] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleGoogleLogin = useCallback(async (response: any) => {
        setIsLoading(true);
        setAuthError(null);
        try {
            const res = await apiClient.post('/auth/google', { token: response.credential });
            // FIX: The apiClient returns the JSON body directly, not an object with a `data` property.
            // This was causing a TypeError on destructuring.
            const { token, user } = res;
            
            localStorage.setItem('authToken', token);
            setUser(user);
            navigate('/dashboard');
        } catch (error: any) {
            console.error("Error logging in with backend:", error);
            setAuthError(error.response?.data?.message || "An unexpected error occurred during login.");
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    // This effect runs on initial load to check for an existing session
    useEffect(() => {
        setClientIdForDebugging(GOOGLE_CLIENT_ID || 'Not Found in environment variables');
        if (!isAuthEffectivelyEnabled) {
            console.warn("VITE_GOOGLE_CLIENT_ID is not configured. Google Sign-In is disabled.");
            setAuthError("Configuration Error: Your Google Client ID is missing or is a placeholder. Please check your .env file and restart your server.");
            setIsLoading(false);
            return;
        }

        const validateToken = async () => {
            const storedToken = localStorage.getItem('authToken');
            if (storedToken) {
                 try {
                     // The best practice is to have a /me endpoint to verify the token
                     // For now, we decode it to check expiration and get user info
                     const base64Url = storedToken.split('.')[1];
                     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                     const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                         return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                     }).join(''));
                     const decodedToken = JSON.parse(jsonPayload);

                     if (decodedToken.exp * 1000 > Date.now()) {
                        // In a real app, you'd fetch the user data from a /me endpoint
                        // For this implementation, we assume the token is the source of truth for display purposes
                         const userFromToken: User = {
                            id: decodedToken.id,
                            name: decodedToken.name,
                            email: decodedToken.email,
                            profilePictureUrl: decodedToken.profilePictureUrl,
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
        handleGoogleLogin
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