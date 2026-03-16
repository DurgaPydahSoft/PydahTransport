import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import {
    Package,
    History,
    Plus,
    Truck,
    Search,
    Filter,
    ArrowRight,
    Edit,
    Trash2,
    Calendar,
    Tag,
    Layers,
    AlertCircle
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

const TABS = { inventory: 'inventory', history: 'history' };

const CATEGORIES = [
    'General',
    'Mechanical',
    'Electrical',
    'Tires',
    'Lubricants',
    'Body & Interior',
    'Safety',
    'Cleaning'
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
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllocateModalOpen, setIsAllocateModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedBusFilter, setSelectedBusFilter] = useState('all');

    const [itemFormData, setItemFormData] = useState({
        itemName: '',
        category: 'General',
        totalQuantity: '',
        unit: 'Pcs',
        description: ''
    });

    const [allocateFormData, setAllocateFormData] = useState({
        itemId: '',
        busId: '',
        quantity: '',
        remarks: ''
    });

    useEffect(() => {
        fetchItems();
        fetchBuses();
    }, []);

    useEffect(() => {
        if (activeTab === TABS.history) {
            fetchHistory(selectedBusFilter);
        }
    }, [activeTab, selectedBusFilter]);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API}/inventory`);
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
            const response = await fetch(`${API}/buses`);
            const data = await response.json();
            setBuses(data);
        } catch (error) {
            console.error('Error fetching buses:', error);
        }
    };

    const fetchHistory = async (busId) => {
        setHistoryLoading(true);
        try {
            const url = busId === 'all' ? `${API}/inventory/history` : `${API}/inventory/history/${busId}`;
            const response = await fetch(url);
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
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemFormData)
            });

            if (response.ok) {
                fetchItems();
                setIsModalOpen(false);
                setEditingItem(null);
                setItemFormData({ itemName: '', category: 'General', totalQuantity: '', unit: 'Pcs', description: '' });
            }
        } catch (error) {
            console.error('Error saving item:', error);
        }
    };

    const handleAllocateSubmit = async (e) => {
        e.preventDefault();
        const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
        const payload = {
            ...allocateFormData,
            adminName: adminInfo.name || adminInfo.username || 'Admin'
        };

        try {
            const response = await fetch(`${API}/inventory/allocate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchItems();
                setIsAllocateModalOpen(false);
                setAllocateFormData({ itemId: '', busId: '', quantity: '', remarks: '' });
                if (activeTab === TABS.history) fetchHistory(selectedBusFilter);
                alert('Allocation successful!');
            } else {
                const data = await response.json();
                alert(data.message || 'Allocation failed');
            }
        } catch (error) {
            console.error('Error allocating item:', error);
        }
    };

    const handleDeleteItem = async (id) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;
        try {
            const response = await fetch(`${API}/inventory/${id}`, { method: 'DELETE' });
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
                <div className="flex gap-2">
                    <button 
                        onClick={() => { setEditingItem(null); setItemFormData({ itemName: '', category: 'General', totalQuantity: '', unit: 'Pcs', description: '' }); setIsModalOpen(true); }}
                        className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95"
                    >
                        <Plus size={18} /> Add Item
                    </button>
                    <button 
                        onClick={() => setIsAllocateModalOpen(true)}
                        className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md active:scale-95 border border-blue-500"
                    >
                        <Truck size={18} /> Allocate to Bus
                    </button>
                </div>
            </div>

            <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 mb-8 w-fit">
                <button
                    onClick={() => setActiveTab(TABS.inventory)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === TABS.inventory ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <Layers size={18} /> Master Inventory
                </button>
                <button
                    onClick={() => setActiveTab(TABS.history)}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === TABS.history ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    <History size={18} /> Allocation history
                </button>
            </div>

            {activeTab === TABS.inventory && (
                <>
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-8">
                        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                            <div className="relative w-full md:w-96 group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search by name or category..."
                                    className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-sm font-medium"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 flex justify-center"><Loader text="Loading inventory..." /></div>
                        ) : filteredItems.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase text-slate-400 font-black tracking-widest">
                                            <th className="px-6 py-4">Item Details</th>
                                            <th className="px-6 py-4">Total Stock</th>
                                            <th className="px-6 py-4">Available</th>
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
                                                    <span className="font-medium text-slate-600">{item.totalQuantity}</span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${item.availableQuantity < 5 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {item.availableQuantity}
                                                        </span>
                                                        <div className="flex-1 max-w-[100px] h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full rounded-full ${item.availableQuantity < 5 ? 'bg-red-400' : 'bg-emerald-400'}`}
                                                                style={{ width: `${(item.availableQuantity / item.totalQuantity) * 100}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => openEditModal(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit size={16} /></button>
                                                        <button onClick={() => handleDeleteItem(item._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-slate-400 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-100">
                                <AlertCircle className="mx-auto mb-3 opacity-20" size={48} />
                                <p className="font-medium">No items found matching your search.</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {activeTab === TABS.history && (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
                        <div className="flex items-center gap-3 w-full md:w-auto bg-slate-50 p-1 rounded-2xl border border-slate-100">
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
                                    <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase text-slate-400 font-black tracking-widest">
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Item</th>
                                        <th className="px-6 py-4">Bus</th>
                                        <th className="px-6 py-4">Quantity</th>
                                        <th className="px-6 py-4">Allocated By</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {history.map(record => (
                                        <tr key={record._id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-5 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                                                    <Calendar size={14} className="text-slate-400" />
                                                    {new Date(record.allocatedDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-2">
                                                    <Tag size={14} className="text-blue-400" />
                                                    <span className="font-bold text-slate-800 text-sm">{record.itemId?.itemName || 'Deleted Item'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-black text-slate-900 text-xs px-2 py-1 bg-slate-100 rounded-lg">{record.busId?.busNumber || 'N/A'}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <span className="font-black text-blue-700">{record.quantity} {record.itemId?.unit || ''}</span>
                                            </td>
                                            <td className="px-6 py-5 text-sm text-slate-500 font-medium">
                                                {record.adminName}
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
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            value={itemFormData.itemName}
                            onChange={(e) => setItemFormData({ ...itemFormData, itemName: e.target.value })}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Category</label>
                            <select
                                required
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium bg-white"
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
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium bg-white"
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
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Total Quantity</label>
                        <input
                            required
                            type="number"
                            placeholder="0"
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            value={itemFormData.totalQuantity}
                            onChange={(e) => setItemFormData({ ...itemFormData, totalQuantity: parseInt(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Description</label>
                        <textarea
                            rows="2"
                            placeholder="Optional notes..."
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            value={itemFormData.description}
                            onChange={(e) => setItemFormData({ ...itemFormData, description: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-3 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95">Save Item</button>
                    </div>
                </form>
            </Modal>

            {/* Allocation Modal */}
            <Modal
                isOpen={isAllocateModalOpen}
                onClose={() => setIsAllocateModalOpen(false)}
                title="Allocate Item to Bus"
            >
                <form onSubmit={handleAllocateSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Select Item</label>
                        <select
                            required
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            value={allocateFormData.itemId}
                            onChange={(e) => setAllocateFormData({ ...allocateFormData, itemId: e.target.value })}
                        >
                            <option value="">-- Choose Item --</option>
                            {items.map(item => (
                                <option key={item._id} value={item._id}>{item.itemName} (Available: {item.availableQuantity} {item.unit})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Select Bus</label>
                        <select
                            required
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            value={allocateFormData.busId}
                            onChange={(e) => setAllocateFormData({ ...allocateFormData, busId: e.target.value })}
                        >
                            <option value="">-- Choose Bus --</option>
                            {buses.map(bus => (
                                <option key={bus._id} value={bus.busNumber}>{bus.busNumber} ({bus.type})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Quantity</label>
                        <input
                            required
                            type="number"
                            min="1"
                            placeholder="0"
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            value={allocateFormData.quantity}
                            onChange={(e) => setAllocateFormData({ ...allocateFormData, quantity: parseInt(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2 tracking-widest">Remarks</label>
                        <input
                            type="text"
                            placeholder="e.g. Regular maintenance"
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium"
                            value={allocateFormData.remarks}
                            onChange={(e) => setAllocateFormData({ ...allocateFormData, remarks: e.target.value })}
                        />
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={() => setIsAllocateModalOpen(false)} className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all">Cancel</button>
                        <button type="submit" className="flex-1 px-4 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg active:scale-95">Complete Allocation</button>
                    </div>
                </form>
            </Modal>
        </Layout>
    );
};

export default Inventory;
