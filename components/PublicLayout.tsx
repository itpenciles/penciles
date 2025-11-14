import React from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { BuildingOfficeIcon, TwitterIcon, LinkedInIcon } from '../constants';

const HeaderAuthButton: React.FC = () => {
    return (
        <Link to="/login" className="bg-brand-blue text-white px-5 py-2 rounded-lg font-semibold text-sm shadow-md hover:bg-blue-700 transition">
            Login / Register
        </Link>
    );
};

const Header: React.FC = () => {
    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                <Link to="/" className="flex items-center">
                    <BuildingOfficeIcon className="h-8 w-8 text-brand-blue" />
                    <span className="ml-2 text-xl font-bold text-gray-800">It Pencils</span>
                </Link>
                <nav className="hidden md:flex items-center space-x-8">
                    <NavLink to="/features" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-brand-blue' : 'hover:text-brand-blue'}`}>Features</NavLink>
                    <NavLink to="/pricing" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-brand-blue' : 'hover:text-brand-blue'}`}>Pricing</NavLink>
                    <NavLink to="/about" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-brand-blue' : 'hover:text-brand-blue'}`}>About</NavLink>
                    <NavLink to="/contact" className={({isActive}) => `text-sm font-medium ${isActive ? 'text-brand-blue' : 'hover:text-brand-blue'}`}>Contact</NavLink>
                </nav>
                <div className="hidden md:inline-block">
                    <HeaderAuthButton />
                </div>
            </div>
        </header>
    );
}

const Footer: React.FC = () => (
    <footer className="bg-brand-gray-900 text-brand-gray-400">
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
                 <Link to="/" className="flex items-center">
                    <BuildingOfficeIcon className="h-7 w-7 text-white" />
                    <span className="ml-2 text-lg font-bold text-white">It Pencils</span>
                </Link>
                <div className="flex mt-4 md:mt-0 space-x-6">
                    <Link to="/about" className="hover:text-white">About</Link>
                    <Link to="/features" className="hover:text-white">Features</Link>
                    <Link to="/pricing" className="hover:text-white">Pricing</Link>
                    <Link to="/contact" className="hover:text-white">Contact</Link>
                </div>
                <div className="flex mt-4 md:mt-0 space-x-4">
                    <a href="#" className="hover:text-white"><TwitterIcon className="h-6 w-6" /></a>
                    <a href="#" className="hover:text-white"><LinkedInIcon className="h-6 w-6" /></a>
                </div>
            </div>
            <div className="mt-8 pt-8 border-t border-brand-gray-700 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} It Pencils. All rights reserved.</p>
                <p className="mt-2 text-xs">Disclaimer: It Pencils is a tool for educational and informational purposes. Results may vary based on inputs and market conditions. Always perform your own due diligence.</p>
            </div>
        </div>
    </footer>
);

const PublicLayout: React.FC = () => {
    const { pathname } = useLocation();

    // Scroll to top on page change
    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="bg-white text-brand-gray-700">
            <Header />
            <main>
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;