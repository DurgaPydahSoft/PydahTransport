import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const Dashboard = () => {
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
            }
        };

        fetchStats();
    }, []);

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800 break-words">Dashboard Overview</h2>
                <p className="text-gray-500 mt-2">Welcome back! Here's what's happening today.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-gray-500 text-xs font-bold tracking-widest uppercase relative z-10">Total Buses</h3>
                    <p className="text-4xl font-extrabold text-gray-900 mt-3 relative z-10">{stats.buses}</p>
                    <div className="flex items-center mt-4 text-green-600 text-sm font-medium relative z-10">
                        <span className="bg-green-100 px-2 py-1 rounded-full">Active</span>
                        <span className="ml-2 text-gray-400">/ {stats.buses} Total</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-gray-500 text-xs font-bold tracking-widest uppercase relative z-10">Total Routes</h3>
                    <p className="text-4xl font-extrabold text-gray-900 mt-3 relative z-10">{stats.routes}</p>
                    <div className="flex items-center mt-4 text-blue-600 text-sm font-medium relative z-10">
                        <span className="bg-blue-100 px-2 py-1 rounded-full">{stats.totalDistance} km</span>
                        <span className="ml-2 text-gray-400">network coverage</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                    <h3 className="text-gray-500 text-xs font-bold tracking-widest uppercase relative z-10">Daily Passengers</h3>
                    <p className="text-4xl font-extrabold text-gray-900 mt-3 relative z-10">--</p>
                    <div className="flex items-center mt-4 text-purple-600 text-sm font-medium relative z-10">
                        <span className="bg-purple-100 px-2 py-1 rounded-full">Coming Soon</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Recent Alerts</h3>
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
                        <p>No recent alerts available.</p>
                    </div>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-gray-50 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-colors text-left group">
                            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">🚌</span>
                            <span className="font-semibold text-sm">Add Bus</span>
                        </button>
                        <button className="p-4 bg-gray-50 rounded-xl hover:bg-green-50 hover:text-green-600 transition-colors text-left group">
                            <span className="text-2xl mb-2 block group-hover:scale-110 transition-transform">🛣️</span>
                            <span className="font-semibold text-sm">New Route</span>
                        </button>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard;
