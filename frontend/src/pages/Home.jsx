import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>

            <header className="mb-12 text-center relative z-10 px-4">
                <h1 className="text-5xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-6 tracking-tight">
                    Pydah Transport
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                    Streamlining transportation for the next generation of educational excellence.
                </p>
            </header>

            <main className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full px-4 relative z-10">
                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group">
                    <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">🎓</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Student & Staff Portal</h2>
                    <p className="text-gray-500 mb-8 flex-1">
                        Access real-time bus schedules, check route fares, and apply for your transport pass seamlessly.
                    </p>
                    <button className="bg-gray-100 text-gray-400 px-8 py-3 rounded-xl font-medium cursor-not-allowed w-full" disabled>
                        Portal Coming Soon
                    </button>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-100 flex flex-col items-center text-center group">
                    <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform">🛡️</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-3">Administrative Control</h2>
                    <p className="text-gray-500 mb-8 flex-1">
                        Comprehensive management of fleets, routes, stages, and fee approvals for transport managers.
                    </p>
                    <Link to="/login" className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-medium hover:shadow-lg hover:shadow-blue-200 transition-all w-full transform active:scale-95">
                        Admin Login
                    </Link>
                </div>
            </main>

            <footer className="mt-16 text-gray-400 text-sm relative z-10">
                &copy; {new Date().getFullYear()} Pydah Educational Institutions. All rights reserved.
            </footer>
        </div>
    );
};

export default Home;
