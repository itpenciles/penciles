import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';

interface AuthContextType {
    user: User | null;
    logout: () => void;
    isLoading: boolean;
    isAuthEnabled: boolean;
    token: string | null;
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

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const isAuthEffectivelyEnabled = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'undefined' && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID_HERE'));


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [clientIdForDebugging, setClientIdForDebugging] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleGoogleLogin = useCallback((response: any) => {
        setIsLoading(true);
        console.log("Received Google credential:", response.credential);

        try {
            const token = response.credential;
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));

            const decodedToken = JSON.parse(jsonPayload);

            const userFromToken: User = {
                id: decodedToken.sub,
                name: decodedToken.name,
                email: decodedToken.email,
                profilePictureUrl: decodedToken.picture,
            };
            
            localStorage.setItem('authToken', token);
            setToken(token);
            setUser(userFromToken);
            setIsLoading(false);
            navigate('/dashboard');

        } catch (error) {
            console.error("Error decoding token or logging in:", error);
            setAuthError("Failed to decode the login credential. The token may be invalid or expired.");
            setIsLoading(false);
        }
    }, [navigate]);

    // This effect runs on initial load to check for an existing session
    useEffect(() => {
        setClientIdForDebugging(GOOGLE_CLIENT_ID || 'Not Found in .env file');
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
                     const base64Url = storedToken.split('.')[1];
                     const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                     const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                         return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                     }).join(''));
                     const decodedToken = JSON.parse(jsonPayload);

                     if (decodedToken.exp * 1000 > Date.now()) {
                         const mockUser: User = {
                            id: decodedToken.sub,
                            name: decodedToken.name,
                            email: decodedToken.email,
                            profilePictureUrl: decodedToken.picture,
                         };
                         setUser(mockUser);
                         setToken(storedToken);
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
        setToken(null);
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
        token,
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