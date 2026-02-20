import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import {
    Map,
    Edit,
    Trash2,
    Clock,
    Navigation,
    MapPin,
    Plus,
    ArrowRight,
    Milestone,
    IndianRupee,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

const RouteManagement = () => {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [expandedRouteId, setExpandedRouteId] = useState(null);
    const [formData, setFormData] = useState({
        routeId: '',
        routeName: '',
        startPoint: '',
        endPoint: '',
        totalDistance: '',
        estimatedTime: '',
        stages: [] // Start with empty stages
    });

    const fetchRoutes = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API}/routes`);
            const data = await response.json();
            setRoutes(data);
        } catch (error) {
            console.error('Error fetching routes:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, []);

    const toggleRoute = (id) => {
        setExpandedRouteId(expandedRouteId === id ? null : id);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleStageChange = (index, e) => {
        const { name, value } = e.target;
        const newStages = [...formData.stages];
        newStages[index][name] = value;
        setFormData(prev => ({ ...prev, stages: newStages }));
    };

    const addStage = () => {
        setFormData(prev => ({
            ...prev,
            stages: [...prev.stages, { stageName: '', distanceFromStart: '', fare: 0 }]
        }));
    };

    const removeStage = (index) => {
        const newStages = formData.stages.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, stages: newStages }));
    };

    const handleEdit = (route, e) => {
        e.stopPropagation();
        setFormData({
            routeId: route.routeId,
            routeName: route.routeName,
            startPoint: route.startPoint,
            endPoint: route.endPoint,
            totalDistance: route.totalDistance,
            estimatedTime: route.estimatedTime,
            stages: route.stages || []
        });
        setEditingId(route._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this route?')) return;

        try {
            const response = await fetch(`${API}/routes/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchRoutes();
            } else {
                alert('Failed to delete route');
            }
        } catch (error) {
            console.error('Error deleting route:', error);
            alert('Error deleting route');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            routeId: '', routeName: '', startPoint: '', endPoint: '',
            totalDistance: '', estimatedTime: '', stages: []
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API}/routes/${editingId}`
                : `${API}/routes`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                handleCloseModal();
                fetchRoutes();
            } else {
                alert(`Failed to ${editingId ? 'update' : 'create'} route`);
            }
        } catch (error) {
            console.error(`Error ${editingId ? 'updating' : 'creating'} route:`, error);
            alert(`Error ${editingId ? 'updating' : 'creating'} route`);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">Route Network</h2>
                    <p className="text-slate-600 mt-1">Design routes, manage stages, and set fares.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all hover:shadow-lg active:scale-95 flex items-center group"
                >
                    <Plus className="mr-2 group-hover:rotate-90 transition-transform" size={20} />
                    Create Route
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader size={40} text="Loading route data..." />
                </div>
            ) : routes.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8">
                    <div className="bg-slate-50 p-6 rounded-full mb-4">
                        <Map size={48} className="text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2 text-center">Route Map Empty</h3>
                    <p className="text-slate-500 text-center max-w-md mx-auto">
                        Define the pickup and drop points for your students. Create your first route to get started.
                    </p>
                    <button onClick={() => setIsModalOpen(true)} className="mt-6 flex items-center text-blue-600 font-semibold hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all">
                        <Plus size={20} className="mr-2" />
                        Create first route
                    </button>
                </div>
            ) : (
                <div className="flex flex-col space-y-3">
                    {routes.map((route) => {
                        const isExpanded = expandedRouteId === route._id;
                        return (
                            <div
                                key={route._id}
                                className={`bg-white rounded-xl shadow-sm border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200 hover:border-blue-200 hover:shadow-md'}`}
                            >
                                {/* Header / Summary Row */}
                                <div
                                    onClick={() => toggleRoute(route._id)}
                                    className="p-3 flex flex-col md:flex-row items-center justify-between gap-4 cursor-pointer group"
                                >
                                    {/* Left: Identity */}
                                    <div className="flex items-center gap-3 w-full md:w-1/4">
                                        <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                                            <Navigation size={16} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{route.routeName}</h3>
                                                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded border border-slate-200 font-mono">
                                                    {route.routeId}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                                                <Clock size={10} className="text-slate-400" />
                                                {route.estimatedTime}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Middle: Route Path */}
                                    <div className="flex items-center justify-center gap-3 w-full md:w-1/3 px-2">
                                        <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[100px] text-right" title={route.startPoint}>{route.startPoint}</span>
                                        <div className="flex-1 flex flex-col items-center">
                                            <div className="w-full h-px bg-slate-200 relative">
                                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                                                    <ArrowRight size={12} className="text-slate-300" />
                                                </div>
                                            </div>
                                            <span className="text-[9px] text-slate-400 font-medium mt-1">{route.totalDistance} km</span>
                                        </div>
                                        <span className="text-[10px] font-semibold text-slate-700 truncate max-w-[100px]" title={route.endPoint}>{route.endPoint}</span>
                                    </div>

                                    {/* Right: Stats & Actions */}
                                    <div className="flex items-center justify-end gap-3 w-full md:w-1/3">
                                        <div className="hidden sm:flex items-center gap-3 mr-2">
                                            <div className="text-right">
                                                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stages</span>
                                                <span className="block text-xs font-semibold text-slate-700">{route.stages.length}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 pl-3 border-l border-slate-100">
                                            <button
                                                onClick={(e) => handleEdit(route, e)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Edit Route"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(route._id, e)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                title="Delete Route"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                            <div className={`p-1 ml-1 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-blue-600' : ''}`}>
                                                <ChevronDown size={16} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content: Stages */}
                                <div
                                    className={`bg-slate-50 border-t border-slate-100 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="p-4">
                                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
                                            <Milestone size={12} className="mr-1.5 text-blue-500" />
                                            Route Stages & Fares
                                        </h4>

                                        {route.stages.length === 0 ? (
                                            <p className="text-xs text-slate-400 italic">No stages defined for this route.</p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {route.stages.map((stage, index) => (
                                                    <div key={index} className="bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-bold text-[10px] ring-2 ring-white">
                                                                {index + 1}
                                                            </span>
                                                            <div>
                                                                <p className="font-semibold text-slate-700 text-xs">{stage.stageName}</p>
                                                                <p className="text-[10px] text-slate-400">{stage.distanceFromStart} km from start</p>
                                                            </div>
                                                        </div>
                                                        <div className="font-mono font-medium text-slate-700 text-xs bg-green-50 px-1.5 py-0.5 rounded text-green-700 border border-green-100">
                                                            ₹{stage.fare}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Edit Route" : "Create New Route"}>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Route ID</label>
                            <input type="text" name="routeId" required value={formData.routeId} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. R01" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Route Name</label>
                            <input type="text" name="routeName" required value={formData.routeName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Campus Express" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Start Point</label>
                            <input type="text" name="startPoint" required value={formData.startPoint} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">End Point</label>
                            <input type="text" name="endPoint" required value={formData.endPoint} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Total Distance (km)</label>
                            <input type="number" name="totalDistance" value={formData.totalDistance} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Est. Time</label>
                            <input type="text" name="estimatedTime" value={formData.estimatedTime} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. 45 mins" />
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-5">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-800">Route Stages</h4>
                            <button type="button" onClick={addStage} className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 transition-colors">+ Add Stage</button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {formData.stages.length === 0 && (
                                <p className="text-sm text-slate-400 italic text-center py-4">No stages added yet. Click "+ Add Stage" to begin.</p>
                            )}
                            {formData.stages.map((stage, index) => (
                                <div key={index} className="bg-slate-50 p-3 rounded-xl relative border border-slate-200 group">
                                    <button type="button" onClick={() => removeStage(index)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="flex items-center mb-3">
                                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs mr-2">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm font-medium text-slate-700">Stage Details</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <input type="text" name="stageName" placeholder="Stage Name" value={stage.stageName} onChange={(e) => handleStageChange(index, e)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                                        <input type="number" name="distanceFromStart" placeholder="Km from Start" value={stage.distanceFromStart} onChange={(e) => handleStageChange(index, e)} className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                                    </div>
                                    <div>
                                        <div className="relative">
                                            <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="number" name="fare" placeholder="Fare Amount" value={stage.fare} onChange={(e) => handleStageChange(index, e)} className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" required />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-blue-900 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-2">
                        {editingId ? 'Update Route Structure' : 'Create Route Structure'}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
};

export default RouteManagement;
