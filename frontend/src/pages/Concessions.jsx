import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Concessions = () => {
    const [concessions, setConcessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(null);
    const [revisedAmounts, setRevisedAmounts] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });

    // Mock admin
    const admin = { name: 'Admin', id: 1 };

    useEffect(() => {
        fetchConcessions();
    }, []);

    const fetchConcessions = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/transport-requests/concessions`);
            const data = await response.json();
            setConcessions(data);
        } catch (error) {
            console.error('Error fetching concessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAmountChange = (id, value) => {
        setRevisedAmounts(prev => ({ ...prev, [id]: value }));
    };

    const handleUpdate = async (concession) => {
        const revisedAmount = revisedAmounts[concession.id];
        if (!revisedAmount) return;

        if (Number(revisedAmount) > concession.original_fare) {
            setMessage({ text: 'Revised amount cannot exceed original fare.', type: 'error' });
            return;
        }

        setUpdating(concession.id);
        try {
            const response = await fetch(`${API_BASE}/transport-requests/${concession.id}/concession`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    revised_amount: Number(revisedAmount),
                    admin_name: admin.name,
                    admin_id: admin.id
                })
            });

            if (response.ok) {
                setMessage({ text: `Fee updated successfully for ${concession.student_name}.`, type: 'success' });
                fetchConcessions();
                // Clear the input
                setRevisedAmounts(prev => {
                    const next = { ...prev };
                    delete next[concession.id];
                    return next;
                });
            } else {
                const data = await response.json();
                setMessage({ text: data.message || 'Failed to update fee.', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'An error occurred.', type: 'error' });
        } finally {
            setUpdating(null);
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Concessions Management</h2>
                <p className="text-gray-500 mt-1">Manage transport fee adjustments and concessions for approved requests.</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Route / Stage</th>
                                <th className="p-4">Original Fare</th>
                                <th className="p-4">Current Fee</th>
                                <th className="p-4 w-48">Revised Amount</th>
                                <th className="p-4">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-gray-400">Loading concessions data...</td>
                                </tr>
                            ) : concessions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-gray-400">No approved transport requests found.</td>
                                </tr>
                            ) : (
                                concessions.map(c => (
                                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium">
                                            {c.student_name}
                                            <div className="text-xs text-gray-400">{c.admission_number}</div>
                                        </td>
                                        <td className="p-4">
                                            {c.route_name}
                                            <div className="text-xs text-gray-400">{c.stage_name}</div>
                                        </td>
                                        <td className="p-4 font-medium text-gray-400">₹{c.original_fare}</td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${c.current_fee === c.original_fare ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                                ₹{c.current_fee || '—'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                                                <input
                                                    type="number"
                                                    value={revisedAmounts[c.id] || ''}
                                                    onChange={(e) => handleAmountChange(c.id, e.target.value)}
                                                    placeholder={c.current_fee}
                                                    className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => handleUpdate(c)}
                                                disabled={updating === c.id || !revisedAmounts[c.id]}
                                                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
                                            >
                                                {updating === c.id ? 'Updating...' : 'Update Fee'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Layout>
    );
};

export default Concessions;
