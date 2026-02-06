import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const API = import.meta.env.VITE_API_URL || '';

const Fleet = () => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [allocatingId, setAllocatingId] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchOverview = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API}/buses/overview`);
            if (response.ok) {
                const data = await response.json();
                setList(Array.isArray(data) ? data : []);
            } else {
                setList([]);
            }
        } catch (e) {
            setList([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOverview();
    }, []);

    const handleAutoAllocate = async (busId) => {
        setAllocatingId(busId);
        setMessage({ text: '', type: '' });
        try {
            const response = await fetch(`${API}/buses/${busId}/auto-allocate`, { method: 'POST' });
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                setMessage({ text: data.message || 'Allocation done.', type: 'success' });
                fetchOverview();
            } else {
                setMessage({ text: data.message || 'Allocation failed', type: 'error' });
            }
        } catch (e) {
            setMessage({ text: 'Something went wrong.', type: 'error' });
        } finally {
            setAllocatingId(null);
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Fleet & Passengers</h2>
                <p className="text-gray-500 mt-1">Allocate students from transport requests to buses by route. Capacity is filled automatically.</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading fleet…</div>
            ) : list.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                    <p className="text-gray-500">No buses in the fleet. Add buses and assign routes in Bus Management.</p>
                    <Link to="/buses" className="mt-4 inline-block text-blue-600 hover:underline font-medium">Go to Bus Management →</Link>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-4">Bus</th>
                                    <th className="p-4">Route</th>
                                    <th className="p-4">Seats filled</th>
                                    <th className="p-4">Capacity</th>
                                    <th className="p-4">Occupancy</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {list.map((item) => (
                                    <tr key={item.bus._id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <span className="font-bold text-gray-800">{item.bus.busNumber}</span>
                                            <span className="text-gray-500 text-sm ml-1">({item.bus.type})</span>
                                        </td>
                                        <td className="p-4">
                                            {item.route ? (
                                                <span>{item.route.routeName} <span className="text-gray-400">({item.route.routeId})</span></span>
                                            ) : (
                                                <span className="text-gray-400">— Not assigned</span>
                                            )}
                                        </td>
                                        <td className="p-4 font-medium">{item.seatsFilled}</td>
                                        <td className="p-4">{item.capacity}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full ${
                                                            item.occupancyPercent >= 100 ? 'bg-red-500' : item.occupancyPercent >= 80 ? 'bg-amber-500' : 'bg-green-500'
                                                        }`}
                                                        style={{ width: `${Math.min(100, item.occupancyPercent)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{item.occupancyPercent}%</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {item.bus.assignedRouteId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAutoAllocate(item.bus._id)}
                                                        disabled={allocatingId !== null || item.seatsFilled >= item.capacity}
                                                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {allocatingId === item.bus._id ? '…' : item.seatsFilled >= item.capacity ? 'Full' : 'Auto-fill'}
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/buses/${item.bus._id}`}
                                                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-50"
                                                >
                                                    View details
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Fleet;
