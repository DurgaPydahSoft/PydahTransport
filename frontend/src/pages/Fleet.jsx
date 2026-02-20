import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Loader from '../components/Loader';
import {
    Bus,
    MapPin,
    Users,
    Activity,
    AlertCircle,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

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
                <h2 className="text-3xl font-extrabold text-blue-900 break-words tracking-tight">Fleet & Passengers</h2>
                <p className="text-slate-700 mt-2 font-medium">Manage transport requests and bus capacity.</p>
            </div>

            {message.text && (
                <div className={`mb-4 p-3 rounded-lg border flex items-center text-sm ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={16} className="mr-2" /> : <AlertCircle size={16} className="mr-2" />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            {loading ? (
                <div className="min-h-[300px] flex items-center justify-center">
                    <Loader size={32} text="Loading fleet overview..." />
                </div>
            ) : list.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center flex flex-col items-center">
                    <div className="bg-slate-50 p-4 rounded-full mb-4">
                        <Bus size={32} className="text-slate-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">No Buses Found</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
                        No buses in the fleet. Add buses and assign routes in Bus Management.
                    </p>
                    <Link to="/buses" className="inline-flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700 transition-all">
                        Go to Bus Management
                        <ArrowRight size={16} className="ml-2" />
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase text-slate-500 font-bold tracking-wider">
                                    <th className="px-4 py-2.5">Bus Details</th>
                                    <th className="px-4 py-2.5">Route</th>
                                    <th className="px-4 py-2.5">Seats Filled</th>
                                    <th className="px-4 py-2.5">Capacity</th>
                                    <th className="px-4 py-2.5">Occupancy</th>
                                    <th className="px-4 py-2.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {list.map((item) => (
                                    <tr key={item.bus._id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center">
                                                <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600 mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                                    <Bus size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm">{item.bus.busNumber}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{item.bus.type}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">
                                            {item.route ? (
                                                <div className="flex items-center text-slate-700">
                                                    <MapPin size={14} className="text-slate-400 mr-2" />
                                                    <span className="font-medium text-sm">{item.route.routeName}</span>
                                                    <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded border border-slate-200 font-mono">
                                                        {item.route.routeId}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 italic text-xs flex items-center">
                                                    <AlertCircle size={12} className="mr-1.5" />
                                                    Not assigned
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center font-bold text-slate-700 text-sm">
                                                <Users size={14} className="text-slate-400 mr-2" />
                                                {item.seatsFilled}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 font-medium text-sm">{item.capacity}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex flex-col gap-1 w-24">
                                                <div className="flex justify-between items-end">
                                                    <span className={`text-[10px] font-bold ${item.occupancyPercent >= 100 ? 'text-red-600' :
                                                        item.occupancyPercent >= 80 ? 'text-amber-600' : 'text-emerald-600'
                                                        }`}>
                                                        {item.occupancyPercent}%
                                                    </span>
                                                </div>
                                                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${item.occupancyPercent >= 100 ? 'bg-red-500' :
                                                            item.occupancyPercent >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${Math.min(100, item.occupancyPercent)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {item.bus.assignedRouteId && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAutoAllocate(item.bus._id)}
                                                        disabled={allocatingId !== null || item.seatsFilled >= item.capacity}
                                                        className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all active:scale-95 flex items-center"
                                                    >
                                                        {allocatingId === item.bus._id ? (
                                                            <>
                                                                <Loader size={10} className="mr-1 text-white" />
                                                                Running...
                                                            </>
                                                        ) : item.seatsFilled >= item.capacity ? (
                                                            'Full'
                                                        ) : (
                                                            <>
                                                                <Activity size={10} className="mr-1" />
                                                                Auto-fill
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                                <Link
                                                    to={`/buses/${item.bus._id}`}
                                                    className="px-2 py-1 rounded border border-slate-200 text-slate-600 text-[10px] font-semibold hover:bg-slate-50 hover:text-slate-900 transition-colors"
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
