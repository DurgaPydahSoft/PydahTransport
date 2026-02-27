import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

const AdminRaiseRequest = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedStage, setSelectedStage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Mocking logged in admin for now - in real app this comes from auth context
    const admin = { name: 'Admin', id: 1 };

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await fetch(`${API_BASE}/routes`);
            const data = await response.json();
            setRoutes(data);
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery) return;
        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/students/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setStudents(data);
            setSelectedStudent(null);
        } catch (error) {
            console.error('Error searching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRoute = (e) => {
        const routeId = e.target.value;
        const route = routes.find(r => r.routeId === routeId);
        setSelectedRoute(route);
        setSelectedStage(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedStudent || !selectedRoute || !selectedStage) {
            setMessage({ text: 'Please select a student, route, and stage.', type: 'error' });
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`${API_BASE}/transport-requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    admission_number: selectedStudent.admission_number || selectedStudent.admission_no,
                    student_name: selectedStudent.student_name,
                    route_id: selectedRoute.routeId,
                    route_name: selectedRoute.routeName,
                    stage_name: selectedStage.stageName,
                    fare: selectedStage.fare,
                    raised_by: 'admin',
                    raised_by_id: admin.id
                })
            });

            if (response.ok) {
                setMessage({ text: 'Transport request raised successfully on behalf of the student.', type: 'success' });
                // Reset form
                setSearchQuery('');
                setStudents([]);
                setSelectedStudent(null);
                setSelectedRoute(null);
                setSelectedStage(null);
            } else {
                const data = await response.json();
                setMessage({ text: data.message || 'Failed to raise request.', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Raise Request (On Behalf of Student)</h2>
                <p className="text-gray-500 mt-1">Select a student and assign a route/stage to raise a new transport request.</p>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 1: Select Student</h3>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            placeholder="Search by Name or Admission No..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Search'}
                        </button>
                    </form>

                    <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg">
                        {students.length > 0 ? (
                            <ul className="divide-y divide-gray-50">
                                {students.map(s => (
                                    <li
                                        key={s.id}
                                        onClick={() => setSelectedStudent(s)}
                                        className={`p-3 cursor-pointer hover:bg-blue-50 transition-colors ${selectedStudent?.id === s.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                                    >
                                        <div className="font-medium text-gray-900">{s.student_name}</div>
                                        <div className="text-xs text-gray-500">{s.admission_number || s.admission_no} • {s.course} • {s.branch}</div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-8 text-center text-gray-400 text-sm">
                                {loading ? 'Fetching students...' : 'Search for a student to see results.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Request Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Step 2: Request Details</h3>

                    {selectedStudent ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-sm border border-blue-100">
                                <p><span className="font-semibold text-blue-800">Assigning for:</span> {selectedStudent.student_name}</p>
                                <p className="text-xs text-blue-600 mt-1">{selectedStudent.admission_number || selectedStudent.admission_no} • Year {selectedStudent.current_year}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Route</label>
                                <select
                                    onChange={handleSelectRoute}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="">Select a route</option>
                                    {routes.map(r => (
                                        <option key={r.routeId} value={r.routeId}>{r.routeName} ({r.routeId})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedRoute && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stage (Stop)</label>
                                    <select
                                        onChange={(e) => setSelectedStage(selectedRoute.stages.find(s => s.stageName === e.target.value))}
                                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">Select a stage</option>
                                        {selectedRoute.stages.map(s => (
                                            <option key={s.stageName} value={s.stageName}>{s.stageName} - ₹{s.fare}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedStage && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 text-sm">Calculated Fare:</span>
                                        <span className="text-xl font-bold text-gray-900">₹{selectedStage.fare}</span>
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting || !selectedStage}
                                className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md"
                            >
                                {submitting ? 'Submitting Request...' : 'Raise Request On Behalf'}
                            </button>
                        </form>
                    ) : (
                        <div className="p-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-2xl">
                            Please select a student from the left to continue.
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AdminRaiseRequest;
