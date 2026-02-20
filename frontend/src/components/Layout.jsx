import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Bus,
    Users,
    Map,
    ClipboardList,
    CreditCard,
    UserCog,
    LogOut,
    Menu,
    X
} from 'lucide-react';

const Layout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('adminInfo');
        navigate('/login');
    };

    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');

    // Helper to check permissions
    const hasPermission = (requiredPerm) => {
        if (!requiredPerm) return true; // Public/Always visible
        if (adminInfo.role === 'admin') return true; // Legacy Superadmin sees all
        if (adminInfo.permissions && adminInfo.permissions.includes(requiredPerm)) return true;
        return false;
    };

    // Define Items with Permissions
    const allMenuItems = [
        { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, permission: 'dashboard' },
        { path: '/buses', label: 'Bus Management', permission: 'bus_management', icon: <Bus size={20} /> },
        { path: '/fleet', label: 'Fleet & Passengers', permission: 'fleet_passengers', icon: <Users size={20} /> },
        { path: '/routes', label: 'Route Management', permission: 'route_management', icon: <Map size={20} /> },
        { path: '/transport-requests', label: 'Requests', permission: 'transport_requests', icon: <ClipboardList size={20} /> },
        { path: '/transport-dues', label: 'Transport Dues', permission: 'transport_dues', icon: <CreditCard size={20} /> },
        { path: '/users', label: 'User Management', permission: 'user_management', icon: <UserCog size={20} /> },
    ];

    const menuItems = allMenuItems.filter(item => hasPermission(item.permission));

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            {/* Sidebar (Desktop) */}
            <aside className="w-72 bg-white shadow-xl hidden md:flex flex-col z-20">
                <div className="h-20 flex items-center justify-center border-b border-gray-100 px-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/Gemini_Generated_Image_uu0hhduu0hhduu0h.png"
                            alt="Logo"
                            className="h-15 w-auto object-contain"
                        />
                        <h1 className="text-l font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-indigo-900 truncate tracking-wide">
                            PYDAH TRANSPORT
                        </h1>
                    </div>
                </div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${location.pathname === item.path
                                ? 'bg-slate-900 text-white shadow-md font-semibold'
                                : 'text-slate-900 hover:bg-slate-100 hover:text-black font-medium'
                                }`}
                        >
                            <span className={`mr-3 transition-colors ${location.pathname === item.path ? 'text-white' : 'text-slate-900 group-hover:text-black'
                                }`}>
                                {item.icon}
                            </span>
                            <span className="truncate text-sm">{item.label}</span>

                            {location.pathname === item.path && (
                                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-l-md"></span>
                            )}
                        </Link>
                    ))}
                </nav>
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-2 mb-2 bg-slate-50 rounded-lg border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            {(adminInfo.name || adminInfo.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">
                                {adminInfo.name || adminInfo.username || 'User'}
                            </p>
                            <p className="text-[10px] uppercase font-bold text-gray-500 truncate">
                                {adminInfo.role || 'Guest'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium group"
                    >
                        <span className="mr-3 text-red-500 group-hover:text-red-700"><LogOut size={18} /></span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
            )}

            {/* Sidebar (Mobile) */}
            <aside className={`fixed inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col z-40 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                <div className="h-16 flex justify-between items-center border-b border-gray-100 px-6">
                    <h1 className="text-lg font-bold text-blue-900 truncate">Pydah Transport</h1>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                                ? 'bg-slate-900 text-white font-medium'
                                : 'text-slate-900 hover:bg-slate-100'
                                }`}
                        >
                            <span className="mr-3">{item.icon}</span>
                            <span className="truncate text-sm">{item.label}</span>
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-slate-200 w-full">
                {/* Mobile Header */}
                <header className="md:hidden bg-white shadow-sm h-16 flex items-center justify-between px-4 z-20">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 rounded-lg hover:bg-gray-100">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-lg font-bold text-gray-800 truncate">Pydah Transport</h1>
                    <div className="w-10"></div> {/* Spacer for center alignment */}
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 scroll-smooth w-full">
                    {/* Removed max-w-7xl to allow full width as requested via "fit to screen" interpretation, 
                        or user can re-add container class if "fit to under screen" meant centered. 
                        Assuming full width fluid layout is desired for "professional" dashboard. */}
                    <div className="w-full max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
