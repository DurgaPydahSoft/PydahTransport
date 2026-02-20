import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import {
    Bus,
    Map,
    Users,
    Bell,
    Zap
} from 'lucide-react';

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        buses: 0,
        routes: 0,
        totalDistance: 0
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [busRes, routeRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_API_URL}/buses`),
                    fetch(`${import.meta.env.VITE_API_URL}/routes`)
                ]);

                const buses = await busRes.json();
                const routes = await routeRes.json();

                const totalDist = routes.reduce((acc, curr) => acc + (curr.totalDistance || 0), 0);

                setStats({
                    buses: buses.length,
                    routes: routes.length,
                    totalDistance: totalDist
                });
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-blue-900 break-words tracking-tight">Dashboard Overview</h2>
                <p className="text-slate-700 mt-2 font-medium">Welcome back! Here's what's happening today.</p>
            </div>

            {loading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                    <Loader size={48} text="Loading dashboard analytics..." />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {/* Total Buses Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                                        <Bus size={28} />
                                    </div>
                                    <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Active</span>
                                </div>
                                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Total Buses</h3>
                                <p className="text-4xl font-extrabold text-slate-900">{stats.buses}</p>
                                <p className="text-emerald-600 text-sm font-medium mt-2 flex items-center">
                                    <span className="mr-1">●</span>
                                    Fleet Operational
                                </p>
                            </div>
                        </div>

                        {/* Total Routes Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                        <Map size={28} />
                                    </div>
                                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Network</span>
                                </div>
                                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Total Routes</h3>
                                <p className="text-4xl font-extrabold text-slate-900">{stats.routes}</p>
                                <p className="text-blue-600 text-sm font-medium mt-2 flex items-center">
                                    <span className="font-bold mr-1">{stats.totalDistance} km</span> coverage
                                </p>
                            </div>
                        </div>

                        {/* Daily Passengers Card */}
                        <div className="bg-white p-6 rounded-2xl shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-125"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                                        <Users size={28} />
                                    </div>
                                    <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">Daily</span>
                                </div>
                                <h3 className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-1">Passengers</h3>
                                <p className="text-4xl font-extrabold text-slate-900">--</p>
                                <p className="text-purple-600 text-sm font-medium mt-2">
                                    Analytics coming soon
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Alerts Section */}
                        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 hover:shadow-lg transition-shadow">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center">
                                <span className="bg-red-100 text-red-600 p-2 rounded-lg mr-3">
                                    <Bell size={24} />
                                </span>
                                Recent Alerts
                            </h3>
                            <div className="flex flex-col items-center justify-center h-48 text-slate-400 bg-slate-50/50 rounded-xl border-dashed border-2 border-slate-200">
                                <p className="font-medium">No recent alerts available.</p>
                            </div>
                        </div>

                        {/* Quick Actions Section */}
                        <div className="bg-white rounded-2xl shadow-md border border-slate-100 p-8 hover:shadow-lg transition-shadow">
                            <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-100 pb-4 flex items-center">
                                <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg mr-3">
                                    <Zap size={24} />
                                </span>
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button className="p-6 bg-slate-50 rounded-xl hover:bg-emerald-50 hover:text-emerald-700 transition-all text-left group border border-slate-100 hover:border-emerald-200 hover:shadow-md">
                                    <span className="mb-3 block group-hover:scale-110 transition-transform text-emerald-600">
                                        <Bus size={32} />
                                    </span>
                                    <span className="font-bold text-slate-700 group-hover:text-emerald-700 block text-lg">Add Bus</span>
                                    <span className="text-xs text-slate-500 group-hover:text-emerald-600">Register new vehicle</span>
                                </button>
                                <button className="p-6 bg-slate-50 rounded-xl hover:bg-blue-50 hover:text-blue-700 transition-all text-left group border border-slate-100 hover:border-blue-200 hover:shadow-md">
                                    <span className="mb-3 block group-hover:scale-110 transition-transform text-blue-600">
                                        <Map size={32} />
                                    </span>
                                    <span className="font-bold text-slate-700 group-hover:text-blue-700 block text-lg">New Route</span>
                                    <span className="text-xs text-slate-500 group-hover:text-blue-600">Create transport path</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Layout>
    );
};

export default Dashboard;
