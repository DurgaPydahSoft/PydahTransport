import React, { forwardRef } from 'react';

const PassengerReport = forwardRef(({ passengers }, ref) => {
    // Group passengers by Route
    const groupedData = passengers.reduce((acc, passenger) => {
        const routeName = passenger.route_name || 'Unassigned Route';
        if (!acc[routeName]) {
            acc[routeName] = [];
        }
        acc[routeName].push(passenger);
        return acc;
    }, {});

    // Sort routes alphabetically
    const sortedRoutes = Object.keys(groupedData).sort();

    return (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', overflow: 'hidden' }}>
            <div ref={ref} className="print-container p-10 bg-white font-sans text-slate-900 w-full h-full text-sm">
                
                <style type="text/css" media="print">
                    {`
                        @page { size: portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact; margin: 0; }
                        .print-container { width: 100%; max-width: 100%; margin: 0; padding: 0; }
                        .page-break { page-break-after: always; }
                        .no-break { page-break-inside: avoid; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
                        th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
                        th { background-color: #f1f5f9; font-weight: bold; font-size: 11px; }
                        td { font-size: 10px; }
                    `}
                </style>

                <div className="text-center mb-4 pb-2 border-b border-slate-200">
                    <h1 className="text-xl font-bold uppercase tracking-widest text-slate-800">Transport Passenger Report</h1>
                    <p className="text-[10px] text-slate-500 mt-1 font-medium">Route-Wise Details · Generated {new Date().toLocaleDateString()}</p>
                </div>

                {sortedRoutes.map((route, index) => {
                    const routePassengers = groupedData[route];
                    const numStudents = routePassengers.filter(p => !p.user_type || p.user_type === 'student').length;
                    const numEmployees = routePassengers.filter(p => p.user_type === 'employee').length;

                    return (
                        <div key={route} className={`mb-6 ${index < sortedRoutes.length - 1 ? 'page-break' : ''}`}>
                            <div className="bg-slate-50 border border-slate-200 p-2 rounded mb-2 flex justify-between items-center">
                                <h2 className="text-sm font-bold text-blue-900">Route: {route}</h2>
                                <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                                    Total: {routePassengers.length} <span className="opacity-50 mx-1">|</span> Students: {numStudents} <span className="opacity-50 mx-1">|</span> Employees: {numEmployees}
                                </p>
                            </div>

                        <table>
                            <thead>
                                <tr>
                                    <th className="w-[4%]">S.No</th>
                                    <th className="w-[32%]">Name</th>
                                    <th className="w-[15%]">ID / PIN</th>
                                    <th className="w-[12%]">Type</th>
                                    <th className="w-[18%]">Course / Dept</th>
                                    <th className="w-[19%]">Assigned Bus</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routePassengers.map((p, idx) => (
                                    <tr key={p.id || p._id || idx} className="no-break hover:bg-slate-50">
                                        <td>{idx + 1}</td>
                                        <td className="font-semibold">{p.student_name || p.employee_name || '—'}</td>
                                        <td className="font-mono">{p.admission_no || p.admission_number || p.emp_no || '—'}</td>
                                        <td>
                                            <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase font-bold ${p.user_type === 'employee' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                {p.user_type || 'Student'}
                                            </span>
                                        </td>
                                        <td>{p.course || p.department || '—'} {p.branch ? `- ${p.branch}` : ''}</td>
                                        <td className="font-bold text-slate-700">{p.bus_id || 'Not Assigned'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    );
                })}

                {sortedRoutes.length === 0 && (
                    <div className="text-center p-10 text-slate-500 italic">
                        No approved passengers available to report.
                    </div>
                )}
            </div>
        </div>
    );
});

export default PassengerReport;
