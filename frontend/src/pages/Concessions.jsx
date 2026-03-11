import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Concessions = () => {
    const [concessions, setConcessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [filters, setFilters] = useState({ course: '', route_id: '', search: '', page: 1, limit: 10 });
    const [pagination, setPagination] = useState({ total: 0, pages: 0, currentPage: 1 });
    const [courses, setCourses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [updating, setUpdating] = useState(null);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [modalConfig, setModalConfig] = useState({ show: false, concession: null, year: null, amount: '' });

    // Mock admin
    const admin = { name: 'Admin', id: 1 };

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchConcessions();
    }, [filters]);

    const fetchMetadata = async () => {
        try {
            const [coursesRes, routesRes] = await Promise.all([
                fetch(`${API_BASE}/students/courses`),
                fetch(`${API_BASE}/routes`)
            ]);
            setCourses(await coursesRes.json());
            setRoutes(await routesRes.json());
        } catch (error) {
            console.error('Error fetching metadata:', error);
        }
    };

    const fetchConcessions = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams(filters).toString();
            const response = await fetch(`${API_BASE}/transport-requests/concessions?${query}`);
            const result = await response.json();
            setConcessions(result.data || []);
            setPagination(result.pagination || { total: 0, pages: 0, currentPage: 1 });
        } catch (error) {
            console.error('Error fetching concessions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (concession, year) => {
        const currentAmount = (concession.yearConcessions && concession.yearConcessions[year]) 
            ? concession.yearConcessions[year] 
            : concession.original_fare;
        setModalConfig({
            show: true,
            concession,
            year,
            amount: currentAmount
        });
    };

    const handleUpdate = async () => {
        const { concession, year, amount } = modalConfig;
        
        setUpdating(concession.id);
        try {
            const response = await fetch(`${API_BASE}/transport-requests/${concession.id}/concession`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    revised_amount: Number(amount),
                    admin_name: admin.name,
                    admin_id: admin.id,
                    targetYear: year
                })
            });

            if (response.ok) {
                setMessage({ text: `Fee updated successfully for Year ${year}.`, type: 'success' });
                fetchConcessions();
                setModalConfig({ ...modalConfig, show: false });
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

    const handleDelete = async (concessionId) => {
        if (!window.confirm('Are you sure you want to delete this concession? This will also remove the current active transport fee for this student.')) {
            return;
        }

        setUpdating(concessionId);
        try {
            const response = await fetch(`${API_BASE}/transport-requests/${concessionId}/concession`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admin_name: admin.name,
                    admin_id: admin.id
                })
            });

            if (response.ok) {
                setMessage({ text: 'Concession and fee deleted successfully.', type: 'success' });
                fetchConcessions();
            } else {
                const data = await response.json();
                setMessage({ text: data.message || 'Failed to delete concession.', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'An error occurred.', type: 'error' });
        } finally {
            setUpdating(null);
        }
    };

    return (
        <Layout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Concessions Management</h2>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="w-64">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Search Student</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search by name..."
                                value={filters.search}
                                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                                className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <svg className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    <div className="w-48">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Course</label>
                        <select
                            value={filters.course}
                            onChange={(e) => setFilters(prev => ({ ...prev, course: e.target.value, page: 1 }))}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">All Courses</option>
                            {courses.map(c => (
                                <option key={c.id || c.name} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-48">
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Route</label>
                        <select
                            value={filters.route_id}
                            onChange={(e) => setFilters(prev => ({ ...prev, route_id: e.target.value, page: 1 }))}
                            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                        >
                            <option value="">All Routes</option>
                            {routes.map(r => (
                                <option key={r._id || r.id} value={r.routeId}>{r.routeName}</option>
                            ))}
                        </select>
                    </div>
                </div>
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
                                <th className="p-4 w-10"></th>
                                <th className="p-4">Student Name</th>
                                <th className="p-4">Admission No</th>
                                <th className="p-4">Current Year</th>
                                {[1, 2, 3, 4].map(y => (
                                    <th key={y} className="p-4 text-center">Y{y} Fee</th>
                                ))}
                                <th className="p-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="9" className="p-10 text-center text-gray-400">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                                            <span>Loading concessions data...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : concessions.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="p-10 text-center text-gray-400">No approved transport requests found.</td>
                                </tr>
                            ) : (
                                concessions.map(c => (
                                    <React.Fragment key={c.id}>
                                        <tr className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedRowId === c.id ? 'bg-blue-50/30' : ''}`} 
                                            onClick={() => setExpandedRowId(expandedRowId === c.id ? null : c.id)}>
                                            <td className="p-4">
                                                <div className={`transition-transform duration-200 ${expandedRowId === c.id ? 'rotate-90' : ''}`}>
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                                                    </svg>
                                                </div>
                                            </td>
                                            <td className="p-4 font-bold text-gray-900">{c.student_name}</td>
                                            <td className="p-4 font-mono text-xs">{c.admission_number}</td>
                                            <td className="p-4">
                                                <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-md text-[10px] font-bold">
                                                    Year {c.student_year || '—'}
                                                </span>
                                            </td>
                                            {[1, 2, 3, 4].map(year => {
                                                const isAvailable = year <= c.total_course_years;
                                                const isCurrentYear = Number(year) === Number(c.student_year);
                                                const amount = (c.yearConcessions && c.yearConcessions[year]) 
                                                    ? c.yearConcessions[year] 
                                                    : c.original_fare;
                                                const isConcession = c.yearConcessions && c.yearConcessions[year] !== undefined;

                                                return (
                                                    <td key={year} className="p-4 text-center relative group">
                                                        {isAvailable ? (
                                                            <>
                                                                <button 
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenModal(c, year); }}
                                                                    className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                                        isCurrentYear
                                                                            ? 'ring-2 ring-blue-500 ring-offset-1 border-blue-200 bg-blue-50 text-blue-700'
                                                                            : isConcession 
                                                                                ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100' 
                                                                                : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    ₹{amount}
                                                                </button>
                                                                {isCurrentYear && (
                                                                    <div className="absolute top-1 right-1">
                                                                        <span className="flex h-2 w-2">
                                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-200">—</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                                                    disabled={updating === c.id}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50 group/del"
                                                    title="Delete Concession"
                                                >
                                                    <svg className="w-5 h-5 group-hover/del:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRowId === c.id && (
                                            <tr className="bg-blue-50/20">
                                                <td colSpan="9" className="p-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                                        <div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Route Details</div>
                                                            <div className="text-sm font-semibold text-gray-700">{c.route_name}</div>
                                                            <div className="text-xs text-gray-500">Route ID: {c.route_id}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Stage Name</div>
                                                            <div className="text-sm font-semibold text-gray-700">{c.stage_name}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Standard Fare</div>
                                                            <div className="text-sm font-semibold text-gray-500 line-through">₹{c.original_fare}</div>
                                                        </div>
                                                        <div className="flex justify-end items-center">
                                                            <div className="text-right">
                                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Updated</div>
                                                                <div className="text-xs text-gray-500">{new Date(c.updated_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-xs font-semibold text-gray-500">
                        Showing <span className="text-gray-900">{concessions.length}</span> of <span className="text-gray-900">{pagination.total}</span> records
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <button
                            disabled={filters.page <= 1 || loading}
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="flex items-center gap-1">
                            {[...Array(pagination.pages)].map((_, i) => {
                                const p = i + 1;
                                // Show only current page, first, last, and neighbors
                                if (p === 1 || p === pagination.pages || (p >= filters.page - 1 && p <= filters.page + 1)) {
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setFilters(prev => ({ ...prev, page: p }))}
                                            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                                                filters.page === p 
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-100' 
                                                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                } else if (p === filters.page - 2 || p === filters.page + 2) {
                                    return <span key={p} className="text-gray-400 text-xs">...</span>;
                                }
                                return null;
                            })}
                        </div>

                        <button
                            disabled={filters.page >= pagination.pages || loading}
                            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                            className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Concession Modal */}
            {modalConfig.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-xl font-bold text-gray-800">Adjust Fee for Year {modalConfig.year}</h3>
                            <p className="text-sm text-gray-500 mt-1">Student: <span className="font-semibold text-gray-700">{modalConfig.concession.student_name}</span></p>
                        </div>
                        <div className="p-8">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Revised Concession Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 font-medium">₹</span>
                                <input
                                    type="number"
                                    value={modalConfig.amount}
                                    onChange={(e) => setModalConfig({ ...modalConfig, amount: e.target.value })}
                                    autoFocus
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-xl pl-10 pr-4 py-4 text-2xl font-bold text-gray-800 outline-none transition-all shadow-inner"
                                    placeholder="Enter amount"
                                />
                            </div>
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
                                    Original Fare is ₹{modalConfig.concession.original_fare}. This amount will be applied to all future transport fee generations for Year {modalConfig.year}.
                                </p>
                            </div>
                        </div>
                        <div className="p-6 flex gap-3 border-t border-gray-100">
                            <button 
                                onClick={() => setModalConfig({ ...modalConfig, show: false })}
                                className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleUpdate}
                                disabled={updating === modalConfig.concession.id}
                                className="flex-1 px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-200"
                            >
                                {updating === modalConfig.concession.id ? 'Updating...' : 'Save Change'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Concessions;
