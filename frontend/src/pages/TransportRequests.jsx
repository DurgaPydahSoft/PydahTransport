import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CreditCard, Trash2, Check, X } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import BusPassCard from '../components/BusPassCard';

const API_BASE = import.meta.env.VITE_API_URL || '';

const statusDisplay = (s) => (s || 'pending').charAt(0).toUpperCase() + (s || 'pending').slice(1);

const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '—');

const TransportRequests = () => {
    const [requests, setRequests] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [courses, setCourses] = useState([]);
    const [routeFilter, setRouteFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [approveModal, setApproveModal] = useState({ open: false, requestId: null, data: null, loading: true, error: null });
    const [selectedPassPassenger, setSelectedPassPassenger] = useState(null);

    const passComponentRef = useRef();
    const handlePrintPass = useReactToPrint({
        contentRef: passComponentRef,
        documentTitle: selectedPassPassenger ? `Bus-Pass-${selectedPassPassenger.admission_number || selectedPassPassenger.emp_no}` : 'Bus-Pass'
    });

    const fetchRequests = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/transport-requests?`;
            const params = new URLSearchParams();
            if (routeFilter) params.append('route_id', routeFilter);
            if (courseFilter) params.append('course', courseFilter);
            if (statusFilter) params.append('status', statusFilter);
            if (searchQuery) params.append('search', searchQuery);

            url += params.toString();

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

    const fetchCourses = async () => {
        try {
            const response = await fetch(`${API_BASE}/students/courses`);
            if (response.ok) {
                const data = await response.json();
                setCourses(data);
            }
        } catch (e) {
            console.error('Error fetching courses:', e);
        }
    };

    useEffect(() => {
        fetchRoutes();
        fetchCourses();
    }, []);

    useEffect(() => {
        fetchRequests();
        setCurrentPage(1);
    }, [routeFilter, courseFilter, statusFilter, searchQuery]);

    const calculateStats = () => {
        const total = requests.length;
        const approved = requests.filter(r => (r.status || '').toLowerCase() === 'approved').length;
        const pending = requests.filter(r => (r.status || '').toLowerCase() === 'pending').length;
        return { total, approved, pending };
    };

    const stats = calculateStats();

    // Pagination logic
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRequests = requests.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(requests.length / rowsPerPage);

    const openApproveModal = async (requestId) => {
        setApproveModal({ open: true, requestId, data: null, selectedBusId: '', loading: true, error: null });
        try {
            const response = await fetch(`${API_BASE}/transport-requests/${requestId}/semester-options`);
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                let defaultBusId = '';
                if (data.busesOnRoute && data.busesOnRoute.length === 1) {
                    defaultBusId = data.busesOnRoute[0].busNumber;
                }
                setApproveModal((m) => ({ ...m, data, selectedBusId: defaultBusId, loading: false, error: null }));
            } else {
                setApproveModal((m) => ({ ...m, loading: false, error: data.message || 'Failed to load semester options' }));
            }
        } catch (err) {
            setApproveModal((m) => ({ ...m, loading: false, error: 'Could not load semester options' }));
        }
    };

    const closeApproveModal = () => {
        setApproveModal({ open: false, requestId: null, data: null, selectedBusId: '', loading: true, error: null });
    };

    const handleConfirmApprove = async () => {
        const id = approveModal.requestId;
        if (!id) return;
        
        if (approveModal.data?.busesOnRoute?.length > 0 && !approveModal.selectedBusId) {
            setApproveModal(m => ({ ...m, error: 'Please select a bus to assign the passenger to.' }));
            return;
        }

        setActionLoading(id);
        setMessage({ text: '', type: '' });
        try {
            const response = await fetch(`${API_BASE}/transport-requests/${id}/approve`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bus_id: approveModal.selectedBusId || null }),
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this request? If approved, this will also remove associated fees and concessions.')) {
            return;
        }

        setActionLoading(id);
        setMessage({ text: '', type: '' });
        try {
            const response = await fetch(`${API_BASE}/transport-requests/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_name: 'Admin', // In a real app, this would come from auth state
                    admin_id: 1
                })
            });
            const data = await response.json().catch(() => ({}));
            if (response.ok) {
                setMessage({ text: data.message || 'Request deleted successfully.', type: 'success' });
                fetchRequests();
            } else {
                setMessage({ text: data.message || 'Failed to delete request', type: 'error' });
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

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Requests</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl text-green-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Approved</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-3 bg-yellow-50 rounded-xl text-yellow-600">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                    </div>
                </div>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="flex w-full items-center gap-2 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex-[2] min-w-0 relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Search name/ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-2 py-2 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <select
                        value={routeFilter}
                        onChange={(e) => setRouteFilter(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-ellipsis"
                    >
                        <option value="">All Routes</option>
                        {routes.map((r) => (
                            <option key={r._id} value={r.routeId}>{r.routeName} ({r.routeId})</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 min-w-0">
                    <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-ellipsis"
                    >
                        <option value="">All Courses</option>
                        {courses.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex-1 min-w-0">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all text-ellipsis"
                    >
                        <option value="">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>

                {(routeFilter || courseFilter || statusFilter || searchQuery) && (
                    <div className="flex-shrink-0">
                        <button
                            onClick={() => { setRouteFilter(''); setCourseFilter(''); setStatusFilter(''); setSearchQuery(''); }}
                            className="text-sm text-red-600 hover:text-red-700 font-semibold px-3 py-2 border border-red-100 bg-red-50 rounded-xl transition-all"
                        >
                            Reset
                        </button>
                    </div>
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
                    {/* Pagination Controls */}
                    <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/80">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 font-medium">Rows per page:</span>
                            <select
                                value={rowsPerPage}
                                onChange={(e) => {
                                    setRowsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
                            >
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>
                                Showing <span className="font-semibold text-gray-900">{indexOfFirstRow + 1}</span> to <span className="font-semibold text-gray-900">{Math.min(indexOfLastRow, requests.length)}</span> of <span className="font-semibold text-gray-900">{requests.length}</span> entries
                            </span>
                            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm p-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>
                                <span className="px-3 font-medium text-gray-700 bg-gray-50 py-1 rounded-md border border-gray-100">Page {currentPage} of {totalPages || 1}</span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                    className="p-1 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-4">Type</th>
                                    <th className="p-4">ID Number</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Course</th>
                                    <th className="p-4 text-center">Year</th>
                                    <th className="p-4">Route</th>
                                    <th className="p-4">Stage</th>
                                    <th className="p-4">Fare</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                                {currentRequests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${req.user_type === 'employee' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {req.user_type || 'student'}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-blue-600">{req.admission_number || req.emp_no}</td>
                                        <td className="p-4 font-medium text-gray-900">{req.student_name || req.employee_name}</td>
                                        <td className="p-4 text-xs font-semibold uppercase text-gray-500">{req.course || '—'}</td>
                                        <td className="p-4 text-center">
                                            {req.user_type === 'employee' ? '—' : (
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                                    Y{req.year_of_study || '—'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">{req.route_name}</td>
                                        <td className="p-4">{req.stage_name}</td>
                                        <td className="p-4 font-medium text-gray-900">{req.user_type === 'employee' ? 'Free (₹0)' : `₹${req.fare}`}</td>
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
                                            <div className="flex items-center gap-2">
                                                {isPending(req) && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleApprove(req.id)}
                                                            disabled={actionLoading !== null}
                                                            className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReject(req.id)}
                                                            disabled={actionLoading !== null}
                                                            className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                                        >
                                                            {actionLoading === req.id ? '...' : 'Reject'}
                                                        </button>
                                                    </>
                                                )}
                                                {req.status === 'approved' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedPassPassenger(req);
                                                            setTimeout(() => handlePrintPass(), 100);
                                                        }}
                                                        className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all hover:scale-110"
                                                        title="Print Bus Pass"
                                                    >
                                                        <CreditCard size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(req.id)}
                                                    disabled={actionLoading !== null}
                                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-all hover:scale-110"
                                                    title="Delete Request"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <BusPassCard ref={passComponentRef} passenger={selectedPassPassenger} />
                </div>
            )
            }

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
                            <p><span className="font-medium text-gray-600">{approveModal.data.user_type === 'employee' ? 'Employee' : 'Student'}:</span> {approveModal.data.studentName}</p>
                            <p><span className="font-medium text-gray-600">ID Number:</span> {approveModal.data.admissionNumber}</p>
                            {approveModal.data.user_type !== 'employee' && (
                                <p><span className="font-medium text-gray-600">Course / Year:</span> {approveModal.data.course} – Year {approveModal.data.yearOfStudy}</p>
                            )}
                        </div>
                        {approveModal.data.route_name && (
                            <div className="mb-4 p-4 rounded-xl border border-blue-100 bg-blue-50">
                                <p className="text-sm font-semibold text-blue-900 mb-2">Route: {approveModal.data.route_name} {approveModal.data.route_id && <span className="text-blue-600">({approveModal.data.route_id})</span>}</p>
                                {approveModal.data.busesOnRoute && approveModal.data.busesOnRoute.length > 0 ? (
                                    <>
                                        <p className="text-xs font-semibold text-blue-800 mb-2">Select a Bus to Assign:</p>
                                        <select 
                                            value={approveModal.selectedBusId}
                                            onChange={(e) => setApproveModal(m => ({ ...m, selectedBusId: e.target.value, error: null }))}
                                            className="w-full text-sm p-2 border border-blue-200 rounded outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                        >
                                            <option value="">-- Choose Bus --</option>
                                            {approveModal.data.busesOnRoute.map((b) => (
                                                <option key={b.busNumber} value={b.busNumber}>
                                                    {b.busNumber} (Filled: {b.seatsFilled}/{b.capacity} | {b.seatsAvailable} available)
                                                </option>
                                            ))}
                                        </select>
                                    </>
                                ) : (
                                    <p className="text-sm text-blue-700">No buses assigned to this route yet. Assign in Bus Management → Bus–Route mapping.</p>
                                )}
                            </div>
                        )}
                        {approveModal.data.user_type !== 'employee' ? (
                            <>
                                <p className="text-sm text-gray-700 mb-2">Transport is valid until the <strong>end of the academic year</strong> (last semester), regardless of which sem the student applied in.</p>
                                {approveModal.data.expiry ? (
                                    <div className="p-4 rounded-xl border border-green-200 bg-green-50 text-green-800">
                                        <p className="font-semibold">Expiry date: {formatDate(approveModal.data.expiry.expiry_date)}</p>
                                        <p className="text-sm mt-1">{approveModal.data.expiry.label}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 py-2">No semester config found for this course/year. Approval will still succeed; expiry will not be set.</p>
                                )}
                            </>
                        ) : (
                            <p className="text-sm font-medium p-4 rounded-xl border bg-purple-50 text-purple-800 border-purple-200">
                                Employee transport requests do not have academic expiry dates and are free of charge.
                            </p>
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
        </Layout >
    );
};

export default TransportRequests;
