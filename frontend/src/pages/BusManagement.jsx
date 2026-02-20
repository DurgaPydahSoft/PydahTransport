import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import {
    Bus,
    Users,
    User,
    MapPin,
    Edit,
    Trash2,
    Plus,
    UserCheck,
    Armchair,
    LayoutList,
    LayoutGrid
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

const TABS = { buses: 'buses', mapping: 'mapping' };
const VIEW_MODES = { table: 'table', card: 'card' };

const BusManagement = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(TABS.buses);
    const [viewMode, setViewMode] = useState(VIEW_MODES.table);
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [assigningBusId, setAssigningBusId] = useState(null);
    const [formData, setFormData] = useState({
        busNumber: '',
        capacity: '',
        type: 'Standard',
        driverName: '',
        attendantName: '',
        status: 'Active'
    });

    const fetchBuses = async () => {
        try {
            const response = await fetch(`${API}/buses`);
            const data = await response.json();
            setBuses(data);
        } catch (error) {
            console.error('Error fetching buses:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoutes = async () => {
        try {
            const response = await fetch(`${API}/routes`);
            const data = await response.json();
            setRoutes(data);
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    };

    useEffect(() => {
        fetchBuses();
        fetchRoutes();
    }, []);

    const handleAssignRoute = async (busId, routeId) => {
        setAssigningBusId(busId);
        try {
            const response = await fetch(`${API}/buses/${busId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignedRouteId: routeId || null }),
            });
            if (response.ok) fetchBuses();
        } catch (e) {
            console.error(e);
        } finally {
            setAssigningBusId(null);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = (bus, e) => {
        e.stopPropagation();
        setFormData({
            busNumber: bus.busNumber,
            capacity: bus.capacity,
            type: bus.type,
            driverName: bus.driverName || '',
            attendantName: bus.attendantName || '',
            status: bus.status
        });
        setEditingId(bus._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this bus?')) return;

        try {
            const response = await fetch(`${API}/buses/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchBuses();
            } else {
                alert('Failed to delete bus');
            }
        } catch (error) {
            console.error('Error deleting bus:', error);
            alert('Error deleting bus');
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({
            busNumber: '',
            capacity: '',
            type: 'Standard',
            driverName: '',
            attendantName: '',
            status: 'Active'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API}/buses/${editingId}`
                : `${API}/buses`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                handleCloseModal();
                fetchBuses(); // Refresh list
            } else {
                alert(`Failed to ${editingId ? 'update' : 'create'} bus`);
            }
        } catch (error) {
            console.error(`Error ${editingId ? 'updating' : 'creating'} bus:`, error);
            alert(`Error ${editingId ? 'updating' : 'creating'} bus`);
        }
    };

    return (
        <Layout>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight">Bus Management</h2>
                    <p className="text-slate-600 mt-1">Manage buses and assign them to routes.</p>
                </div>
                {activeTab === TABS.buses && (
                    <div className="flex items-center gap-3">
                        <div className="bg-white p-1 rounded-lg border border-slate-200 flex items-center shadow-sm">
                            <button
                                onClick={() => setViewMode(VIEW_MODES.table)}
                                className={`p-2 rounded-md transition-all ${viewMode === VIEW_MODES.table ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Table View"
                            >
                                <LayoutList size={20} />
                            </button>
                            <button
                                onClick={() => setViewMode(VIEW_MODES.card)}
                                className={`p-2 rounded-md transition-all ${viewMode === VIEW_MODES.card ? 'bg-slate-100 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                title="Card View"
                            >
                                <LayoutGrid size={20} />
                            </button>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-blue-900 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md transition-all hover:shadow-lg active:scale-95 flex items-center group"
                        >
                            <Plus className="mr-2 group-hover:rotate-90 transition-transform" size={20} />
                            Add New Bus
                        </button>
                    </div>
                )}
            </div>

            <div className="flex gap-2 mb-6 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => setActiveTab(TABS.buses)}
                    className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors flex items-center ${activeTab === TABS.buses ? 'bg-white border border-b-0 border-gray-200 text-blue-700 shadow-sm -mb-px' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <Bus size={18} className="mr-2" />
                    Buses
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab(TABS.mapping)}
                    className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors flex items-center ${activeTab === TABS.mapping ? 'bg-white border border-b-0 border-gray-200 text-blue-700 shadow-sm -mb-px' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <MapPin size={18} className="mr-2" />
                    Bus–Route mapping
                </button>
            </div>

            {activeTab === TABS.mapping && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800">Assign each bus to a route</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Changes apply immediately. Use Fleet & Passengers to auto-fill capacity.</p>
                    </div>
                    {loading ? (
                        <div className="py-12">
                            <Loader text="Loading fleet data..." />
                        </div>
                    ) : buses.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No buses available. Add buses in the Buses tab first.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                        <th className="p-4">Bus Details</th>
                                        <th className="p-4">Capacity</th>
                                        <th className="p-4">Assigned Route</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {buses.map((bus) => (
                                        <tr key={bus._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="p-4">
                                                <div className="flex items-center">
                                                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600 mr-3">
                                                        <Bus size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800">{bus.busNumber}</p>
                                                        <p className="text-xs text-slate-500">{bus.type}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-slate-600 font-medium">{bus.capacity} seats</td>
                                            <td className="p-4">
                                                <select
                                                    value={bus.assignedRouteId || ''}
                                                    onChange={(e) => handleAssignRoute(bus._id, e.target.value || null)}
                                                    disabled={assigningBusId === bus._id}
                                                    className="w-full max-w-xs text-sm rounded-lg border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium text-slate-700 transition-all font-sans"
                                                >
                                                    <option value="">— Unassigned —</option>
                                                    {routes.map((r) => (
                                                        <option key={r._id} value={r.routeId}>{r.routeName} ({r.routeId})</option>
                                                    ))}
                                                </select>
                                                {assigningBusId === bus._id && <span className="text-xs text-blue-500 ml-2 animate-pulse">Saving...</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === TABS.buses && (
                <>
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader size={40} text="Loading fleet data..." />
                        </div>
                    ) : buses.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col items-center justify-center py-20 px-4 text-center">
                            <div className="bg-slate-50 p-6 rounded-full mb-6">
                                <Bus size={48} className="text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">No Buses Found</h3>
                            <p className="text-slate-500 max-w-md mx-auto mb-8">
                                It looks like you haven't added any buses to the fleet yet. Start by adding a bus to manage transport.
                            </p>
                            <button onClick={() => setIsModalOpen(true)} className="flex items-center text-blue-600 font-semibold hover:text-blue-800 hover:bg-blue-50 px-4 py-2 rounded-lg transition-all">
                                <Plus size={20} className="mr-2" />
                                Add your first bus
                            </button>
                        </div>
                    ) : viewMode === VIEW_MODES.table ? (
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden w-full">
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                            <th className="px-4 py-3">Bus Details</th>
                                            <th className="px-4 py-3">Capacity</th>
                                            <th className="px-4 py-3">Driver</th>
                                            <th className="px-4 py-3">Attendant</th>
                                            <th className="px-4 py-3">Route</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {buses.map((bus) => (
                                            <tr
                                                key={bus._id}
                                                onClick={() => navigate(`/buses/${bus._id}`)}
                                                className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center">
                                                        <div className="bg-blue-100 p-1.5 rounded-lg text-blue-600 mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                                            <Bus size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{bus.busNumber}</p>
                                                            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{bus.type}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                                                    <div className="flex items-center">
                                                        <Armchair size={14} className="text-slate-400 mr-2" />
                                                        {bus.capacity} seats
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {bus.driverName || <span className="text-slate-400 italic text-xs">--</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {bus.attendantName || <span className="text-slate-400 italic text-xs">--</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {bus.assignedRouteId ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                            <MapPin size={12} className="mr-1" />
                                                            {routes.find(r => r.routeId === bus.assignedRouteId)?.routeName || bus.assignedRouteId}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs">--</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex w-fit items-center ${bus.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        bus.status === 'In Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                                                        }`}>
                                                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${bus.status === 'Active' ? 'bg-emerald-500' : bus.status === 'In Maintenance' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                                        {bus.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => handleEdit(bus, e)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                            title="Edit Bus"
                                                        >
                                                            <Edit size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => handleDelete(bus._id, e)}
                                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                            title="Delete Bus"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {buses.map((bus) => (
                                <div
                                    key={bus._id}
                                    onClick={() => navigate(`/buses/${bus._id}`)}
                                    className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden flex flex-col cursor-pointer"
                                >
                                    <div className="p-4 flex-1">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center">
                                                <div className="bg-blue-50 p-2 rounded-lg text-blue-600 mr-3 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                                    <Bus size={20} />
                                                </div>
                                                <div>
                                                    <h3 className="text-base font-bold text-slate-900 leading-tight">{bus.busNumber}</h3>
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">{bus.type}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${bus.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                bus.status === 'In Maintenance' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-red-50 text-red-700 border-red-100'
                                                }`}>
                                                <span className={`inline-block w-1 h-1 rounded-full mr-1 mb-0.5 ${bus.status === 'Active' ? 'bg-emerald-500' : bus.status === 'In Maintenance' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                                {bus.status}
                                            </span>
                                        </div>

                                        <div className="space-y-2 py-3 border-t border-b border-slate-50 my-2">
                                            <div className="flex items-center text-xs text-slate-600">
                                                <Armchair size={14} className="text-slate-400 mr-2 shrink-0" />
                                                <span className="font-medium mr-1">Cap:</span>
                                                {bus.capacity}
                                            </div>
                                            <div className="flex items-center text-xs text-slate-600">
                                                <User size={14} className="text-slate-400 mr-2 shrink-0" />
                                                <span className="font-medium mr-1">Drvr:</span>
                                                {bus.driverName || <span className="text-slate-400 italic font-normal text-[10px]">--</span>}
                                            </div>
                                            <div className="flex items-center text-xs text-slate-600">
                                                <UserCheck size={14} className="text-slate-400 mr-2 shrink-0" />
                                                <span className="font-medium mr-1">Attn:</span>
                                                {bus.attendantName || <span className="text-slate-400 italic font-normal text-[10px]">--</span>}
                                            </div>
                                            <div className="flex items-center text-xs text-slate-600">
                                                <MapPin size={14} className="text-slate-400 mr-2 shrink-0" />
                                                <span className="font-medium mr-1">Rt:</span>
                                                {bus.assignedRouteId ? (
                                                    <span className="text-blue-600 font-medium bg-blue-50 px-1.5 py-0.5 rounded text-[10px] truncate max-w-[100px]">
                                                        {routes.find(r => r.routeId === bus.assignedRouteId)?.routeName || bus.assignedRouteId}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400 italic font-normal text-[10px]">--</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex justify-between items-center">
                                        <span className="text-[10px] text-slate-400 font-medium uppercase">Manage</span>
                                        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={(e) => handleEdit(bus, e)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                title="Edit Bus"
                                            >
                                                <Edit size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(bus._id, e)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                title="Delete Bus"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Edit Bus Details" : "Add New Bus"}>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bus Number</label>
                        <input type="text" name="busNumber" required value={formData.busNumber} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. KA-01-F-1234" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Capacity</label>
                            <input type="number" name="capacity" required value={formData.capacity} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. 40" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white">
                                <option value="Standard">Standard</option>
                                <option value="Mini-bus">Mini-bus</option>
                                <option value="Van">Van</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Driver Name</label>
                        <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Ramesh Kumar" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Attendant Name</label>
                        <input type="text" name="attendantName" value={formData.attendantName} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Suresh Babu" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white">
                            <option value="Active">Active</option>
                            <option value="In Maintenance">In Maintenance</option>
                            <option value="Retired">Retired</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-900 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 mt-4">
                        {editingId ? 'Update Bus Details' : 'Create Bus'}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
};

export default BusManagement;
