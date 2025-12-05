import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, ListBulletIcon, PlusIcon, UserCircleIcon } from '../constants';

const BottomNav = () => {
    const navItems = [
        { name: 'Home', href: '/dashboard', icon: HomeIcon },
        { name: 'Properties', href: '/properties', icon: ListBulletIcon }, // We might need to create this route or map it to something
        { name: 'Add', href: '/add-property', icon: PlusIcon },
        { name: 'Profile', href: '/upgrade', icon: UserCircleIcon }, // Using Upgrade/Profile as placeholder
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe md:hidden z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                            `flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'
                            }`
                        }
                    >
                        <item.icon className="h-6 w-6" />
                        <span className="text-[10px] font-medium">{item.name}</span>
                    </NavLink>
                ))}
            </div>
        </div>
    );
};

export default BottomNav;
