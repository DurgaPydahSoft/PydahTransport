import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden font-inter">
            {/* Background Image */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1570125909232-eb263c188f7e?q=80&w=2071&auto=format&fit=crop"
                    alt="Bus Background"
                    className="w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/20 to-slate-900/90"></div>
            </div>

            {/* Main Content Container - Centered Vertically */}
            <div className="flex-grow flex flex-col items-center justify-center w-full relative z-10 px-4 py-8">
                <header className="mb-8 text-center max-w-3xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
                        Pydah Transport
                    </h1>
                    <p className="text-lg text-slate-200 leading-relaxed font-light drop-shadow-md">
                        Streamlining transportation for the next generation of educational excellence.
                    </p>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                    {/* Student Portal Card */}
                    <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 border border-white/20 flex flex-col items-center text-center group hover:-translate-y-1">
                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors shadow-inner">
                            <div className="text-2xl transform group-hover:scale-110 transition-transform duration-300">🚌</div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Student & Staff Portal</h2>
                        <p className="text-slate-600 mb-6 flex-1 text-sm">
                            Access real-time bus schedules, check route fares, and apply for your transport pass seamlessly.
                        </p>
                        <button className="bg-slate-100 text-slate-400 px-6 py-2.5 rounded-lg font-medium cursor-not-allowed w-full text-sm border border-slate-200" disabled>
                            Portal Coming Soon
                        </button>
                    </div>

                    {/* Admin Portal Card */}
                    <div className="bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 border border-white/20 flex flex-col items-center text-center group hover:-translate-y-1">
                        <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-200 transition-colors shadow-inner">
                            <div className="text-2xl transform group-hover:scale-110 transition-transform duration-300">🗺️</div>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Administrative Control</h2>
                        <p className="text-slate-600 mb-6 flex-1 text-sm">
                            Comprehensive management of fleets, routes, stages, and fee approvals for transport managers.
                        </p>
                        <Link to="/login" className="inline-block bg-slate-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-slate-800 hover:shadow-lg hover:shadow-slate-900/30 transition-all w-full transform active:scale-95 text-sm">
                            Admin Login
                        </Link>
                    </div>
                </main>
            </div>

            <footer className="py-6 text-slate-400 text-xs relative z-10 font-medium text-center">
                &copy; {new Date().getFullYear()} Pydah Educational Institutions. All rights reserved.
            </footer>
        </div>
    );
};

export default Home;
