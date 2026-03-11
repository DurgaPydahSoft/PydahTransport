import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';

const API_BASE = import.meta.env.VITE_API_URL || '';

const AdminRaiseRequest = () => {
    const [activeTab, setActiveTab] = useState('new'); // 'new' or 'change'
    const [changeType, setChangeType] = useState('route'); // 'route' or 'stage'
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]);
    const [approvedStudents, setApprovedStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [selectedStage, setSelectedStage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Get logged in admin info
    const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
    const admin = { 
        name: adminInfo.name || 'Admin', 
        id: adminInfo.id || adminInfo.userId || 1 
    };

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
            const endpoint = activeTab === 'new' 
                ? `${API_BASE}/students/search?q=${encodeURIComponent(searchQuery)}`
                : `${API_BASE}/transport-requests/approved-passengers?q=${encodeURIComponent(searchQuery)}`;
            
            const response = await fetch(endpoint);
            const data = await response.json();
            
            if (activeTab === 'new') {
                setStudents(data);
            } else {
                setApprovedStudents(data);
            }
            setSelectedStudent(null);
        } catch (error) {
            console.error('Error searching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectStudent = (student) => {
        setSelectedStudent(student);
        setSelectedRoute(null);
        setSelectedStage(null);

        // If it's a stage-only change, pre-select the current route
        if (activeTab === 'change' && changeType === 'stage' && student.route_id) {
            const currentRoute = routes.find(r => r.routeId === student.route_id);
            if (currentRoute) {
                setSelectedRoute(currentRoute);
            }
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
            const isChange = activeTab === 'change';
            const endpoint = isChange 
                ? `${API_BASE}/transport-requests/change-request`
                : `${API_BASE}/transport-requests`;
            
            const body = isChange ? {
                admission_number: selectedStudent.admission_number,
                new_route_id: selectedRoute.routeId,
                new_route_name: selectedRoute.routeName,
                new_stage_name: selectedStage.stageName,
                new_fare: selectedStage.fare,
                admin_name: admin.name,
                admin_id: admin.id
            } : {
                admission_number: selectedStudent.admission_number || selectedStudent.admission_no,
                student_name: selectedStudent.student_name,
                route_id: selectedRoute.routeId,
                route_name: selectedRoute.routeName,
                stage_name: selectedStage.stageName,
                fare: selectedStage.fare,
                raised_by: 'admin',
                raised_by_id: admin.id
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                const resData = await response.json();
                const successMsg = isChange 
                    ? `Route change processed. Fare Difference: ₹${resData.fareDifference}`
                    : 'Transport request raised successfully on behalf of the student.';
                
                setMessage({ text: successMsg, type: 'success' });
                // Reset form
                setSearchQuery('');
                setStudents([]);
                setApprovedStudents([]);
                setSelectedStudent(null);
                setSelectedRoute(null);
                setSelectedStage(null);
                setChangeType('route'); // Default back
            } else {
                const data = await response.json();
                setMessage({ text: data.message || 'Failed to process request.', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'An error occurred. Please try again.', type: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">Raise Request</h2>
                    <p className="text-slate-500 mt-1">Enroll a new student or request a route/stage change for existing passengers.</p>
                </div>
                
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm self-start md:self-auto">
                    <button
                        onClick={() => { setActiveTab('new'); setSelectedStudent(null); setStudents([]); setApprovedStudents([]); setSearchQuery(''); }}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'new' ? 'bg-white text-blue-900 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        New Enrollment
                    </button>
                    <button
                        onClick={() => { setActiveTab('change'); setSelectedStudent(null); setStudents([]); setApprovedStudents([]); setSearchQuery(''); }}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${activeTab === 'change' ? 'bg-white text-blue-900 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Route/Stage Change
                    </button>
                </div>
            </div>

            {message.text && (
                <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Student Selection */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">1</span>
                        {activeTab === 'new' ? 'Select Student' : 'Find Passenger'}
                    </h3>
                    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder={activeTab === 'new' ? "Search Name or Admission No..." : "Search Approved Passenger..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md active:scale-95"
                        >
                            {loading ? '...' : 'Search'}
                        </button>
                    </form>

                    <div className="max-h-[400px] overflow-y-auto border border-slate-100 rounded-xl custom-scrollbar pr-1">
                        {(activeTab === 'new' ? students : approvedStudents).length > 0 ? (
                            <ul className="divide-y divide-slate-50">
                                {(activeTab === 'new' ? students : approvedStudents).map(s => (
                                    <li
                                        key={s.id}
                                        onClick={() => handleSelectStudent(s)}
                                        className={`p-4 cursor-pointer hover:bg-slate-50 transition-all rounded-lg m-1 ${selectedStudent?.id === s.id ? 'bg-blue-50 border border-blue-100 shadow-sm' : 'border border-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-bold text-slate-900">{s.student_name}</div>
                                                <div className="text-xs text-slate-500 mt-0.5 font-medium">ADMN: {s.admission_number || s.admission_no}</div>
                                            </div>
                                            <div className="text-[10px] px-2 py-1 bg-white border border-slate-100 rounded-full font-bold text-slate-400">
                                                Year {s.current_year || s.year_of_study}
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                                            <span className="truncate">{s.course}</span>
                                            {activeTab === 'change' && (
                                                <span className="bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded font-black text-[9px] uppercase tracking-tighter">Current: {s.route_name}</span>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-12 text-center text-slate-400 text-sm">
                                {loading ? 'Fetching records...' : activeTab === 'new' ? 'Search for a student to begin.' : 'Search for an approved passenger.'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Request Details */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-fit">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                        Request Details
                    </h3>

                    {selectedStudent ? (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {activeTab === 'change' && (
                                <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-4">
                                    <button
                                        type="button"
                                        onClick={() => { setChangeType('route'); setSelectedRoute(null); setSelectedStage(null); }}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${changeType === 'route' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Full Route Change
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { 
                                            setChangeType('stage'); 
                                            const currentRoute = routes.find(r => r.routeId === selectedStudent.route_id);
                                            setSelectedRoute(currentRoute || null);
                                            setSelectedStage(null);
                                        }}
                                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${changeType === 'stage' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Only Stage Change
                                    </button>
                                </div>
                            )}

                            <div className="p-4 bg-slate-50 rounded-2xl text-sm border border-slate-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-100/50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
                                <div className="relative z-10">
                                    <p className="text-[10px] uppercase font-black text-slate-400 mb-1 tracking-widest">Selected Student</p>
                                    <p className="font-black text-slate-900 text-lg uppercase leading-none">{selectedStudent.student_name}</p>
                                    <div className="flex gap-4 mt-3">
                                        <div className="px-2.5 py-1 bg-white rounded-lg shadow-sm border border-slate-100 inline-block min-w-[70px] text-center">
                                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none">Admission</p>
                                            <span className="text-xs font-bold text-blue-700">{selectedStudent.admission_number || selectedStudent.admission_no}</span>
                                        </div>
                                        {activeTab === 'change' && (
                                            <div className="px-2.5 py-1 bg-emerald-50 rounded-lg shadow-sm border border-emerald-100 inline-block min-w-[70px] text-center">
                                                <p className="text-[8px] font-black text-emerald-400 uppercase leading-none">Current Fare</p>
                                                <span className="text-xs font-bold text-emerald-700">₹{selectedStudent.fare}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">
                                        {changeType === 'stage' ? 'Current Route (Locked)' : 'Assign New Route'}
                                    </label>
                                    <select
                                        onChange={handleSelectRoute}
                                        value={selectedRoute?.routeId || ''}
                                        disabled={changeType === 'stage'}
                                        className={`w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none ${changeType === 'stage' ? 'bg-slate-100 text-slate-500' : 'bg-white text-slate-700'}`}
                                        required
                                    >
                                        <option value="">{changeType === 'stage' ? selectedRoute?.routeName : 'Select an operation route'}</option>
                                        {routes.map(r => (
                                            <option key={r.routeId} value={r.routeId}>{r.routeName} ({r.routeId})</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedRoute && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">New Stage (Stop Point)</label>
                                        <select
                                            onChange={(e) => setSelectedStage(selectedRoute.stages.find(s => s.stageName === e.target.value))}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium text-slate-700 appearance-none bg-white"
                                            required
                                        >
                                            <option value="">Select a stage point</option>
                                            {selectedRoute.stages.map(s => (
                                                <option key={s.stageName} value={s.stageName}>{s.stageName} — ₹{s.fare}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {selectedStage && (
                                    <div className="p-5 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200/50 border border-blue-500 transform transition-all duration-300 animate-in zoom-in-95">
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-blue-100 text-xs font-bold uppercase tracking-wider">New Adjusted Fare</span>
                                            <span className="text-3xl font-black text-white">₹{selectedStage.fare}</span>
                                        </div>
                                        
                                        {activeTab === 'change' && (
                                            <div className="pt-4 border-t border-blue-500/50 flex justify-between items-center">
                                                <span className="text-blue-100 text-[10px] font-bold uppercase tracking-wider">Due Amount (Excess)</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xl font-black ${selectedStage.fare - selectedStudent.fare > 0 ? 'text-yellow-300' : 'text-blue-200'}`}>
                                                        ₹{Math.max(0, selectedStage.fare - selectedStudent.fare)}
                                                    </span>
                                                    {selectedStage.fare - selectedStudent.fare > 0 && (
                                                        <span className="bg-yellow-400 text-yellow-900 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase">To Pay</span>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedStage}
                                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black disabled:opacity-50 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>Processing...</>
                                ) : (
                                    <>{activeTab === 'new' ? 'Confirm Enrollment' : 'Confirm Route Change'}</>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="p-16 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                            <RefreshCw size={48} className="mx-auto mb-4 opacity-20" />
                            <p className="font-bold text-slate-500">Pick a student on the left</p>
                            <p className="text-xs text-slate-400 mt-1">We'll load their configuration right here.</p>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default AdminRaiseRequest;
