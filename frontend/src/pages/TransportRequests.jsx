import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const API_BASE = import.meta.env.VITE_API_URL || '';

const statusDisplay = (s) => (s || 'pending').charAt(0).toUpperCase() + (s || 'pending').slice(1);

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const TransportRequests = () => {
    const [requests, setRequests] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [routeFilter, setRouteFilter] = useState('');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [approveModal, setApproveModal] = useState({ open: false, requestId: null, data: null, loading: true, error: null });

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const url = routeFilter
                ? `${API_BASE}/transport-requests?route_id=${encodeURIComponent(routeFilter)}`
                : `${API_BASE}/transport-requests`;
            const response = await fetch(url);
            if (response.ok) {
                const data = await response.json();
                setRequests(data);
            } else {
                console.error('Failed to fetch requests');
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoutes = async () => {
        try {
            const response = await fetch(`${API_BASE}/routes`);
            if (response.ok) {
                const data = await response.json();
                setRoutes(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error('Error fetching routes:', e);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [routeFilter]);

    const openApproveModal = async (requestId) => {
        setApproveModal({ open: true, requestId, data: null, loading: true, error: null });
        try {
            const response = await fetch(`${API_BASE}/transport-requests/${requestId}/semester-options`);
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                setApproveModal((m) => ({ ...m, data, loading: false, error: null }));
            } else {
                setApproveModal((m) => ({ ...m, loading: false, error: data.message || 'Failed to load semester options' }));
            }
        } catch (err) {
            setApproveModal((m) => ({ ...m, loading: false, error: 'Could not load semester options' }));
        }
    };

    const closeApproveModal = () => {
        setApproveModal({ open: false, requestId: null, data: null, loading: true, error: null });
    };

    const handleConfirmApprove = async () => {
        const id = approveModal.requestId;
        if (!id) return;
        setActionLoading(id);
        setMessage({ text: '', type: '' });
        try {
            const response = await fetch(`${API_BASE}/transport-requests/${id}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                setMessage({ text: data.message || 'Request approved. Transport fee created in Fee Management.', type: 'success' });
                closeApproveModal();
                fetchRequests();
            } else {
                setMessage({ text: data.message || 'Failed to approve', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'Something went wrong. Please try again.', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const handleApprove = (id) => {
        openApproveModal(id);
    };

    const handleReject = async (id) => {
        setActionLoading(id);
        setMessage({ text: '', type: '' });
        try {
            const response = await fetch(`${API_BASE}/transport-requests/${id}/reject`, {
                method: 'PATCH',
            });
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                setMessage({ text: data.message || 'Request rejected.', type: 'success' });
                fetchRequests();
            } else {
                setMessage({ text: data.message || 'Failed to reject', type: 'error' });
            }
        } catch (err) {
            setMessage({ text: 'Something went wrong. Please try again.', type: 'error' });
        } finally {
            setActionLoading(null);
        }
    };

    const isPending = (req) => (req.status || '').toLowerCase() === 'pending';

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Transport Requests</h2>
                <p className="text-gray-500 mt-1">View, approve, or reject student transport requests. Approval creates the transport fee (TRN01) in Fee Management.</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mb-6">
                <label className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Filter by route</span>
                    <select
                        value={routeFilter}
                        onChange={(e) => setRouteFilter(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm min-w-[200px]"
                    >
                        <option value="">All routes</option>
                        {routes.map((r) => (
                            <option key={r._id} value={r.routeId}>{r.routeName} ({r.routeId})</option>
                        ))}
                    </select>
                </label>
                {routeFilter && (
                    <span className="text-sm text-gray-500">
                        Showing requests for selected route
                    </span>
                )}
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <p className="text-gray-500">No transport requests found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-4">Admission No</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Route</th>
                                    <th className="p-4">Stage</th>
                                    <th className="p-4">Fare</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-blue-600">{req.admission_number}</td>
                                        <td className="p-4">{req.student_name}</td>
                                        <td className="p-4">{req.route_name}</td>
                                        <td className="p-4">{req.stage_name}</td>
                                        <td className="p-4 font-medium text-gray-900">₹{req.fare}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${(req.status || '').toLowerCase() === 'approved' ? 'bg-green-100 text-green-700' :
                                                (req.status || '').toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {statusDisplay(req.status)}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {new Date(req.request_date).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            {isPending(req) ? (
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleApprove(req.id)}
                                                        disabled={actionLoading !== null}
                                                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleReject(req.id)}
                                                        disabled={actionLoading !== null}
                                                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {actionLoading === req.id ? '...' : 'Reject'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 text-xs">—</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={approveModal.open}
                onClose={closeApproveModal}
                title="Approve transport request"
            >
                {approveModal.loading && (
                    <p className="text-gray-500 py-4">Loading…</p>
                )}
                {approveModal.error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-4">
                        {approveModal.error}
                    </div>
                )}
                {!approveModal.loading && approveModal.data && (
                    <>
                        <div className="mb-4 p-3 bg-gray-50 rounded-xl text-sm">
                            <p><span className="font-medium text-gray-600">Student:</span> {approveModal.data.studentName}</p>
                            <p><span className="font-medium text-gray-600">Admission No:</span> {approveModal.data.admissionNumber}</p>
                            <p><span className="font-medium text-gray-600">Course / Year:</span> {approveModal.data.course} – Year {approveModal.data.yearOfStudy}</p>
                        </div>
                        {approveModal.data.route_name && (
                            <div className="mb-4 p-4 rounded-xl border border-blue-100 bg-blue-50">
                                <p className="text-sm font-semibold text-blue-900 mb-2">Route: {approveModal.data.route_name} {approveModal.data.route_id && <span className="text-blue-600">({approveModal.data.route_id})</span>}</p>
                                {approveModal.data.busesOnRoute && approveModal.data.busesOnRoute.length > 0 ? (
                                    <>
                                        <p className="text-xs text-blue-800 mb-2">Buses on this route (capacity):</p>
                                        <ul className="space-y-1.5">
                                            {approveModal.data.busesOnRoute.map((b) => (
                                                <li key={b.busNumber} className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">{b.busNumber}</span>
                                                    <span className="text-blue-700">Filled: {b.seatsFilled} / {b.capacity} · {b.seatsAvailable} available</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </>
                                ) : (
                                    <p className="text-sm text-blue-700">No buses assigned to this route yet. Assign in Bus Management → Bus–Route mapping.</p>
                                )}
                            </div>
                        )}
                        <p className="text-sm text-gray-700 mb-2">Transport is valid until the <strong>end of the academic year</strong> (last semester), regardless of which sem the student applied in.</p>
                        {approveModal.data.expiry ? (
                            <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
                                <p className="font-semibold">Expiry date: {formatDate(approveModal.data.expiry.expiry_date)}</p>
                                <p className="text-sm mt-1">{approveModal.data.expiry.label}</p>
                            </div>
                        ) : (
                            <p className="text-gray-500 py-2">No semester config found for this course/year. Approval will still succeed; expiry will not be set.</p>
                        )}
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={handleConfirmApprove}
                                disabled={actionLoading !== null}
                                className="flex-1 bg-green-600 text-white font-semibold py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading === approveModal.requestId ? 'Approving…' : 'Confirm & Approve'}
                            </button>
                            <button
                                type="button"
                                onClick={closeApproveModal}
                                className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </>
                )}
            </Modal>
        </Layout>
    );
};

export default TransportRequests;
