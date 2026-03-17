import React, { forwardRef } from 'react';

const PassengerReport = forwardRef(({ passengers }, ref) => {
    // Group passengers by Route -> then by Stage
    const groupedData = (passengers || []).reduce((acc, passenger) => {
        const routeName = passenger.route_name || 'Unassigned Route';
        const stageName = passenger.stage_name || 'Unassigned Stage';
        
        if (!acc[routeName]) acc[routeName] = {};
        if (!acc[routeName][stageName]) acc[routeName][stageName] = [];
        
        acc[routeName][stageName].push(passenger);
        return acc;
    }, {});

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
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #cbd5e1; padding: 4px 6px; text-align: left; }
                        th { background-color: #f8fafc; font-weight: bold; font-size: 10px; text-transform: uppercase; color: #475569; }
                        td { font-size: 10px; color: #1e293b; }
                        .route-header { background-color: #1e293b; color: white; padding: 6px 12px; margin-bottom: 15px; border-radius: 4px; }
                        .stage-header { background-color: #f1f5f9; border-left: 4px solid #3b82f6; padding: 4px 10px; margin-bottom: 8px; margin-top: 15px; }
                    `}
                </style>

                <div className="text-center mb-6 pb-4 border-b-2 border-slate-100">
                    <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-800">Transport Passenger Report</h1>
                    <p className="text-xs text-slate-500 mt-1 font-bold">Stage-Wise Passenger Breakdown · Generated {new Date().toLocaleDateString()}</p>
                </div>

                {sortedRoutes.map((route, rIdx) => {
                    const stages = groupedData[route];
                    const sortedStages = Object.keys(stages).sort();
                    
                    // Route totals
                    let routeTotal = 0;
                    let routeStudents = 0;
                    let routeEmployees = 0;
                    
                    Object.values(stages).forEach(sp => {
                        routeTotal += sp.length;
                        routeStudents += sp.filter(p => !p.user_type || p.user_type === 'student').length;
                        routeEmployees += sp.filter(p => p.user_type === 'employee').length;
                    });

                    return (
                        <div key={route} className={`mb-10 ${rIdx < sortedRoutes.length - 1 ? 'page-break' : ''}`}>
                            <div className="route-header flex justify-between items-center">
                                <h2 className="text-lg font-black uppercase tracking-wide">Route: {route}</h2>
                                <div className="text-[10px] uppercase font-bold text-slate-300">
                                    Total: {routeTotal} | Stu: {routeStudents} | Emp: {routeEmployees}
                                </div>
                            </div>

                            {sortedStages.map((stage) => {
                                const stagePassengers = stages[stage];
                                const numStudents = stagePassengers.filter(p => !p.user_type || p.user_type === 'student').length;
                                const numEmployees = stagePassengers.filter(p => p.user_type === 'employee').length;

                                return (
                                    <div key={stage} className="no-break mb-6">
                                        <div className="stage-header flex justify-between items-center">
                                            <h3 className="text-xs font-bold text-slate-800">Stage: {stage}</h3>
                                            <div className="text-[9px] font-black uppercase text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                                Total: {stagePassengers.length} | Students: {numStudents} | Employees: {numEmployees}
                                            </div>
                                        </div>

                                        <table className="w-full">
                                            <thead>
                                                <tr>
                                                    <th className="w-[5%]">#</th>
                                                    <th className="w-[35%]">Passenger Name</th>
                                                    <th className="w-[15%]">ID / Admission</th>
                                                    <th className="w-[10%]">Type</th>
                                                    <th className="w-[20%]">Course / Department</th>
                                                    <th className="w-[15%]">Bus ID</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {stagePassengers.map((p, pIdx) => (
                                                    <tr key={p.id || p._id || pIdx}>
                                                        <td className="text-center">{pIdx + 1}</td>
                                                        <td className="font-bold">{p.student_name || p.employee_name || '—'}</td>
                                                        <td className="font-mono text-[9px]">{p.admission_no || p.admission_number || p.emp_no || '—'}</td>
                                                        <td>
                                                            <span className={`font-bold uppercase text-[7px] ${p.user_type === 'employee' ? 'text-purple-600' : 'text-emerald-600'}`}>
                                                                {p.user_type || 'Student'}
                                                            </span>
                                                        </td>
                                                        <td>{p.course || p.department || '—'} {p.branch ? `(${p.branch})` : ''}</td>
                                                        <td className="text-center font-bold">{p.bus_id || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                {sortedRoutes.length === 0 && (
                    <div className="text-center p-20 text-slate-400 font-bold uppercase tracking-widest border-4 border-dashed border-slate-100 rounded-3xl">
                        No approved passengers available to report.
                    </div>
                )}
            </div>
        </div>
    );
});

export default PassengerReport;
