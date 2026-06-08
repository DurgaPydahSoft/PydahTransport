import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { 
    Package, Plus, Search, Edit, Trash2, History, Truck, 
    Calendar, Tag, User, Layers, Printer, ChevronDown, 
    ChevronUp, LayoutGrid, List, AlertCircle, Filter 
} from 'lucide-react';
import BillPrint from '../components/BillPrint';
import { apiFetch, API_BASE } from '../utils/api';

const API = API_BASE;

const TABS = { inventory: 'inventory', history: 'history', vendors: 'vendors', tyreRegistry: 'tyreRegistry' };

const CATEGORIES = [
    'General',
    'Mechanical',
    'Electrical',
    'Tires', // Note: Category name used in logic
    'Lubricants',
    'Body & Interior',
    'Safety',
    'Cleaning'
];

const TYRE_POSITIONS = [
    'front right',
    'front left',
    'back right',
    'back left',
    'rear left',
    'rear right'
];

const UNITS = [
    'Pcs',
    'Ltr',
    'Kg',
    'Set',
    'Box',
    'Mtr',
    'Can'
];

const Inventory = () => {
    const [activeTab, setActiveTab] = useState(TABS.inventory);
    const [items, setItems] = useState([]);
    const [history, setHistory] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [tyreRegistry, setTyreRegistry] = useState([]);
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [vendorsLoading, setVendorsLoading] = useState(false);
    const [registryLoading, setRegistryLoading] = useState(false);
    
    // Modals
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isBillModalOpen, setIsBillModalOpen] = useState(false);
    const [printBill, setPrintBill] = useState(null);
    const [inventoryView, setInventoryView] = useState('card'); // 'card' or 'table'
    
    const [editingItem, setEditingItem] = useState(null);
    const [editingVendor, setEditingVendor] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBusFilter, setSelectedBusFilter] = useState('all');

    const [itemFormData, setItemFormData] = useState({
        itemName: '',
        category: 'General',
        unit: 'Pcs',
        description: ''
    });

    const [billFormData, setBillFormData] = useState({
        busId: '',
        vendorId: '',
        billNo: '',
        items: [{
            itemId: '',
            quantity: 1,
            price: '',
            remarks: '',
            tyrePosition: 'front right',
            kmReading: '',
            tyreType: 'new tyre'
        }]
    });

    const addBillItem = () => {
        setBillFormData({
            ...billFormData,
            items: [...billFormData.items, {
                itemId: '',
                quantity: 1,
                price: '',
                remarks: '',
                tyrePosition: 'front right',
                kmReading: '',
                tyreType: 'new tyre'
            }]
        });
    };

    const removeBillItem = (index) => {
        if (billFormData.items.length <= 1) return;
        const newItems = [...billFormData.items];
        newItems.splice(index, 1);
        setBillFormData({ ...billFormData, items: newItems });
    };

    const updateBillItem = (index, field, value) => {
        const newItems = [...billFormData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setBillFormData({ ...billFormData, items: newItems });
    };

    const toggleItemInBill = (index, itemId) => {
        const newItems = [...billFormData.items];
        const itemIds = [...newItems[index].itemIds];
        const itemIdx = itemIds.indexOf(itemId);
        if (itemIdx > -1) {
            itemIds.splice(itemIdx, 1);
        } else {
            itemIds.push(itemId);
        }
        newItems[index].itemIds = itemIds;
        setBillFormData({ ...billFormData, items: newItems });
    };

    const [vendorFormData, setVendorFormData] = useState({
        name: '',
        contactPerson: '',
        phone: '',
        email: '',
        address: ''
    });

    useEffect(() => {
        fetchItems();
        fetchBuses();
        fetchVendors();
    }, []);

    useEffect(() => {
        if (activeTab === TABS.history) {
            fetchHistory(selectedBusFilter);
        } else if (activeTab === TABS.vendors) {
            fetchVendors();
        } else if (activeTab === TABS.tyreRegistry) {
            fetchTyreRegistry(selectedBusFilter);
        }
    }, [activeTab, selectedBusFilter]);

    // Fetch history for modal reference when bus is selected
    useEffect(() => {
        if (isBillModalOpen && billFormData.busId) {
            fetchHistory(billFormData.busId);
        }
    }, [isBillModalOpen, billFormData.busId]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await apiFetch(`${API}/inventory`);
            const data = await response.json();
            setItems(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBuses = async () => {
        try {
            const response = await apiFetch(`${API}/buses`);
            const data = await response.json();
            setBuses(data);
        } catch (error) {
            console.error('Error fetching buses:', error);
        }
    };

    const fetchVendors = async () => {
        setVendorsLoading(true);
        try {
            const response = await apiFetch(`${API}/inventory/vendors`);
            const data = await response.json();
            setVendors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        } finally {
            setVendorsLoading(false);
        }
    };

    const fetchTyreRegistry = async (busId) => {
        setRegistryLoading(true);
        try {
            const url = busId === 'all' ? `${API}/inventory/tyre-registry` : `${API}/inventory/tyre-registry/${busId}`;
            const response = await apiFetch(url);
            const data = await response.json();
            setTyreRegistry(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching tyre registry:', error);
        } finally {
            setRegistryLoading(false);
        }
    };

    const fetchHistory = async (busId) => {
        setHistoryLoading(true);
        try {
            const url = busId === 'all' ? `${API}/inventory/history` : `${API}/inventory/history/${busId}`;
            const response = await apiFetch(url);
            const data = await response.json();
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleItemSubmit = async (e) => {
        e.preventDefault();
        const url = editingItem ? `${API}/inventory/${editingItem._id}` : `${API}/inventory`;
        const method = editingItem ? 'PUT' : 'POST';

        try {
            const response = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemFormData)
            });

            if (response.ok) {
                fetchItems();
                setIsModalOpen(false);
                setEditingItem(null);
                setItemFormData({ itemName: '', category: 'General', unit: 'Pcs', description: '' });
            }
        } catch (error) {
            console.error('Error saving item:', error);
        }
    };

    const handleVendorSubmit = async (e) => {
        e.preventDefault();
        const url = editingVendor ? `${API}/inventory/vendors/${editingVendor._id}` : `${API}/inventory/vendors`;
        const method = editingVendor ? 'PUT' : 'POST';

        try {
            const response = await apiFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vendorFormData)
            });

            if (response.ok) {
                fetchVendors();
                setIsVendorModalOpen(false);
                setEditingVendor(null);
                setVendorFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' });
            }
        } catch (error) {
            console.error('Error saving vendor:', error);
        }
    };

    const handleBillSubmit = async (e) => {
        e.preventDefault();
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        const payload = {
            busId: billFormData.busId,
            vendorId: billFormData.vendorId,
            billNo: billFormData.billNo,
            adminName: adminInfo.name || adminInfo.username || 'Admin',
            items: billFormData.items.map(item => ({
                ...item,
                itemIds: [item.itemId] // Wrap in array for backend compatibility
            }))
        };

        try {
            const response = await apiFetch(`${API}/inventory/raise-bill`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchItems();
                setIsBillModalOpen(false);
                setBillFormData({ 
                    busId: '',
                    vendorId: '',
                    billNo: '',
                    items: [{
                        itemId: '', quantity: 1, price: '', 
                        remarks: '', tyrePosition: 'front right', kmReading: '', tyreType: 'new tyre' 
                    }]
                });
                if (activeTab === TABS.history) fetchHistory(selectedBusFilter);
                if (activeTab === TABS.tyreRegistry) fetchTyreRegistry(selectedBusFilter);
                alert('Bill raised and assigned to bus successfully!');
            } else {
                const data = await response.json();
                alert(data.message || 'Failed to raise bill');
            }
        } catch (error) {
            console.error('Error raising bill:', error);
        }
    };

    const handlePrint = (billData) => {
        setPrintBill(billData);
        setTimeout(() => {
            window.print();
        }, 800);
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            const response = await apiFetch(`${API}/inventory/${id}`, { method: 'DELETE' });
            if (response.ok) {
                fetchItems();
            } else {
                const data = await response.json();
                alert(data.message || 'Delete failed');
            }
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setItemFormData({
            itemName: item.itemName,
            category: item.category,
            totalQuantity: item.totalQuantity,
            unit: item.unit,
            description: item.description
        });
        setIsModalOpen(true);
    };

    const filteredItems = items.filter(item => 
        item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getLastPrice = (itemId) => {
        if (!history || history.length === 0) return null;
        // Find the most recent allocation for this itemId in history
        const lastAllocation = history.find(h => (h.itemId?._id || h.itemId) === itemId);
        return lastAllocation ? lastAllocation.price : null;
    };

    const calculateGrandTotal = () => {
        return billFormData.items.reduce((sum, item) => sum + (item.quantity * (item.price || 0)), 0);
    };

    const getGroupedBills = () => {
        if (!history || history.length === 0) return [];
        
        const groups = history.reduce((acc, record) => {
            const billKey = record.billNo || `no-bill-${record._id}`;
            if (!acc[billKey]) {
                acc[billKey] = {
                    billNo: record.billNo,
                    date: record.allocatedDate,
                    vendorId: record.vendorId,
                    busId: record.busId,
                    adminName: record.adminName,
                    items: [],
                    totalAmount: 0
                };
            }
            acc[billKey].items.push(record);
            acc[billKey].totalAmount += (record.quantity * record.price);
            return acc;
        }, {});

        return Object.values(groups);
    };

    const groupedBills = getGroupedBills();

    return (
        <Layout>
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-3">
                        <Package className="text-blue-600" size={32} />
                        Bus Inventory
                    </h2>
                    <p className="text-slate-500 mt-1">Manage parts, supplies, and their allocation to the fleet.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button 
                        onClick={() => { setEditingItem(null); setItemFormData({ itemName: '', category: 'General', unit: 'Pcs', description: '' }); setIsModalOpen(true); }}
                        className="bg-gray-800 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-gray-700 transition-all shadow-sm active:scale-95"
                    >
                        <Plus size={16} /> Add Item
                    </button>
                    <button 
                        onClick={() => setIsBillModalOpen(true)}
                        className="bg-emerald-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-emerald-800 transition-all shadow-sm active:scale-95"
                    >
                        <Truck size={16} /> Raise Bill
                    </button>
                    <button 
                        onClick={() => setActiveTab(TABS.tyreRegistry)}
                        className="bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-blue-800 transition-all shadow-sm active:scale-95"
                    >
                        <Layers size={16} /> Tyre Registry
                    </button>
                    <button 
                        onClick={() => { setEditingVendor(null); setVendorFormData({ name: '', contactPerson: '', phone: '', email: '', address: '' }); setIsVendorModalOpen(true); }}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-all border border-gray-300"
                    >
                        <Plus size={16} /> Manage Vendors
                    </button>
                </div>
            </div>

            <div className="flex bg-gray-100 p-1 rounded border border-gray-200 mb-6 w-fit">
                <button
                    onClick={() => setActiveTab(TABS.inventory)}
                    className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === TABS.inventory ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Layers size={14} /> Master Inventory
                </button>
                <button
                    onClick={() => setActiveTab(TABS.history)}
                    className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === TABS.history ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <History size={14} /> Bills
                </button>
                <button
                    onClick={() => setActiveTab(TABS.vendors)}
                    className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === TABS.vendors ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Package size={14} /> Vendors
                </button>
                <button
                    onClick={() => setActiveTab(TABS.tyreRegistry)}
                    className={`px-4 py-2 rounded text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === TABS.tyreRegistry ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    <Truck size={14} /> Tyre Registry
                </button>
            </div>

            {activeTab === TABS.inventory && (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or category..."
                                    className="w-full pl-11 pr-4 py-3 rounded-md border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 shrink-0">
                                <button 
                                    onClick={() => setInventoryView('card')}
                                    className={`p-2 rounded-md transition-all ${inventoryView === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Card View"
                                >
                                    <LayoutGrid size={20} />
                                </button>
                                <button 
                                    onClick={() => setInventoryView('table')}
                                    className={`p-2 rounded-md transition-all ${inventoryView === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                                    title="Table View"
                                >
                                    <List size={20} />
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 flex justify-center"><Loader text="Loading inventory..." /></div>
                        ) : filteredItems.length > 0 ? (
                            inventoryView === 'table' ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase text-slate-400 font-black tracking-widest">
                                                <th className="px-6 py-4">Item Details</th>
                                                <th className="px-6 py-4">Description</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredItems.map(item => (
                                                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-6 py-5">
                                                        <div>
                                                            <p className="font-bold text-slate-800">{item.itemName}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{item.category}</span>
                                                                <span className="text-[10px] text-slate-400 font-medium">| {item.unit}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <p className="text-sm text-slate-500 line-clamp-1">{item.description || 'No description'}</p>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button onClick={() => openEditModal(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"><Edit size={16} /></button>
                                                            <button onClick={() => handleDeleteItem(item._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"><Trash2 size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    {filteredItems.map(item => (
                                        <div key={item._id} className="group relative bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all p-5 flex flex-col justify-between overflow-hidden">
                                            {/* Accent Banner */}
                                            <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                            
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="p-2.5 bg-slate-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                                                        <Package className="text-slate-400 group-hover:text-blue-600 transition-colors" size={24} />
                                                    </div>
                                                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase tracking-widest">{item.category}</span>
                                                </div>
                                                
                                                <h3 className="text-lg font-black text-slate-900 leading-tight uppercase group-hover:text-blue-700 transition-colors line-clamp-1">{item.itemName}</h3>
                                                <div className="mt-2 text-xs font-black text-slate-400 uppercase tracking-tighter flex items-center gap-1.5 pt-2 border-t border-slate-50">
                                                    Measured In: <span className="text-slate-800">{item.unit}</span>
                                                </div>
                                                
                                                <p className="mt-4 text-xs font-medium text-slate-500 line-clamp-2 italic leading-relaxed h-8">
                                                    {item.description || 'No detailed description provided for this item.'}
                                                </p>
                                            </div>

                                            <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => openEditModal(item)}
                                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Edit Item"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteItem(item._id)}
                                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Delete Item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <span className="text-[10px] font-black text-slate-300 uppercase italic">Ref: #{item._id.slice(-4)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-lg border-2 border-dashed border-slate-100">
                                <AlertCircle className="mx-auto mb-3 opacity-20" size={48} />
                                <p className="font-medium">No items found matching your search.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === TABS.history && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                        <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 p-1 rounded-md border border-slate-100">
                            <Filter size={18} className="ml-3 text-slate-400" />
                            <select 
                                className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 pr-8"
                                value={selectedBusFilter}
                                onChange={(e) => setSelectedBusFilter(e.target.value)}
                            >
                                <option value="all">All Fleet Activity</option>
                                {buses.map(b => (
                                    <option key={b._id} value={b.busNumber}>{b.busNumber} ({b.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {historyLoading ? (
                        <div className="py-20 flex justify-center"><Loader text="Fetching history..." /></div>
                    ) : history.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-left text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                        <th className="px-6 py-4">Bill Date</th>
                                        <th className="px-6 py-4">Bill No</th>
                                        <th className="px-6 py-4">Vendor & Bus</th>
                                        <th className="px-6 py-4">Items Summary</th>
                                        <th className="px-6 py-4">Total Amount</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {groupedBills.map(bill => (
                                        <tr key={bill.billNo || bill.date} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(bill.date).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <span className="text-xs font-black text-blue-600 uppercase tracking-tighter">#{bill.billNo || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 text-sm">{bill.vendorId?.name || 'Unknown'}</span>
                                                    <span className="text-[10px] text-slate-400 font-black uppercase mt-0.5">Bus: {bill.busId?.busNumber || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                    {bill.items.map((item, idx) => (
                                                        <span key={idx} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                                                            {item.itemId?.itemName} ({item.quantity})
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-blue-700">₹{bill.totalAmount}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">{bill.items.length} item(s)</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button 
                                                    onClick={() => handlePrint(bill)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                                                    title="Print Full Bill"
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-slate-400">No allocation history available.</div>
                    )}
                </div>
            )}

            {activeTab === TABS.vendors && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                    {vendorsLoading ? (
                        <div className="py-20 flex justify-center"><Loader text="Fetching vendors..." /></div>
                    ) : vendors.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase text-slate-400 font-black tracking-widest">
                                        <th className="px-6 py-4">Vendor Name</th>
                                        <th className="px-6 py-4">Contact Person</th>
                                        <th className="px-6 py-4">Phone / Email</th>
                                        <th className="px-6 py-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {vendors.map(v => (
                                        <tr key={v._id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-6 py-5 font-bold text-slate-800 text-sm">{v.name}</td>
                                            <td className="px-6 py-5 text-sm text-slate-600 font-medium">{v.contactPerson}</td>
                                            <td className="px-6 py-5 text-sm text-slate-500">
                                                <div>{v.phone}</div>
                                                <div className="text-xs opacity-60">{v.email}</div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button onClick={() => { setEditingVendor(v); setVendorFormData(v); setIsVendorModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"><Edit size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-slate-400">No vendors found.</div>
                    )}
                </div>
            )}

            {activeTab === TABS.tyreRegistry && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                        <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 p-1 rounded-md border border-slate-100">
                            <Filter size={18} className="ml-3 text-slate-400" />
                            <select 
                                className="bg-transparent border-none outline-none text-sm font-bold text-slate-700 pr-8"
                                value={selectedBusFilter}
                                onChange={(e) => setSelectedBusFilter(e.target.value)}
                            >
                                <option value="all">All Fleet Tyres</option>
                                {buses.map(b => (
                                    <option key={b._id} value={b.busNumber}>{b.busNumber} ({b.type})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {registryLoading ? (
                        <div className="py-20 flex justify-center"><Loader text="Fetching registry..." /></div>
                    ) : tyreRegistry.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase text-slate-400 font-black tracking-widest">
                                        <th className="px-6 py-4">Bus</th>
                                        <th className="px-6 py-4">Position</th>
                                        <th className="px-6 py-4">Type</th>
                                        <th className="px-6 py-4">Install KM</th>
                                        <th className="px-6 py-4">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {tyreRegistry.map(reg => (
                                        <tr key={reg._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-5"><span className="font-black text-slate-900 text-xs px-2 py-1 bg-slate-100 rounded-lg">{reg.busId?.busNumber || 'N/A'}</span></td>
                                            <td className="px-6 py-5 uppercase font-bold text-xs text-blue-600">{reg.position}</td>
                                            <td className="px-6 py-5 text-sm">
                                                <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase ${reg.tyreType === 'new tyre' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                                    {reg.tyreType}
                                                </span>
                                            </td>
                                            <td className="px-6 py-5 text-sm font-bold text-slate-700">{reg.installKm} KM</td>
                                            <td className="px-6 py-5 text-xs text-slate-400">{new Date(reg.updatedAt).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-20 text-center text-slate-400">No active tyres found in registry.</div>
                    )}
                </div>
            )}

            {/* Item Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
            >
                <form onSubmit={handleItemSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Item Name</label>
                        <input
                            required
                            type="text"
                            placeholder="e.g. Engine Oil, Front Tire"
                            className="w-full px-4 py-3 rounded-md border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            value={itemFormData.itemName}
                            onChange={(e) => setItemFormData({ ...itemFormData, itemName: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Category</label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-md border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium bg-white"
                                value={itemFormData.category}
                                onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                            >
                                {CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Unit</label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-md border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium bg-white"
                                value={itemFormData.unit}
                                onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                            >
                                {UNITS.map(unit => (
                                    <option key={unit} value={unit}>{unit}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Description</label>
                        <textarea
                            rows="2"
                            placeholder="Optional notes..."
                            className="w-full px-4 py-3 rounded-md border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            value={itemFormData.description}
                            onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-md border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-3 rounded-md bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">Save Item</button>
                    </div>
                </form>
            </Modal>


            {/* Vendor Modal */}
            <Modal
                isOpen={isVendorModalOpen}
                onClose={() => setIsVendorModalOpen(false)}
                title={editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
            >
                <form onSubmit={handleVendorSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1">Vendor Name</label>
                        <input required className="w-full px-4 py-2 rounded-md border border-slate-200" value={vendorFormData.name} onChange={e => setVendorFormData({...vendorFormData, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1">Contact Person</label>
                        <input className="w-full px-4 py-2 rounded-md border border-slate-200" value={vendorFormData.contactPerson} onChange={e => setVendorFormData({...vendorFormData, contactPerson: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-1">Phone</label>
                            <input className="w-full px-4 py-2 rounded-md border border-slate-200" value={vendorFormData.phone} onChange={e => setVendorFormData({...vendorFormData, phone: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-1">Email</label>
                            <input type="email" className="w-full px-4 py-2 rounded-md border border-slate-200" value={vendorFormData.email} onChange={e => setVendorFormData({...vendorFormData, email: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-1">Address</label>
                        <textarea className="w-full px-4 py-2 rounded-md border border-slate-200" value={vendorFormData.address} onChange={e => setVendorFormData({...vendorFormData, address: e.target.value})} />
                    </div>
                    <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-md hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        {editingVendor ? 'Update Vendor' : 'Save Vendor'}
                    </button>
                </form>
            </Modal>

            {/* Raise Bill Modal */}
            <Modal
                isOpen={isBillModalOpen}
                onClose={() => setIsBillModalOpen(false)}
                title="Raise Invoice & Allocate"
                maxWidth="max-w-7xl"
            >
                <form onSubmit={handleBillSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Left Side: Form Inputs */}
                        <div className="lg:col-span-8 space-y-6">
                            {/* Header Section: Bus, Vendor, Bill No */}
                            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">1. Select Bus</label>
                                    <select 
                                        required 
                                        className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                                        value={billFormData.busId} 
                                        onChange={e => setBillFormData({...billFormData, busId: e.target.value})}
                                    >
                                        <option value="">-- Choose Bus --</option>
                                        {buses.map(b => (
                                            <option key={b._id} value={b.busNumber}>{b.busNumber} ({b.type})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">2. Select Vendor</label>
                                    <select 
                                        required 
                                        className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                                        value={billFormData.vendorId} 
                                        onChange={e => setBillFormData({...billFormData, vendorId: e.target.value})}
                                    >
                                        <option value="">-- Choose Vendor --</option>
                                        {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 mb-2 uppercase">Bill Number</label>
                                    <input 
                                        type="text" required
                                        placeholder="Invoice or Bill No"
                                        className="w-full px-4 py-2.5 rounded border border-gray-300 bg-white font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all" 
                                        value={billFormData.billNo} 
                                        onChange={e => setBillFormData({...billFormData, billNo: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div className="max-h-[50vh] overflow-y-auto space-y-4 pr-1">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-tight">3. Items to Allocate</h4>
                                    <span className="text-[10px] font-black bg-gray-900 text-white px-3 py-1 rounded-full uppercase">{billFormData.items.length} row(s)</span>
                                </div>
                                
                                {billFormData.items.map((lineItem, index) => (
                                    <div key={index} className="relative p-6 bg-white rounded-lg border border-gray-200 shadow-sm transition-all mb-4 hover:border-blue-200">
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                            {/* Item Selection */}
                                            <div className="md:col-span-5">
                                                <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Select Item</label>
                                                <select 
                                                    required 
                                                    className="w-full px-4 py-2 rounded border border-gray-200 bg-white text-sm font-medium text-gray-700 focus:border-blue-500 outline-none" 
                                                    value={lineItem.itemId} 
                                                    onChange={e => updateBillItem(index, 'itemId', e.target.value)}
                                                >
                                                    <option value="">-- Choose Item --</option>
                                                    {items.map(item => (
                                                        <option key={item._id} value={item._id}>
                                                            {item.itemName} ({item.category})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Qty & Price */}
                                            <div className="md:col-span-7 grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide">
                                                        Quantity {lineItem.itemId && `(${items.find(i => i._id === lineItem.itemId)?.unit || 'Pcs'})`}
                                                    </label>
                                                    <input 
                                                        required type="number" min="1" 
                                                        className="w-full px-4 py-2 rounded border border-gray-200 bg-white text-sm font-medium" 
                                                        value={lineItem.quantity} 
                                                        onChange={e => updateBillItem(index, 'quantity', parseInt(e.target.value))} 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-gray-500 mb-1.5 uppercase tracking-wide flex justify-between">
                                                        Unit Price
                                                        {lineItem.itemId && getLastPrice(lineItem.itemId) && (
                                                            <span className="text-blue-600 font-bold lowercase italic opacity-80">
                                                                Last: ₹{getLastPrice(lineItem.itemId)}
                                                            </span>
                                                        )}
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">₹</span>
                                                        <input 
                                                            required type="number" 
                                                            className="w-full pl-7 pr-4 py-2 rounded border border-gray-200 bg-white text-sm font-medium" 
                                                            value={lineItem.price} 
                                                            onChange={e => updateBillItem(index, 'price', e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tyre Details */}
                                        {lineItem.itemId && items.find(i => i._id === lineItem.itemId)?.category === 'Tires' && (
                                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded border border-gray-100 italic">
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Position</label>
                                                    <select
                                                        className="w-full px-3 py-1.5 rounded border border-gray-200 text-xs bg-white font-bold"
                                                        value={lineItem.tyrePosition}
                                                        onChange={(e) => updateBillItem(index, 'tyrePosition', e.target.value)}
                                                    >
                                                        {TYRE_POSITIONS.map(p => <option key={p} value={p}>{p.toUpperCase()}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Type</label>
                                                    <select
                                                        className="w-full px-3 py-1.5 rounded border border-gray-200 text-xs bg-white font-bold"
                                                        value={lineItem.tyreType}
                                                        onChange={(e) => updateBillItem(index, 'tyreType', e.target.value)}
                                                    >
                                                        <option value="new tyre">New Tyre</option>
                                                        <option value="old tyre">Old Tyre</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">Reading (KM)</label>
                                                    <input
                                                        type="number"
                                                        className="w-full px-3 py-1.5 rounded border border-gray-200 text-xs bg-white font-bold"
                                                        value={lineItem.kmReading}
                                                        onChange={(e) => updateBillItem(index, 'kmReading', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="mt-4 flex items-center gap-3">
                                            <div className="flex-1">
                                                <input 
                                                    type="text" 
                                                    placeholder="Add remarks for this item..."
                                                    className="w-full px-4 py-2 rounded border border-gray-100 bg-gray-50/50 text-xs text-gray-600 focus:bg-white transition-all outline-none focus:border-blue-200" 
                                                    value={lineItem.remarks} 
                                                    onChange={e => updateBillItem(index, 'remarks', e.target.value)} 
                                                />
                                            </div>
                                            {billFormData.items.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeBillItem(index)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    title="Remove this item"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={addBillItem}
                                    className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded border-2 border-dashed border-gray-300 text-gray-400 font-bold hover:bg-gray-50 hover:border-gray-400 transition-all text-xs uppercase tracking-widest"
                                >
                                    <Plus size={16} /> Add Another Item Row
                                </button>
                            </div>
                        </div>

                        {/* Right Side: Invoice Summary (Preview) */}
                        <div className="lg:col-span-4 sticky top-0 space-y-6">
                            <div className="bg-white rounded-lg border-2 border-blue-600 shadow-lg overflow-hidden flex flex-col h-full max-h-[70vh]">
                                <div className="bg-blue-600 text-white p-4">
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                                        <History size={16} className="text-white/80" /> Invoice Summary
                                    </h3>
                                </div>
                                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                                    {billFormData.items.map((line, idx) => {
                                        const item = items.find(i => i._id === line.itemId);
                                        if (!item && !line.itemId) return null;
                                        return (
                                            <div key={idx} className="flex justify-between items-start gap-4 border-b border-gray-100 pb-3">
                                                <div className="flex-1">
                                                    <div className="text-xs font-bold text-gray-800 truncate" title={item?.itemName}>{item?.itemName || 'Unselected Item'}</div>
                                                    <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                                                        <span>{line.quantity} {item?.unit || 'Pcs'}</span>
                                                        <span>•</span>
                                                        <span>₹{line.price || 0}</span>
                                                    </div>
                                                </div>
                                                <div className="text-xs font-black text-blue-700">
                                                    ₹{line.quantity * (line.price || 0)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {billFormData.items.every(i => !i.itemId) && (
                                        <div className="py-12 text-center text-gray-300 italic text-xs">
                                            No items added yet to the invoice.
                                        </div>
                                    )}
                                </div>
                                <div className="p-6 bg-blue-50/50 border-t border-blue-100">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Total Amount</span>
                                        <span className="text-2xl font-black text-blue-700 italic">₹{calculateGrandTotal()}</span>
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="w-full bg-blue-600 text-white font-black py-4 rounded hover:bg-blue-700 transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 uppercase text-xs tracking-widest"
                                    >
                                        <Truck size={18} /> Submit Invoice
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Hidden Print Area */}
            <div className="hidden print:block absolute top-0 left-0 w-full">
                {printBill && (
                    <div id="print-container">
                        <BillPrint 
                            billData={printBill} 
                            vendor={vendors.find(v => (v._id?.toString() || v._id) === (printBill.vendorId?._id?.toString() || printBill.vendorId?.toString() || printBill.vendorId))}
                            bus={buses.find(b => b.busNumber === (printBill.busId?.busNumber || printBill.busId))}
                        />
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Inventory;
