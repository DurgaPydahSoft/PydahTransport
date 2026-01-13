import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';

const BusManagement = () => {
    const [buses, setBuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/buses`);
            const data = await response.json();
            setBuses(data);
        } catch (error) {
            console.error('Error fetching buses:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBuses();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = (bus) => {
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

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this bus?')) return;

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/buses/${id}`, {
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
                ? `${import.meta.env.VITE_API_URL}/buses/${editingId}`
                : `${import.meta.env.VITE_API_URL}/buses`;

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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Bus Fleet</h2>
                    <p className="text-gray-500 mt-1">Manage institute buses, drivers, and attendants.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-200 transition-all hover:shadow-blue-300 active:scale-95 flex items-center"
                >
                    <span className="mr-2 text-xl">+</span> Add New Bus
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading fleet data...</div>
            ) : buses.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col items-center justify-center py-20 px-4">
                    <div className="bg-blue-50 p-6 rounded-full mb-4">
                        <span className="text-4xl">🚌</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">No Buses Found</h3>
                    <p className="text-gray-500 text-center max-w-md mx-auto mb-6">
                        It looks like you haven't added any buses to the fleet yet. Start by adding a bus to manage transport.
                    </p>
                    <button onClick={() => setIsModalOpen(true)} className="text-blue-600 font-semibold hover:text-blue-800 hover:underline">
                        Add your first bus
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {buses.map((bus) => (
                        <div key={bus._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
                            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(bus)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Edit Bus"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDelete(bus._id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete Bus"
                                >
                                    🗑️
                                </button>
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">{bus.busNumber}</h3>
                                    <p className="text-sm text-gray-500">{bus.type}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${bus.status === 'Active' ? 'bg-green-100 text-green-700' :
                                    bus.status === 'In Maintenance' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                    }`}>
                                    {bus.status}
                                </span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <span className="w-5 mr-2">💺</span>
                                    <span>{bus.capacity} Seats</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-5 mr-2">👨‍✈️</span>
                                    <span>{bus.driverName}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="w-5 mr-2">🎫</span>
                                    <span>{bus.attendantName}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingId ? "Edit Bus" : "Add New Bus"}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bus Number</label>
                        <input type="text" name="busNumber" required value={formData.busNumber} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g. KA-01-F-1234" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                            <input type="number" name="capacity" required value={formData.capacity} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g. 40" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select name="type" value={formData.type} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                                <option value="Standard">Standard</option>
                                <option value="Mini-bus">Mini-bus</option>
                                <option value="Van">Van</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Driver Name</label>
                        <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g. Ramesh Kumar" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Attendant Name</label>
                        <input type="text" name="attendantName" value={formData.attendantName} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" placeholder="e.g. Suresh Babu" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none">
                            <option value="Active">Active</option>
                            <option value="In Maintenance">In Maintenance</option>
                            <option value="Retired">Retired</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors mt-6">
                        {editingId ? 'Update Bus' : 'Create Bus'}
                    </button>
                </form>
            </Modal>
        </Layout>
    );
};

export default BusManagement;
