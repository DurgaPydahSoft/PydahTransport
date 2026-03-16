import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { Download, CreditCard, History, Users as UsersIcon, Package, Calendar, Tag } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import PassengerReport from '../components/PassengerReport';
import BusPassCard from '../components/BusPassCard';
import Loader from '../components/Loader';

const API = import.meta.env.VITE_API_URL || '';

const BusDetails = () => {
    const { id } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [unassignedPassengers, setUnassignedPassengers] = useState([]);
    const [assignLoading, setAssignLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [fetchingPass, setFetchingPass] = useState(false);
    const [inventoryHistory, setInventoryHistory] = useState([]);
    const [activeTab, setActiveTab] = useState('passengers');
    const [inventoryLoading, setInventoryLoading] = useState(false);

    const componentRef = useRef();
    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Transport-Passenger-Report-${id}`
    });

    const [selectedPassPassenger, setSelectedPassPassenger] = useState(null);
    const passCardRef = useRef();
    const handlePrintPass = useReactToPrint({
        contentRef: passCardRef,
        documentTitle: selectedPassPassenger ? `Bus-Pass-${selectedPassPassenger.admission_number || selectedPassPassenger.emp_no || selectedPassPassenger.admission_no || selectedPassPassenger.empNo}` : 'Bus-Pass'
    });

    const handlePrintPassClick = async (p) => {
        if (fetchingPass) return;
        setFetchingPass(true);
        try {
            const response = await fetch(`${API}/transport-requests/${p.id}/full-details`);
            if (response.ok) {
                const fullPassenger = await response.json();
                setSelectedPassPassenger(fullPassenger);
                setTimeout(() => handlePrintPass(), 150);
            } else {
                alert("Failed to fetch full passenger details for printing.");
            }
        } catch (error) {
            console.error("Error fetching pass details:", error);
            alert("Error preparing bus pass.");
        } finally {
            setFetchingPass(false);
        }
    };

    useEffect(() => {
        const fetchInventory = async () => {
            if (!data?.bus?.busNumber) return;
            setInventoryLoading(true);
            try {
                const response = await fetch(`${API}/inventory/history/${data.bus.busNumber}`);
                if (response.ok) {
                    const json = await response.json();
                    setInventoryHistory(json);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setInventoryLoading(false);
            }
        };

        if (activeTab === 'inventory') {
            fetchInventory();
        }
    }, [data?.bus?.busNumber, activeTab]);

    useEffect(() => {
        const fetchDetails = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const response = await fetch(`${API}/buses/${id}/details`);
                if (response.ok) {
                    const json = await response.json();
                    setData(json);
                } else {
                    setData(null);
                }
            } catch (e) {
                console.error(e);
                setData(null);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const openAssignModal = async () => {
        setAssignModalOpen(true);
        setSelectedIds(new Set());
        if (!data?.bus?.assignedRouteId) {
            setUnassignedPassengers([]);
            return;
        }
        try {
            const response = await fetch(
                `${API}/transport-requests?route_id=${encodeURIComponent(data.bus.assignedRouteId)}&status=approved&bus_id=unassigned`
            );
            const list = await response.json();
            setUnassignedPassengers(Array.isArray(list) ? list : []);
        } catch (e) {
            setUnassignedPassengers([]);
        }
    };

    const handleAssignSelected = async () => {
        if (!data?.bus?.busNumber || selectedIds.size === 0) return;
        setAssignLoading(true);
        try {
            for (const reqId of selectedIds) {
                await fetch(`${API}/transport-requests/${reqId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bus_id: data.bus.busNumber }),
                });
            }
            setAssignModalOpen(false);
            const res = await fetch(`${API}/buses/${id}/details`);
            if (res.ok) setData(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setAssignLoading(false);
        }
    };

    const toggleSelect = (reqId) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(reqId)) next.delete(reqId);
            else next.add(reqId);
            return next;
        });
    };

    if (loading) {
        return (
            <Layout>
                <div className="py-20">
                    <Loader text="Loading bus details..." />
                </div>
            </Layout>
        );
    }

    if (!data?.bus) {
        return (
            <Layout>
                <div className="text-center py-20">
                    <p className="text-gray-500 mb-4">Bus not found.</p>
                    <Link to="/buses" className="text-blue-600 hover:underline">← Back to Bus Fleet</Link>
                </div>
            </Layout>
        );
    }

    const { bus, route, passengers, seatsFilled, seatsAvailable, capacity, occupancyPercent } = data;
    
    const studentCount = passengers.filter(p => !p.user_type || p.user_type === 'student').length;
    const employeeCount = passengers.filter(p => p.user_type === 'employee').length;

    return (
        <Layout>
            <div className="mb-6">
                <Link to="/buses" className="text-blue-600 hover:underline text-sm font-medium">← Back to Bus Fleet</Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-start mb-1">
                        <h1 className="text-2xl font-bold text-gray-900">{bus.busNumber}</h1>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="flex items-center text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-100 transition-colors border border-blue-200"
                        >
                            <Download size={16} className="mr-1.5" />
                            Report
                        </button>
                    </div>
                    <p className="text-gray-500 mb-4">{bus.type} • {bus.status}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">Driver</span>
                            <p className="font-medium text-gray-800">{bus.driverName || '—'}</p>
                        </div>
                        <div>
                            <span className="text-gray-500">Attendant</span>
                            <p className="font-medium text-gray-800">{bus.attendantName || '—'}</p>
                        </div>
                    </div>
                    {route && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <span className="text-gray-500 text-sm">Assigned route</span>
                            <p className="font-semibold text-gray-800">{route.routeName} ({route.routeId})</p>
                            <p className="text-sm text-gray-600">{route.startPoint} → {route.endPoint}</p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Seat occupancy</h2>
                    <div className="flex items-end gap-3 mb-4">
                        <div className="flex-1 bg-gray-100 rounded-xl overflow-hidden h-8">
                            <div
                                className={`h-full rounded-xl transition-all duration-500 ${
                                    occupancyPercent >= 100 ? 'bg-red-500' : occupancyPercent >= 80 ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${Math.min(100, occupancyPercent)}%` }}
                            />
                        </div>
                        <span className="text-2xl font-bold text-gray-900 tabular-nums">{occupancyPercent}%</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-green-50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs">Filled</p>
                            <p className="text-xl font-bold text-green-700">{seatsFilled}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-gray-500 text-xs">Available</p>
                            <p className="text-xl font-bold text-gray-800">{seatsAvailable}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                        <div className="bg-blue-50 rounded-lg p-3">
                            <p className="text-blue-500 text-[10px] font-bold uppercase tracking-wider">Students</p>
                            <p className="text-lg font-bold text-blue-700">{studentCount}</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                            <p className="text-purple-500 text-[10px] font-bold uppercase tracking-wider">Employees</p>
                            <p className="text-lg font-bold text-purple-700">{employeeCount}</p>
                        </div>
                    </div>
                    <p className="text-gray-500 text-xs mt-2">Capacity: {capacity} seats</p>
                    <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Seat map</p>
                        <div className="flex flex-wrap gap-1">
                            {Array.from({ length: capacity }, (_, i) => (
                                <div
                                    key={i}
                                    className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                                        i < seatsFilled ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                                    }`}
                                    title={i < seatsFilled ? `Seat ${i + 1} filled` : 'Empty'}
                                >
                                    {i < seatsFilled ? '•' : ''}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <PassengerReport ref={componentRef} passengers={passengers || []} />

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="border-b border-gray-100 flex">
                    <button
                        onClick={() => setActiveTab('passengers')}
                        className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'passengers' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <UsersIcon size={18} /> Passenger list
                    </button>
                    <button
                        onClick={() => setActiveTab('inventory')}
                        className={`px-6 py-4 text-sm font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'inventory' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                    >
                        <History size={18} /> Inventory History
                    </button>
                </div>

                {activeTab === 'passengers' ? (
                    <>
                        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
                            <h2 className="text-lg font-bold text-gray-800">Passenger list</h2>
                            {route && (
                                <button
                                    type="button"
                                    onClick={openAssignModal}
                                    className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                                >
                                    Assign passengers to this bus
                                </button>
                            )}
                        </div>
                        {passengers.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <p>No passengers assigned to this bus yet.</p>
                                {route && (
                                    <button
                                        type="button"
                                        onClick={openAssignModal}
                                        className="mt-2 text-blue-600 hover:underline font-medium"
                                    >
                                        Assign from approved requests for this route
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                            <th className="p-4">#</th>
                                            <th className="p-4">Type</th>
                                            <th className="p-4">ID Number</th>
                                            <th className="p-4">Name</th>
                                            <th className="p-4">Stage</th>
                                            <th className="p-4">Fare</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {passengers.map((p, i) => (
                                            <tr key={p.id} className="hover:bg-gray-50">
                                                <td className="p-4 text-gray-500">{i + 1}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${p.user_type === 'employee' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {p.user_type || 'student'}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-medium text-gray-600">{p.admission_number || p.emp_no}</td>
                                                <td className="p-4">{p.student_name || p.employee_name}</td>
                                                <td className="p-4">{p.stage_name}</td>
                                                <td className="p-4 text-gray-500">{p.user_type === 'employee' ? 'Free (₹0)' : `₹${p.fare}`}</td>
                                                <td className="p-4 text-right">
                                                    <button
                                                        type="button"
                                                        disabled={fetchingPass}
                                                        onClick={() => handlePrintPassClick(p)}
                                                        className={`p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-all hover:scale-110 ${fetchingPass ? 'animate-pulse opacity-50' : ''}`}
                                                        title="Print Bus Pass"
                                                    >
                                                        <CreditCard size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-6">
                        {inventoryLoading ? (
                            <div className="py-20 flex justify-center"><Loader text="Loading history..." /></div>
                        ) : inventoryHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 border-b border-gray-100 text-[11px] uppercase text-gray-400 font-black tracking-widest">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Item</th>
                                            <th className="px-6 py-4">Quantity</th>
                                            <th className="px-6 py-4">Remarks</th>
                                            <th className="px-6 py-4">Allocated By</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {inventoryHistory.map(record => (
                                            <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-bold">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        {new Date(record.allocatedDate).toLocaleDateString()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Package size={14} className="text-blue-400" />
                                                        <span className="font-bold text-gray-800 text-sm">{record.itemId?.itemName || 'Deleted Item'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="font-black text-blue-700">{record.quantity} {record.itemId?.unit || ''}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500 italic">
                                                    {record.remarks || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                                    {record.adminName}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-100">
                                <History className="mx-auto mb-3 opacity-20" size={48} />
                                <p className="font-medium text-sm">No items have been allocated to this bus yet.</p>
                                <Link to="/inventory" className="mt-4 inline-block text-blue-600 font-bold hover:underline">Go to Inventory Management</Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <BusPassCard ref={passCardRef} passenger={selectedPassPassenger} />

            <Modal isOpen={assignModalOpen} onClose={() => setAssignModalOpen(false)} title="Assign passengers to this bus">
                {!data?.bus?.assignedRouteId ? (
                    <p className="text-gray-500">Assign this bus to a route first (from Bus Fleet).</p>
                ) : unassignedPassengers.length === 0 ? (
                    <p className="text-gray-500">No unassigned approved passengers for this route.</p>
                ) : (
                    <>
                        <p className="text-sm text-gray-600 mb-4">Select approved passengers for route <strong>{route?.routeName}</strong> to assign to this bus.</p>
                        <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-xl divide-y divide-gray-100">
                            {unassignedPassengers.map((req) => (
                                <label
                                    key={req.id}
                                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 ${selectedIds.has(req.id) ? 'bg-blue-50' : ''}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(req.id)}
                                        onChange={() => toggleSelect(req.id)}
                                        className="rounded text-blue-600"
                                    />
                                    <span className="font-medium">{req.student_name}</span>
                                    <span className="text-gray-500 text-sm">{req.admission_number}</span>
                                    <span className="text-gray-400 text-sm">{req.stage_name}</span>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={handleAssignSelected}
                                disabled={assignLoading || selectedIds.size === 0}
                                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
                            >
                                {assignLoading ? 'Assigning…' : `Assign ${selectedIds.size} passenger(s)`}
                            </button>
                            <button
                                type="button"
                                onClick={() => setAssignModalOpen(false)}
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

export default BusDetails;
