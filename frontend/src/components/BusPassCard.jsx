import React, { forwardRef } from 'react';

const BusPassCard = forwardRef(({ passenger }, ref) => {
    if (!passenger) return null;

    const {
        student_name,
        employee_name,
        admission_number,
        emp_no,
        user_type,
        course,
        branch,
        department,
        route_name,
        stage_name,
        bus_id,
        student_photo,
        qr_token
    } = passenger;

    const name = student_name || employee_name || 'N/A';
    const idNumber = admission_number || emp_no || 'N/A';
    const type = user_type || 'Student';
    const displayCourse = course || department || 'N/A';
    const displayBranch = branch ? `- ${branch}` : '';

    return (
        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', overflow: 'hidden' }}>
            <div ref={ref} className="bus-pass-container font-sans text-slate-900">
                <style type="text/css" media="print">
                    {`
                        @page { 
                            size: 85.6mm 54mm; 
                            margin: 0; 
                        }
                        body { 
                            margin: 0; 
                            -webkit-print-color-adjust: exact; 
                        }
                        .bus-pass-card {
                            width: 85.6mm;
                            height: 54mm;
                            position: relative;
                            overflow: hidden;
                            background-color: white;
                            border: 1px solid #e2e8f0;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                        }
                        .header {
                            background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                            color: white;
                            padding: 4mm;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        }
                        .header-title {
                            font-size: 14pt;
                            font-weight: 800;
                            text-transform: uppercase;
                            letter-spacing: 0.5mm;
                        }
                        .header-subtitle {
                            font-size: 6pt;
                            opacity: 0.9;
                            font-weight: 500;
                        }
                        .content {
                            display: flex;
                            padding: 3mm;
                            flex: 1;
                            gap: 3mm;
                        }
                        .photo-box {
                            width: 22mm;
                            height: 28mm;
                            border: 0.5mm solid #cbd5e1;
                            background-color: #f8fafc;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            overflow: hidden;
                            border-radius: 1mm;
                        }
                        .photo-box img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                        .photo-placeholder {
                            font-size: 6pt;
                            color: #94a3b8;
                            text-align: center;
                            padding: 2mm;
                        }
                        .details {
                            flex: 1;
                            display: flex;
                            flex-direction: column;
                            gap: 1mm;
                        }
                        .detail-row {
                            display: flex;
                            flex-direction: column;
                        }
                        .label {
                            font-size: 5pt;
                            color: #64748b;
                            text-transform: uppercase;
                            font-weight: 700;
                            line-height: 1;
                        }
                        .value {
                            font-size: 8pt;
                            font-weight: 700;
                            color: #1e293b;
                            line-height: 1.2;
                        }
                        .footer {
                            background-color: #f1f5f9;
                            padding: 2mm 4mm;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                            border-top: 0.2mm solid #e2e8f0;
                        }
                        .qr-box {
                            width: 10mm;
                            height: 10mm;
                            background-color: #cbd5e1;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 4pt;
                        }
                        .bus-id-badge {
                            background-color: #1e40af;
                            color: white;
                            padding: 0.5mm 2mm;
                            border-radius: 3mm;
                            font-size: 7pt;
                            font-weight: 800;
                        }
                        .type-badge {
                            font-size: 6pt;
                            font-weight: 800;
                            text-transform: uppercase;
                            color: #1e40af;
                        }
                    `}
                </style>

                <div className="bus-pass-card shadow-lg">
                    <div className="header">
                        <div>
                            <div className="header-title">BUS PASS</div>
                            <div className="header-subtitle">Pydah Transport Services</div>
                        </div>
                        <div className="type-badge" style={{color: 'white', background: 'rgba(255,255,255,0.2)', padding: '1mm 2mm', borderRadius: '1mm'}}>
                            {type}
                        </div>
                    </div>

                    <div className="content">
                        <div className="photo-box">
                            {student_photo ? (
                                <img src={student_photo} alt="Student" />
                            ) : (
                                <div className="photo-placeholder">PHOTO</div>
                            )}
                        </div>
                        <div className="details">
                            <div className="detail-row">
                                <div className="label">Name</div>
                                <div className="value" style={{fontSize: '9pt', color: '#1e40af'}}>{name}</div>
                            </div>
                            <div className="detail-row">
                                <div className="label">ID Number</div>
                                <div className="value">{idNumber}</div>
                            </div>
                            <div className="detail-row">
                                <div className="label">Course / Dept</div>
                                <div className="value" style={{fontSize: '7pt'}}>{displayCourse} {displayBranch}</div>
                            </div>
                            <div className="detail-row" style={{marginTop: '1mm'}}>
                                <div className="label">Route & Stage</div>
                                <div className="value" style={{fontSize: '7pt'}}>{route_name} - {stage_name}</div>
                            </div>
                        </div>
                    </div>

                    <div className="footer">
                        <div style={{display: 'flex', alignItems: 'center', gap: '2mm'}}>
                            <div className="qr-box">
                                {qr_token ? 'QR' : 'ID'}
                            </div>
                            <div style={{fontSize: '5pt', color: '#64748b'}}>
                                Valid for Academic Session<br/>2025-2026
                            </div>
                        </div>
                        <div className="bus-id-badge">
                            BUS: {bus_id || 'N/A'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default BusPassCard;
