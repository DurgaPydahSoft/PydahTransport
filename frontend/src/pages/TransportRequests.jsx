import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const TransportRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/transport-requests`);
                if (response.ok) {
                    const data = await response.json();
                    setRequests(data);
                } else {
                    console.error('Failed to fetch requests');
                }
            } catch (error) {
                console.error('Error fetching requests:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    return (
        <Layout>
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">Transport Requests</h2>
                <p className="text-gray-500 mt-1">View student transport requests from the main database.</p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                    <p className="text-gray-500">No transport requests found.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                    <th className="p-4">Admission No</th>
                                    <th className="p-4">Name</th>
                                    <th className="p-4">Route</th>
                                    <th className="p-4">Stage</th>
                                    <th className="p-4">Fare</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm text-gray-700">
                                {requests.map((req, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium text-blue-600">{req.admission_number}</td>
                                        <td className="p-4">{req.student_name}</td>
                                        <td className="p-4">{req.route_name}</td>
                                        <td className="p-4">{req.stage_name}</td>
                                        <td className="p-4 font-medium text-gray-900">₹{req.fare}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${req.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                req.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                {req.status || 'Pending'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {new Date(req.request_date).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default TransportRequests;
