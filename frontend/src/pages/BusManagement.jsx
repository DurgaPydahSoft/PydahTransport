import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { apiFetch } from '../utils/api';
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
    LayoutGrid,
    X
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

const TABS = { buses: 'buses', mapping: 'mapping', staffMapping: 'staffMapping', staff: 'staff' };
const VIEW_MODES = { table: 'table', card: 'card' };

const todayDateInput = () => new Date().toISOString().slice(0, 10);

const normalizeStaffName = (name) => (name || '').trim().toLowerCase();

const matchStaffByName = (list, name) =>
    list.find((s) => normalizeStaffName(s.employee_name) === normalizeStaffName(name));

const withCurrentStaffOption = (list, currentName) => {
    if (!currentName) return list;
    if (list.some((s) => s.employee_name === currentName)) return list;
    return [{ _id: 'current-assigned', employee_name: currentName, emp_no: 'Assigned' }, ...list];
};

const BusManagement = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(TABS.buses);
    const [staffSubTab, setStaffSubTab] = useState('drivers');
    const [viewMode, setViewMode] = useState(VIEW_MODES.table);
    const [buses, setBuses] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [assigningBusId, setAssigningBusId] = useState(null);
    const [assigningStaffBusId, setAssigningStaffBusId] = useState(null);
    const [drivers, setDrivers] = useState([]);
    const [cleaners, setCleaners] = useState([]);
    const [driversLoading, setDriversLoading] = useState(false);
    const [cleanersLoading, setCleanersLoading] = useState(false);
    const [staffDrafts, setStaffDrafts] = useState({});
    const [routeDrafts, setRouteDrafts] = useState({});
    const [formData, setFormData] = useState({
        busNumber: '',
        capacity: '',
        type: 'Standard',
        vehicleModel: '',
        registrationDate: todayDateInput(),
        status: 'Active'
    });

    const fetchBuses = async () => {
        try {
            const response = await apiFetch(`${API}/buses`);
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
            const response = await apiFetch(`${API}/routes`);
            const data = await response.json();
            setRoutes(data);
        } catch (error) {
            console.error('Error fetching routes:', error);
        }
    };

    const loadDrivers = async () => {
        setDriversLoading(true);
        try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
            const token = adminInfo?.token;

            if (!token) {
                console.error('No token found in localStorage');
                setDrivers([]);
                return [];
            }

            const response = await apiFetch(`${API}/employees/drivers`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            const list = Array.isArray(data) ? data : [];
            setDrivers(list);
            return list;
        } catch (error) {
            console.error('Error fetching drivers:', error);
            setDrivers([]);
            return [];
        } finally {
            setDriversLoading(false);
        }
    };

    const loadCleaners = async () => {
        setCleanersLoading(true);
        try {
            const adminInfo = JSON.parse(localStorage.getItem('adminInfo'));
            const token = adminInfo?.token;

            if (!token) {
                setCleaners([]);
                return [];
            }

            const response = await apiFetch(`${API}/employees/cleaners`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            const list = Array.isArray(data) ? data : [];
            setCleaners(list);
            return list;
        } catch (error) {
            console.error('Error fetching cleaners:', error);
            setCleaners([]);
            return [];
        } finally {
            setCleanersLoading(false);
        }
    };

    useEffect(() => {
        fetchBuses();
        fetchRoutes();
        loadDrivers();
        loadCleaners();
    }, []);

    const buildStaffDraft = (bus) => ({
        driverName: bus.driverName || '',
        attendantName: bus.attendantName || '',
        driverExitDate: todayDateInput(),
        driverEntryDate: todayDateInput(),
        cleanerExitDate: todayDateInput(),
        cleanerEntryDate: todayDateInput(),
    });

    const buildRouteDraft = (bus) => ({
        routeId: bus.assignedRouteId || '',
        exitDate: todayDateInput(),
        entryDate: todayDateInput(),
    });

    const getRouteLabel = (routeId) => {
        if (!routeId) return '—';
        const route = routes.find((r) => r.routeId === routeId);
        return route ? `${route.routeName} (${route.routeId})` : routeId;
    };

    useEffect(() => {
        if (!buses.length) return;
        setStaffDrafts(Object.fromEntries(buses.map((bus) => [bus._id, buildStaffDraft(bus)])));
        setRouteDrafts(Object.fromEntries(buses.map((bus) => [bus._id, buildRouteDraft(bus)])));
    }, [buses]);

    const handleRouteDraftChange = (busId, routeId) => {
        setRouteDrafts((prev) => ({
            ...prev,
            [busId]: {
                ...(prev[busId] || { exitDate: todayDateInput(), entryDate: todayDateInput() }),
                routeId,
            },
        }));
    };

    const handleRouteDraftDateChange = (busId, field, value) => {
        setRouteDrafts((prev) => ({
            ...prev,
            [busId]: { ...prev[busId], [field]: value },
        }));
    };

    const hasRouteDraftChanges = (bus) => {
        const draft = routeDrafts[bus._id] || buildRouteDraft(bus);
        return (draft.routeId || '') !== (bus.assignedRouteId || '');
    };

    const handleRouteSaveClick = async (bus) => {
        const draft = routeDrafts[bus._id] || buildRouteDraft(bus);
        const previousRouteId = bus.assignedRouteId || '';
        const newRouteId = draft.routeId || '';

        if (previousRouteId === newRouteId) {
            alert('No route changes to save for this bus.');
            return;
        }
        if (previousRouteId && !draft.exitDate) {
            alert('Please set the exit date for the previous route.');
            return;
        }
        if (newRouteId && !draft.entryDate) {
            alert('Please set the assignment date for the new route.');
            return;
        }

        setAssigningBusId(bus._id);
        try {
            const response = await apiFetch(`${API}/buses/${bus._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    routeChange: {
                        newRouteId: newRouteId || null,
                        exitDate: previousRouteId ? draft.exitDate : null,
                        entryDate: newRouteId ? draft.entryDate : null,
                    },
                }),
            });
            if (response.ok) {
                fetchBuses();
            } else {
                const data = await response.json().catch(() => ({}));
                alert(data.message || 'Failed to update route assignment');
            }
        } catch (e) {
            console.error(e);
            alert('Error updating route assignment');
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

    const formatDateForInput = (value) => {
        if (!value) return todayDateInput();
        try {
            return new Date(value).toISOString().slice(0, 10);
        } catch {
            return todayDateInput();
        }
    };

    const handleEdit = (bus, e) => {
        e.stopPropagation();
        setFormData({
            busNumber: bus.busNumber,
            capacity: bus.capacity,
            type: bus.type,
            vehicleModel: bus.vehicleModel || '',
            registrationDate: formatDateForInput(bus.registrationDate),
            status: bus.status
        });
        setEditingId(bus._id);
        setIsModalOpen(true);
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this bus?')) return;

        try {
            const response = await apiFetch(`${API}/buses/${id}`, {
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
            vehicleModel: '',
            registrationDate: todayDateInput(),
            status: 'Active'
        });
    };

    const handleStaffDraftChange = (busId, field, value) => {
        setStaffDrafts((prev) => ({
            ...prev,
            [busId]: {
                ...(prev[busId] || buildStaffDraft({ driverName: '', attendantName: '' })),
                [field]: value,
            },
        }));
    };

    const handleStaffDraftDateChange = (busId, field, value) => {
        setStaffDrafts((prev) => ({
            ...prev,
            [busId]: { ...prev[busId], [field]: value },
        }));
    };

    const handleDismissStaffChanges = (bus) => {
        setStaffDrafts((prev) => ({
            ...prev,
            [bus._id]: buildStaffDraft(bus),
        }));
    };

    const hasStaffDraftChanges = (bus) => {
        const draft = staffDrafts[bus._id] || {
            driverName: bus.driverName || '',
            attendantName: bus.attendantName || '',
        };
        return (
            normalizeStaffName(draft.driverName) !== normalizeStaffName(bus.driverName) ||
            normalizeStaffName(draft.attendantName) !== normalizeStaffName(bus.attendantName)
        );
    };

    const handleStaffSaveClick = async (bus) => {
        const draft = staffDrafts[bus._id] || buildStaffDraft(bus);
        const driverChanged = normalizeStaffName(draft.driverName) !== normalizeStaffName(bus.driverName);
        const cleanerChanged = normalizeStaffName(draft.attendantName) !== normalizeStaffName(bus.attendantName);

        if (!driverChanged && !cleanerChanged) {
            alert('No changes to save for this bus.');
            return;
        }

        if (driverChanged) {
            if (bus.driverName && !draft.driverExitDate) {
                alert('Please set the exit date for the previous driver.');
                return;
            }
            if (draft.driverName && !draft.driverEntryDate) {
                alert('Please set the entry date for the new driver.');
                return;
            }
        }
        if (cleanerChanged) {
            if (bus.attendantName && !draft.cleanerExitDate) {
                alert('Please set the exit date for the previous cleaner.');
                return;
            }
            if (draft.attendantName && !draft.cleanerEntryDate) {
                alert('Please set the entry date for the new cleaner.');
                return;
            }
        }

        const staffChanges = {};
        if (driverChanged) {
            staffChanges.driver = {
                previousName: bus.driverName || null,
                newName: draft.driverName || null,
                exitDate: bus.driverName ? draft.driverExitDate : null,
                entryDate: draft.driverName ? draft.driverEntryDate : null,
                empNo: matchStaffByName(drivers, draft.driverName)?.emp_no || null,
            };
        }
        if (cleanerChanged) {
            staffChanges.cleaner = {
                previousName: bus.attendantName || null,
                newName: draft.attendantName || null,
                exitDate: bus.attendantName ? draft.cleanerExitDate : null,
                entryDate: draft.attendantName ? draft.cleanerEntryDate : null,
                empNo: matchStaffByName(cleaners, draft.attendantName)?.emp_no || null,
            };
        }

        setAssigningStaffBusId(bus._id);
        try {
            const response = await apiFetch(`${API}/buses/${bus._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ staffChanges }),
            });
            if (response.ok) {
                fetchBuses();
            } else {
                const data = await response.json().catch(() => ({}));
                alert(data.message || 'Failed to update staff assignment');
            }
        } catch (error) {
            console.error('Error assigning staff:', error);
            alert('Error updating staff assignment');
        } finally {
            setAssigningStaffBusId(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingId
                ? `${API}/buses/${editingId}`
                : `${API}/buses`;

            const method = editingId ? 'PUT' : 'POST';

            const payload = { ...formData };

            const response = await apiFetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
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
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Bus Management</h2>
                    <p className="text-slate-600 mt-1">Manage buses, routes, and staff assignments.</p>
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
                    Buses ({buses.length})
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab(TABS.mapping)}
                    className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors flex items-center ${activeTab === TABS.mapping ? 'bg-white border border-b-0 border-gray-200 text-blue-700 shadow-sm -mb-px' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <MapPin size={18} className="mr-2" />
                    Bus–Route mapping
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab(TABS.staffMapping)}
                    className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors flex items-center ${activeTab === TABS.staffMapping ? 'bg-white border border-b-0 border-gray-200 text-blue-700 shadow-sm -mb-px' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <UserCheck size={18} className="mr-2" />
                    Bus–Staff assignment
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab(TABS.staff)}
                    className={`px-4 py-2.5 rounded-t-xl text-sm font-medium transition-colors flex items-center ${activeTab === TABS.staff ? 'bg-white border border-b-0 border-gray-200 text-blue-700 shadow-sm -mb-px' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
                >
                    <Users size={18} className="mr-2" />
                    Staff directory
                </button>
            </div>

            {activeTab === TABS.mapping && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800">Assign each bus to a route</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Select a route per bus, set exit and assignment dates when changing, then click Save.</p>
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
                                        <th className="p-4 w-56">Bus Details</th>
                                        <th className="p-4">Capacity</th>
                                        <th className="p-4">Assigned Route</th>
                                        <th className="p-4 w-32">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {buses.map((bus) => {
                                        const draft = routeDrafts[bus._id] || buildRouteDraft(bus);
                                        const routeChanged = hasRouteDraftChanges(bus);
                                        const previousRouteId = bus.assignedRouteId || '';

                                        return (
                                            <React.Fragment key={bus._id}>
                                                <tr className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="p-4">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{bus.busNumber}</p>
                                                            <p className="text-xs text-slate-500">{bus.type}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-slate-600 font-medium">{bus.capacity}</td>
                                                    <td className="p-4">
                                                        <select
                                                            value={draft.routeId}
                                                            onChange={(e) => handleRouteDraftChange(bus._id, e.target.value)}
                                                            disabled={assigningBusId === bus._id}
                                                            className="w-full max-w-xs text-sm rounded-lg border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium text-slate-700 transition-all font-sans"
                                                        >
                                                            <option value="">— Unassigned —</option>
                                                            {routes.map((r) => (
                                                                <option key={r._id} value={r.routeId}>{r.routeName} ({r.routeId})</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRouteSaveClick(bus)}
                                                            disabled={assigningBusId === bus._id || !routeChanged}
                                                            className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                                                        >
                                                            {assigningBusId === bus._id ? 'Saving…' : 'Save'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {routeChanged && (
                                                    <tr className="bg-slate-50/80">
                                                        <td colSpan={4} className="px-4 pb-4 pt-0">
                                                            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                                                                <p className="text-xs font-black text-blue-800 uppercase tracking-wide">Route change details</p>
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    {previousRouteId && (
                                                                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                                                                            <p className="text-xs font-semibold text-amber-800">Previous route</p>
                                                                            <p className="text-sm font-bold text-slate-900">{getRouteLabel(previousRouteId)}</p>
                                                                            <div>
                                                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Exit date</label>
                                                                                <input
                                                                                    type="date"
                                                                                    value={draft.exitDate}
                                                                                    onChange={(e) => handleRouteDraftDateChange(bus._id, 'exitDate', e.target.value)}
                                                                                    className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                    {draft.routeId ? (
                                                                        <div className="rounded-lg border border-blue-200 bg-white p-3 space-y-2">
                                                                            <p className="text-xs font-semibold text-blue-800">New route</p>
                                                                            <p className="text-sm font-bold text-slate-900">{getRouteLabel(draft.routeId)}</p>
                                                                            <div>
                                                                                <label className="block text-xs font-semibold text-slate-600 mb-1">Assignment date</label>
                                                                                <input
                                                                                    type="date"
                                                                                    value={draft.entryDate}
                                                                                    onChange={(e) => handleRouteDraftDateChange(bus._id, 'entryDate', e.target.value)}
                                                                                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="rounded-lg border border-slate-200 bg-white p-3">
                                                                            <p className="text-sm text-slate-600">Route will be unassigned from this bus.</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )
                    }
                </div>
            )}

            {activeTab === TABS.staffMapping && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-semibold text-slate-800">Assign driver and cleaner to each bus</h3>
                        <p className="text-sm text-slate-500 mt-0.5">Select driver and cleaner per bus. Set previous exit date and new entry date when changing, then click Save.</p>
                    </div>
                    {(driversLoading || cleanersLoading) ? (
                        <div className="py-12">
                            <Loader text="Loading staff data..." />
                        </div>
                    ) : buses.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No buses available. Add buses in the Buses tab first.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                        <th className="p-4 w-56">Bus Details</th>
                                        <th className="p-4">Assigned Driver</th>
                                        <th className="p-4">Assigned Cleaner</th>
                                        <th className="p-4 w-32">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {buses.map((bus) => {
                                        const draft = staffDrafts[bus._id] || buildStaffDraft(bus);
                                        const hasChanges = hasStaffDraftChanges(bus);
                                        const driverChanged = normalizeStaffName(draft.driverName) !== normalizeStaffName(bus.driverName);
                                        const cleanerChanged = normalizeStaffName(draft.attendantName) !== normalizeStaffName(bus.attendantName);

                                        return (
                                            <React.Fragment key={bus._id}>
                                                <tr className="hover:bg-blue-50/30 transition-colors">
                                                    <td className="p-4">
                                                        <p className="font-bold text-slate-800">{bus.busNumber}</p>
                                                        <p className="text-xs text-slate-500">{bus.vehicleModel || bus.type}</p>
                                                    </td>
                                                    <td className="p-4">
                                                        <select
                                                            value={draft.driverName}
                                                            onChange={(e) => handleStaffDraftChange(bus._id, 'driverName', e.target.value)}
                                                            disabled={assigningStaffBusId === bus._id}
                                                            className="w-full max-w-xs text-sm rounded-lg border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium text-slate-700"
                                                        >
                                                            <option value="">— Unassigned —</option>
                                                            {withCurrentStaffOption(drivers, draft.driverName).map((d) => (
                                                                <option key={d._id} value={d.employee_name}>{d.employee_name} ({d.emp_no})</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-4">
                                                        <select
                                                            value={draft.attendantName}
                                                            onChange={(e) => handleStaffDraftChange(bus._id, 'attendantName', e.target.value)}
                                                            disabled={assigningStaffBusId === bus._id}
                                                            className="w-full max-w-xs text-sm rounded-lg border border-slate-300 py-2 px-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white font-medium text-slate-700"
                                                        >
                                                            <option value="">— Unassigned —</option>
                                                            {withCurrentStaffOption(cleaners, draft.attendantName).map((c) => (
                                                                <option key={c._id} value={c.employee_name}>{c.employee_name} ({c.emp_no})</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                    <td className="p-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStaffSaveClick(bus)}
                                                            disabled={assigningStaffBusId === bus._id || !hasChanges}
                                                            className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-900 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                                                        >
                                                            {assigningStaffBusId === bus._id ? 'Saving…' : 'Save'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {hasChanges && (
                                                    <tr className="bg-slate-50/80">
                                                        <td colSpan={4} className="px-4 pb-4 pt-0">
                                                            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <p className="text-xs font-black text-slate-600 uppercase tracking-wide">Staff change details</p>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDismissStaffChanges(bus)}
                                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                                                                        title="Close and discard changes"
                                                                        aria-label="Close staff change details"
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                </div>
                                                                {driverChanged && (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {bus.driverName && (
                                                                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                                                                                <p className="text-xs font-semibold text-amber-800">Previous driver</p>
                                                                                <p className="text-sm font-bold text-slate-900">{bus.driverName}</p>
                                                                                <div>
                                                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Exit date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={draft.driverExitDate}
                                                                                        onChange={(e) => handleStaffDraftDateChange(bus._id, 'driverExitDate', e.target.value)}
                                                                                        className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {draft.driverName ? (
                                                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
                                                                                <p className="text-xs font-semibold text-blue-800">New driver</p>
                                                                                <p className="text-sm font-bold text-slate-900">{draft.driverName}</p>
                                                                                <div>
                                                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Entry date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={draft.driverEntryDate}
                                                                                        onChange={(e) => handleStaffDraftDateChange(bus._id, 'driverEntryDate', e.target.value)}
                                                                                        className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                                                <p className="text-sm text-slate-600">Driver will be unassigned.</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {cleanerChanged && (
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                        {bus.attendantName && (
                                                                            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                                                                                <p className="text-xs font-semibold text-amber-800">Previous cleaner</p>
                                                                                <p className="text-sm font-bold text-slate-900">{bus.attendantName}</p>
                                                                                <div>
                                                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Exit date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={draft.cleanerExitDate}
                                                                                        onChange={(e) => handleStaffDraftDateChange(bus._id, 'cleanerExitDate', e.target.value)}
                                                                                        className="w-full px-3 py-2 rounded-lg border border-amber-200 bg-white text-sm"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {draft.attendantName ? (
                                                                            <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 space-y-2">
                                                                                <p className="text-xs font-semibold text-purple-800">New cleaner</p>
                                                                                <p className="text-sm font-bold text-slate-900">{draft.attendantName}</p>
                                                                                <div>
                                                                                    <label className="block text-xs font-semibold text-slate-600 mb-1">Entry date</label>
                                                                                    <input
                                                                                        type="date"
                                                                                        value={draft.cleanerEntryDate}
                                                                                        onChange={(e) => handleStaffDraftDateChange(bus._id, 'cleanerEntryDate', e.target.value)}
                                                                                        className="w-full px-3 py-2 rounded-lg border border-purple-200 bg-white text-sm"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                                                                <p className="text-sm text-slate-600">Cleaner will be unassigned.</p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {activeTab === TABS.staff && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h3 className="font-semibold text-slate-800">Staff directory</h3>
                            <p className="text-sm text-slate-500 mt-0.5">List of all staff members from HRMS.</p>
                        </div>
                        <div className="bg-white p-1 rounded-lg border border-slate-200 flex items-center shadow-sm">
                            <button
                                onClick={() => setStaffSubTab('drivers')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${staffSubTab === 'drivers' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                DRIVERS ({drivers.length})
                            </button>
                            <button
                                onClick={() => setStaffSubTab('cleaners')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${staffSubTab === 'cleaners' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                CLEANERS ({cleaners.length})
                            </button>
                        </div>
                    </div>
                    {(driversLoading || cleanersLoading) ? (
                        <div className="py-20 flex justify-center">
                            <Loader size={40} text="Loading staff data..." />
                        </div>
                    ) : (staffSubTab === 'drivers' ? drivers : cleaners).length === 0 ? (
                        <div className="p-12 text-center text-slate-500">No {staffSubTab} found in HRMS.</div>
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold tracking-wider">
                                        <th className="px-4 py-3">Employee Details</th>
                                        <th className="px-4 py-3">Employee ID</th>
                                        <th className="px-4 py-3">Phone Number</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {(staffSubTab === 'drivers' ? drivers : cleaners).map((staff) => (
                                        <tr key={staff._id} className="hover:bg-blue-50/30 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center">
                                                    <div className={`p-1.5 rounded-lg mr-3 ${staffSubTab === 'drivers' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{staff.employee_name}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase font-black">{staffSubTab === 'drivers' ? 'Driver' : 'Cleaner'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600 font-medium">{staff.emp_no}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{staff.phone_number || <span className="text-slate-400 italic text-xs">--</span>}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex w-fit items-center ${staff.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${staff.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                                    {staff.is_active ? 'Active' : 'Inactive'}
                                                </span>
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
                                            <th className="px-4 py-3 w-56">Bus Details</th>
                                            <th className="px-4 py-3">Model</th>
                                            <th className="px-4 py-3">Reg. Date</th>
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
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-sm">{bus.busNumber}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{bus.type}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600">
                                                    {bus.vehicleModel || <span className="text-slate-400 italic text-xs">--</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                                                    {bus.registrationDate
                                                        ? new Date(bus.registrationDate).toLocaleDateString()
                                                        : <span className="text-slate-400 italic text-xs">--</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-600 font-medium">
                                                    <div className="flex items-center">
                                                        <Armchair size={14} className="text-slate-400 mr-2" />
                                                        {bus.capacity}
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
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 leading-tight">{bus.busNumber}</h3>
                                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mt-0.5">{bus.type}</p>
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
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Vehicle Model</label>
                        <input type="text" name="vehicleModel" value={formData.vehicleModel} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" placeholder="e.g. Ashok Leyland Viking" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Registration</label>
                        <input type="date" name="registrationDate" required value={formData.registrationDate} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" />
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
