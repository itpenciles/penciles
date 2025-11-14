import React from 'react';
import { NavLink } from 'react-router-dom';
import { BuildingOfficeIcon, ArrowRightOnRectangleIcon } from '../constants';
import { SIDEBAR_LINKS } from '../constants';
import { useProperties } from '../hooks/useProperties';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = () => {
  const { properties } = useProperties();
  const { user, logout } = useAuth();

  const propertiesAnalyzed = properties.length;
  const avgCapRate =
    properties.length > 0
      ? properties.reduce((acc, p) => acc + p.calculations.capRate, 0) / properties.length
      : 0;

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-4 border-b border-gray-200">
        <BuildingOfficeIcon className="h-8 w-8 text-brand-blue" />
        <span className="ml-2 text-xl font-bold text-gray-800">It Pencils</span>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-2">
        <span className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Analysis Tools</span>
        {SIDEBAR_LINKS.map((link) => (
          <NavLink
            key={link.name}
            to={link.href}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                isActive
                  ? 'bg-brand-blue-light text-brand-blue'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <link.icon className="h-5 w-5 mr-3" />
            {link.name}
          </NavLink>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-gray-200">
        <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Metrics</h3>
        <div className="mt-2 space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
                <span>Properties Analyzed</span>
                <span>{propertiesAnalyzed}</span>
            </div>
             <div className="flex justify-between">
                <span>Avg. Cap Rate</span>
                <span>{propertiesAnalyzed > 0 ? `${avgCapRate.toFixed(1)}%` : '--%'}</span>
            </div>
        </div>
      </div>
      {user && (
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center">
              <img 
                className="h-8 w-8 rounded-full" 
                src={user.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=e0e7ff&color=4338ca`} 
                alt="User avatar"
                referrerPolicy="no-referrer"
              />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-800">{user.name}</p>
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
    </aside>
  );
};

export default Sidebar;