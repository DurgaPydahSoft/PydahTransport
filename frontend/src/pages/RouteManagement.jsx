import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const RouteManagement = () => {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
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
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/routes`);
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

    const handleEdit = (route) => {
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this route?')) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/routes/${id}`, {
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
                ? `${import.meta.env.VITE_API_URL}/routes/${editingId}`
                : `${import.meta.env.VITE_API_URL}/routes`;

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
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Route Network</h2>
                    <p className="text-gray-500 mt-1">Design routes, manage stages, and set fares.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-200 transition-all hover:shadow-indigo-300 active:scale-95 flex items-center"
                >
                    <span className="mr-2 text-xl">+</span> Create Route
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading route data...</div>
            ) : routes.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden min-h-[400px] flex flex-col items-center justify-center p-8">
                    <div className="bg-indigo-50 p-6 rounded-full mb-4 animate-pulse">
                        <span className="text-4xl">🗺️</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">Route Map Empty</h3>
                    <p className="text-gray-500 text-center max-w-sm mx-auto">
                        Define the pickup and drop points for your students. Create your first route to get started.
                    </p>
                    <button onClick={() => setIsModalOpen(true)} className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline mt-4">
                        Create first route
                    </button>
                </div>
            ) : (
                <div className="space-y-6">
                    {routes.map((route) => (
                        <div key={route._id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transform transition-all hover:shadow-md group relative">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 p-1 rounded-lg backdrop-blur-sm">
                                <button
                                    onClick={() => handleEdit(route)}
                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                    title="Edit Route"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDelete(route._id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Route"
                                >
                                    🗑️
                                </button>
                            </div>
                            <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-gray-900">{route.routeName}</h3>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-md">{route.routeId}</span>
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">{route.startPoint} ➝ {route.endPoint} • {route.estimatedTime}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-indigo-600">{route.totalDistance} km</p>
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Distance</p>
                                </div>
                            </div>
                            <div className="p-6">
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Route Stages & Fares</h4>
                                <div className="flex overflow-x-auto pb-4 gap-4 custom-scrollbar">
                                    {route.stages.map((stage, index) => (
                                        <div key={index} className="flex-shrink-0 min-w-[140px] p-4 bg-gray-50 rounded-xl border border-gray-100 relative">
                                            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-6 h-6 bg-indigo-500 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-sm">
                                                {index + 1}
                                            </div>
                                            <h5 className="font-bold text-gray-800 truncate mb-1" title={stage.stageName}>{stage.stageName}</h5>
                                            <p className="text-xs text-gray-500 mb-3">{stage.distanceFromStart} km from start</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-400">Fare:</span>
                                                    <span className="font-medium text-gray-700">₹{stage.fare}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Edit Route" : "Create New Route"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Route ID</label>
                            <input type="text" name="routeId" required value={formData.routeId} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. R01" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Route Name</label>
                            <input type="text" name="routeName" required value={formData.routeName} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Campus Express" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Point</label>
                            <input type="text" name="startPoint" required value={formData.startPoint} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Point</label>
                            <input type="text" name="endPoint" required value={formData.endPoint} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Distance (km)</label>
                            <input type="number" name="totalDistance" value={formData.totalDistance} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Est. Time</label>
                            <input type="text" name="estimatedTime" value={formData.estimatedTime} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 45 mins" />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-gray-800">Route Stages</h4>
                            <button type="button" onClick={addStage} className="text-sm text-indigo-600 font-semibold hover:underline">+ Add Stage</button>
                        </div>
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {formData.stages.map((stage, index) => (
                                <div key={index} className="bg-gray-50 p-4 rounded-lg relative border border-gray-200">
                                    <button type="button" onClick={() => removeStage(index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600">✕</button>
                                    <div className="grid grid-cols-2 gap-3 mb-2">
                                        <input type="text" name="stageName" placeholder="Stage Name" value={stage.stageName} onChange={(e) => handleStageChange(index, e)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm" required />
                                        <input type="number" name="distanceFromStart" placeholder="Dist. from Start (km)" value={stage.distanceFromStart} onChange={(e) => handleStageChange(index, e)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm" required />
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <input type="number" name="fare" placeholder="Fare (₹)" value={stage.fare} onChange={(e) => handleStageChange(index, e)} className="w-full px-3 py-2 rounded border border-gray-300 text-sm" required />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-colors">
                        {editingId ? 'Update Route Structure' : 'Create Route Structure'}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
};

export default RouteManagement;
