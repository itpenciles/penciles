
import React from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import { PropertyProvider } from './contexts/PropertyContext';
import { Bars3Icon } from './constants';
import { Logo } from './components/common/Logo';

// Layouts
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import PublicLayout from './components/PublicLayout';

// Public Pages
import LandingPage from './components/LandingPage';
import AboutPage from './components/AboutPage';
import FeaturesPage from './components/FeaturesPage';
import PricingPage from './components/PricingPage';
import ContactPage from './components/ContactPage';
import LoginPage from './components/LoginPage';
import PublicPropertyPage from './components/PublicPropertyPage';

// App Pages
import Dashboard from './components/Dashboard';
import AddProperty from './components/AddProperty';
import PropertyDetail from './components/PropertyDetail';
import ComparisonPage from './components/ComparisonPage';
import SubscriptionPage from './components/SubscriptionPage';
import CheckoutPage from './components/CheckoutPage';
import UpgradePage from './components/UpgradePage';
import FAQPage from './components/FAQPage';
import AdminDashboard from './components/AdminDashboard';
import AdminSetup from './components/AdminSetup';
import UserProfile from './components/UserProfile';

import MobilePropertiesList from './components/MobilePropertiesList';
import { useMobile } from './hooks/useMobile';

const PropertiesRoute = () => {
  const isMobile = useMobile();
  return isMobile ? <MobilePropertiesList /> : <Navigate to="/dashboard" replace />;
};

// A component to protect routes that require authentication.
const ProtectedRoute: React.FC<{ adminOnly?: boolean }> = ({ adminOnly = false }) => {
  const { user, isAuthEnabled, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isAuthEnabled && !user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // If user is logged in but hasn't selected a subscription, redirect them.
  if (user && !user.subscriptionTier && !adminOnly) {
    // Allow access only to the subscription and checkout pages
    if (location.pathname !== '/subscribe' && !location.pathname.startsWith('/checkout')) {
      return <Navigate to="/subscribe" replace />;
    }
  }

  return <Outlet />;
};

// The main layout for the core application with the sidebar
const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex h-screen bg-gray-100 font-sans app-layout">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header - Teal Design */}
        <header className="md:hidden bg-gray-800 text-white p-4 flex items-center justify-between flex-shrink-0 shadow-md z-10">
          <Logo variant="outline-white" size="lg" />
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-white hover:text-teal-100 ml-3 focus:outline-none"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          {/* Optional: Add profile or notification icon here if needed */}
        </header>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

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
            <Route path="/share/:token" element={<PublicPropertyPage />} />

            {/* Protected app routes */}
            <Route element={<ProtectedRoute />}>
              {/* Routes WITHOUT the main sidebar layout */}
              <Route path="/subscribe" element={<SubscriptionPage />} />
              <Route path="/checkout/:tier" element={<CheckoutPage />} />

              {/* Routes WITH the main sidebar layout */}
              <Route element={<MainLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/properties" element={<PropertiesRoute />} />
                <Route path="/add-property" element={<AddProperty />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/compare" element={<ComparisonPage />} />
                <Route path="/upgrade" element={<UpgradePage />} />
                <Route path="/profile" element={<UserProfile />} />
                <Route path="/faq" element={<FAQPage />} />
              </Route>
            </Route>

            {/* Admin Route */}
            <Route element={<ProtectedRoute adminOnly={true} />}>
              <Route element={<MainLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/setup" element={<AdminSetup />} />
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
