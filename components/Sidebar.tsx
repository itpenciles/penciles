
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BuildingOfficeIcon, ArrowRightOnRectangleIcon, ChartBarIcon, LockClosedIcon } from '../constants';
import { SIDEBAR_LINKS } from '../constants';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { properties } = useProperties();
  const { user, logout, analysisStatus } = useAuth();
  const navigate = useNavigate();

  // Properties Analyzed counts the list.
  const propertiesAnalyzed = properties.length;

  const avgCapRate =
    properties.length > 0
      ? properties.reduce((acc, p) => acc + p.calculations.capRate, 0) / properties.length
      : 0;

  const renderAnalysisUsage = () => {
    if (!user || !analysisStatus) return null;

    // Handle Pay As You Go UI
    if (user.subscriptionTier === 'PayAsYouGo') {
      const credits = user.credits || 0;
      const costPerAnalysis = 7;
      const percentage = Math.min(100, (credits / 35) * 100);

      return (
        <div className="mt-2">
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="font-medium text-gray-600">Credits</span>
            <span className={`font-bold ${credits < costPerAnalysis ? 'text-red-600' : 'text-green-600'}`}>
              ${credits.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden" title={`$${credits.toFixed(2)} Available`}>
            <div
              className={`h-1.5 rounded-full ${credits < costPerAnalysis ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <p className="text-[10px] text-gray-500">Cost: ${costPerAnalysis} / report</p>
            {credits < costPerAnalysis && <span className="text-[10px] text-red-500 font-bold">Low Balance</span>}
          </div>

          <button
            onClick={() => navigate('/upgrade')}
            className="w-full mt-2 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700 transition-colors shadow-sm"
          >
            Top Up Balance
          </button>
        </div>
      );
    }

    // --- DYNAMIC USAGE CALCULATION ---
    // We now prefer the backend count (analysisStatus.count) as the source of truth because it includes
    // deleted properties which still count towards the limit.
    // The frontend 'properties' list only contains active properties.
    const { limit, count } = analysisStatus;
    const usedCount = count;



    if (limit === 'Unlimited') {
      return <p className="text-xs font-semibold text-green-600 mt-1">Unlimited Analyses</p>;
    }

    // Calculate remaining based on visual list
    const remaining = typeof limit === 'number' ? Math.max(0, limit - usedCount) : 0;
    const percentage = limit > 0 ? (usedCount / limit) * 100 : 0;

    return (
      <div className="mt-2">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="font-medium text-gray-600">Analyses Left</span>
          <span className={`font-bold ${remaining === 0 ? 'text-red-600' : 'text-gray-800'}`}>
            {remaining} <span className="text-gray-400 font-normal">/ {limit}</span>
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full ${remaining === 0 ? 'bg-red-500' : 'bg-brand-blue'}`}
            style={{ width: `${Math.min(100, percentage)}%` }}
          ></div>
        </div>
        {user.subscriptionTier === 'Free' && <p className="text-[10px] text-gray-500 mt-1 text-center">Lifetime Limit</p>}
        {user.subscriptionTier !== 'Free' && analysisStatus.renewsOn && (
          <p className="text-[10px] text-gray-400 mt-1 text-right">Resets {analysisStatus.renewsOn}</p>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-800 bg-opacity-50 z-20 md:hidden"
          onClick={onClose}
        ></div>
      )}

      <aside className={`
        fixed md:relative z-30 h-full w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col no-print transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-brand-blue" />
            <span className="ml-2 text-xl font-bold text-gray-800">It Pencils</span>
          </div>
          {/* Mobile Close Button */}
          <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {user?.subscriptionTier && (
            <div className="px-4 py-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">Current Plan</span>
                  <h3 className="text-sm font-bold text-gray-900">{user.subscriptionTier === 'PayAsYouGo' ? 'Pay As You Go' : user.subscriptionTier}</h3>
                </div>
                {user.subscriptionTier !== 'Team' && user.subscriptionTier !== 'PayAsYouGo' && (
                  <button
                    onClick={() => { navigate('/upgrade'); onClose(); }}
                    className="text-xs bg-white border border-brand-blue text-brand-blue px-2 py-1 rounded hover:bg-brand-blue hover:text-white transition-colors"
                  >
                    Upgrade
                  </button>
                )}
              </div>
              {renderAnalysisUsage()}
            </div>
          )}

          <nav className="px-2 py-4 space-y-2">
            <span className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analysis Tools</span>
            {SIDEBAR_LINKS.map((link) => (
              <NavLink
                key={link.name}
                to={link.href}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${isActive
                    ? 'bg-brand-blue-light text-brand-blue'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <link.icon className="h-5 w-5 mr-3" />
                {link.name}
              </NavLink>
            ))}

            {user?.role === 'admin' && (
              <div className="pt-4 border-t border-gray-200 mt-4">
                <span className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</span>
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 mt-2 text-sm font-medium rounded-md transition-colors duration-150 ${isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <ChartBarIcon className="h-5 w-5 mr-3" />
                  Admin Dashboard
                </NavLink>
                <NavLink
                  to="/admin/setup"
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center px-4 py-2 mt-2 text-sm font-medium rounded-md transition-colors duration-150 ${isActive
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`
                  }
                >
                  <LockClosedIcon className="h-5 w-5 mr-3" />
                  Setup
                </NavLink>
              </div>
            )}

          </nav>
          <div className="px-4 py-4 border-t border-gray-200">
            <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Metrics</h3>
            <div className="mt-2 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between px-2">
                <span>Properties Analyzed</span>
                <span className="font-semibold">{propertiesAnalyzed}</span>
              </div>
              <div className="flex justify-between px-2">
                <span>Avg. Cap Rate</span>
                <span className="font-semibold">{propertiesAnalyzed > 0 ? `${avgCapRate.toFixed(1)}%` : '--%'}</span>
              </div>
            </div>
          </div>
          {user && (
            <div className="px-4 py-4 border-t border-gray-200 pb-20 md:pb-4"> {/* Added extra padding for mobile bottom nav clearance if needed */}
              <div className="flex items-center">
                <img
                  className="h-8 w-8 rounded-full"
                  src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e0e7ff&color=4338ca`}
                  alt="User avatar"
                  referrerPolicy="no-referrer"
                />
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-gray-800 truncate">{user.name}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
