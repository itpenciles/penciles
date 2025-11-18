import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { PropertyProvider } from './contexts/PropertyContext';

// Layouts
import Sidebar from './components/Sidebar';
import PublicLayout from './components/PublicLayout';

// Public Pages
import LandingPage from './components/LandingPage';
import AboutPage from './components/AboutPage';
import FeaturesPage from './components/FeaturesPage';
import PricingPage from './components/PricingPage';
import ContactPage from './components/ContactPage';
import LoginPage from './components/LoginPage';

// App Pages
import Dashboard from './components/Dashboard';
import AddProperty from './components/AddProperty';
import PropertyDetail from './components/PropertyDetail';
import ComparisonPage from './components/ComparisonPage';
import SubscriptionPage from './components/SubscriptionPage';
import CheckoutPage from './components/CheckoutPage';
import UpgradePage from './components/UpgradePage';
import FAQPage from './components/FAQPage';

// A component to protect routes that require authentication.
const ProtectedRoute: React.FC = () => {
    const { user, isAuthEnabled, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        // You can render a loading spinner here
        return <div>Loading...</div>;
    }

    if (isAuthEnabled && !user) {
        // If auth is on and there's no user, redirect to the login page.
        return <Navigate to="/login" replace />;
    }

    // If user is logged in but hasn't selected a subscription, redirect them.
    if (user && !user.subscriptionTier) {
        // Allow access only to the subscription and checkout pages
        if (location.pathname !== '/subscribe' && !location.pathname.startsWith('/checkout')) {
            return <Navigate to="/subscribe" replace />;
        }
    }

    // If auth is disabled, or if the user is logged in with a subscription, show the content.
    return <Outlet />;
};

// The main layout for the core application with the sidebar
const MainLayout = () => (
  <div className="flex h-screen bg-gray-100 font-sans app-layout">
    <Sidebar />
    <main className="flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
);

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <PropertyProvider>
          <Routes>
            {/* Public routes using the PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected app routes */}
            <Route element={<ProtectedRoute />}>
              {/* Routes WITHOUT the main sidebar layout */}
              <Route path="/subscribe" element={<SubscriptionPage />} />
              <Route path="/checkout/:tier" element={<CheckoutPage />} />
              
              {/* Routes WITH the main sidebar layout */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/add-property" element={<AddProperty />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/compare" element={<ComparisonPage />} />
                <Route path="/upgrade" element={<UpgradePage />} />
                <Route path="/faq" element={<FAQPage />} />
              </Route>
            </Route>
            
            {/* Fallback for any unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </PropertyProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;