import React, { forwardRef } from 'react';
import { normalizeStudentPhoto } from '../utils/studentPhoto';

const LOGO_SRC = '/PYDAH_LOGO_PHOTO.jpg';

const getAcademicYearLabel = (passenger) => {
    if (passenger?.academic_year) return passenger.academic_year;
    const now = new Date();
    const year = now.getFullYear();
    return now.getMonth() >= 6 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
};

const formatDate = (d) => {
    if (!d) return '—';
    try {
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return '—';
    }
};

const AdmitCardCopy = ({ copyLabel, passenger }) => {
    const {
        student_name,
        employee_name,
        admission_number,
        emp_no,
        pin_no,
        user_type,
        course,
        branch,
        department,
        year_of_study,
        route_name,
        stage_name,
        bus_id,
        fare,
        student_photo,
        student_mobile,
        parent_mobile1,
        student_address,
        father_name,
        expiry_date,
        effective_expiry_date,
    } = passenger || {};

    const name = student_name || employee_name || '—';
    const rollNo = admission_number || emp_no || '—';
    const isEmployee = (user_type || '').toLowerCase() === 'employee';
    const academicYear = getAcademicYearLabel(passenger);
    const expiry = effective_expiry_date || expiry_date;
    const displayCourse = course || department || '—';
    const photoSrc = normalizeStudentPhoto(student_photo);

    return (
        <div className="admit-card-copy">
            <div className="copy-label">{copyLabel}</div>
            <div className="card-border">
                <div className="card-header">
                    <img src={LOGO_SRC} alt="Pydah Group" className="inst-logo" />
                    <div className="header-center">
                        <div className="inst-name">Pydah Group Of Institutions</div>
                    </div>
                    <div className="header-right">
                        <div className="card-title">TRANSPORT ADMIT CARD</div>
                        <div className="card-ay">{academicYear} AY</div>
                    </div>
                </div>
                <div className="divider" />

                <div className="card-body">
                    <div className="student-block">
                        <div className="col-details">
                            <div className="section-title">STUDENT DETAILS</div>
                            <table className="details-table">
                                <tbody>
                                    <tr><td className="lbl">Name</td><td className="val">{name}</td></tr>
                                    <tr><td className="lbl">{isEmployee ? 'Emp No' : 'Roll No'}</td><td className="val">{rollNo}</td></tr>
                                    {!isEmployee && (
                                        <tr><td className="lbl">PIN No</td><td className="val">{pin_no || '—'}</td></tr>
                                    )}
                                    <tr><td className="lbl">Course</td><td className="val">{displayCourse}{branch ? ` (${branch})` : ''}</td></tr>
                                    <tr><td className="lbl">Year</td><td className="val">{isEmployee ? '—' : (year_of_study ?? '—')}</td></tr>
                                    <tr><td className="lbl">Mobile</td><td className="val">{student_mobile || '—'}</td></tr>
                                    <tr><td className="lbl">Parent No</td><td className="val">{parent_mobile1 || '—'}</td></tr>
                                    <tr><td className="lbl">Father</td><td className="val">{father_name || '—'}</td></tr>
                                    <tr><td className="lbl">Address</td><td className="val address-val">{student_address || '—'}</td></tr>
                                    <tr><td className="lbl">Valid Until</td><td className="val">{isEmployee ? 'N/A' : formatDate(expiry)}</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="col-photo">
                            <div className="section-title">STUDENT PHOTO</div>
                            <div className="photo-frame">
                                {photoSrc ? (
                                    <img src={photoSrc} alt={name} className="student-photo" />
                                ) : (
                                    <div className="photo-placeholder">PHOTO</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fee-section">
                    <div className="section-title fee-title">TRANSPORT DETAILS</div>
                    <div className="transport-table-wrap">
                        <table className="transport-table">
                            <tbody>
                                <tr>
                                    <td className="lbl">Route</td>
                                    <td className="val">{route_name || '—'}</td>
                                </tr>
                                <tr>
                                    <td className="lbl">Stage</td>
                                    <td className="val">{stage_name || '—'}</td>
                                </tr>
                                <tr>
                                    <td className="lbl">Bus</td>
                                    <td className="val">{bus_id || 'Not assigned'}</td>
                                </tr>
                                <tr>
                                    <td className="lbl">Fare</td>
                                    <td className="val fare-val">{isEmployee ? 'Free (Rs : 0)' : `Rs : ${fare ?? 0}`}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="notes-section">
                    <div className="section-title">IMPORTANT NOTES:</div>
                    <ol className="notes-list">
                        <li>Present this card at the bus pickup point for verification.</li>
                        <li>Transport pass is valid only for the assigned route, stage and bus above.</li>
                        <li>Report any route or bus changes to the Transport Office immediately.</li>
                    </ol>
                </div>
            </div>
        </div>
    );
};

const TransportAdmitCard = forwardRef(({ passenger, busMeta }, ref) => {
    if (!passenger) return null;

    return (
        <div
            className="transport-admit-print-host"
            style={{
                position: 'fixed',
                left: 0,
                top: 0,
                width: '210mm',
                visibility: 'hidden',
                zIndex: -1,
                pointerEvents: 'none',
            }}
        >
            <div ref={ref} className="transport-admit-print-root">
                <style>{`
                    @page {
                        size: A4 portrait;
                        margin: 6mm;
                    }
                    @media print {
                        html, body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        .transport-admit-print-host {
                            visibility: visible !important;
                            position: static !important;
                            z-index: auto !important;
                            width: 100% !important;
                        }
                        .transport-admit-print-root {
                            height: 285mm !important;
                            max-height: 285mm !important;
                            page-break-after: avoid !important;
                            page-break-inside: avoid !important;
                        }
                        .card-border {
                            border: 1px solid #000 !important;
                        }
                        .transport-table td,
                        .photo-frame,
                        .divider,
                        .copy-separator {
                            border-color: #000 !important;
                        }
                    }
                    .transport-admit-print-root {
                        font-family: Arial, Helvetica, sans-serif;
                        color: #000;
                        background: #fff;
                        width: 198mm;
                        height: 285mm;
                        max-height: 285mm;
                        margin: 0 auto;
                        display: grid;
                        grid-template-rows: 1fr auto 1fr;
                        align-items: stretch;
                        gap: 0;
                        box-sizing: border-box;
                        page-break-inside: avoid;
                    }
                    .admit-card-copy {
                        display: flex;
                        flex-direction: column;
                        min-height: 0;
                        page-break-inside: avoid;
                    }
                    .copy-separator {
                        border: none;
                        border-top: 1px dashed #999;
                        margin: 2mm 0;
                        flex-shrink: 0;
                        height: 0;
                    }
                    .copy-label {
                        font-size: 6.5pt;
                        font-weight: 700;
                        margin-bottom: 0.8mm;
                        text-transform: uppercase;
                        flex-shrink: 0;
                    }
                    .card-border {
                        border: 1px solid #000;
                        padding: 2.5mm;
                        box-sizing: border-box;
                        display: flex;
                        flex-direction: column;
                        gap: 1.5mm;
                        flex: 1;
                        min-height: 0;
                        overflow: visible;
                    }
                    .card-header {
                        display: flex;
                        align-items: center;
                        gap: 3mm;
                        flex-shrink: 0;
                    }
                    .inst-logo {
                        width: 22mm;
                        height: 14mm;
                        object-fit: contain;
                        object-position: left center;
                        flex-shrink: 0;
                    }
                    .header-center {
                        flex: 1;
                        text-align: center;
                    }
                    .inst-name {
                        font-size: 11pt;
                        font-weight: 700;
                    }
                    .header-right {
                        text-align: right;
                        min-width: 36mm;
                        flex-shrink: 0;
                    }
                    .card-title {
                        font-size: 8pt;
                        font-weight: 700;
                    }
                    .card-ay {
                        font-size: 7pt;
                        font-weight: 600;
                    }
                    .divider {
                        border: none;
                        border-top: 1px solid #000;
                        margin: 0;
                        flex-shrink: 0;
                        height: 0;
                    }
                    .card-body {
                        display: flex;
                        justify-content: center;
                        width: 100%;
                        flex-shrink: 0;
                    }
                    .student-block {
                        display: flex;
                        align-items: flex-start;
                        justify-content: center;
                        gap: 5mm;
                        max-width: 100%;
                    }
                    .col-details {
                        width: 78mm;
                        flex-shrink: 0;
                    }
                    .col-photo {
                        width: 30mm;
                        flex-shrink: 0;
                    }
                    .section-title {
                        font-size: 6.5pt;
                        font-weight: 700;
                        text-decoration: underline;
                        margin-bottom: 1mm;
                        text-transform: uppercase;
                    }
                    .details-table {
                        width: 100%;
                        border-collapse: collapse;
                        font-size: 6.5pt;
                    }
                    .details-table td {
                        padding: 0.5mm 1mm;
                        vertical-align: top;
                    }
                    .details-table .lbl {
                        font-weight: 700;
                        width: 28%;
                    }
                    .details-table .val {
                        font-weight: 500;
                    }
                    .address-val {
                        font-size: 5.5pt;
                        line-height: 1.2;
                    }
                    .photo-frame {
                        border: 1px solid #000;
                        width: 30mm;
                        height: 38mm;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        overflow: hidden;
                        box-sizing: border-box;
                    }
                    .student-photo {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                        object-position: center top;
                    }
                    .photo-placeholder {
                        font-size: 7pt;
                        color: #666;
                        font-weight: 700;
                    }
                    .fee-section {
                        flex-shrink: 0;
                        text-align: center;
                    }
                    .fee-title {
                        margin-bottom: 1mm;
                        text-align: center;
                    }
                    .transport-table-wrap {
                        display: flex;
                        justify-content: center;
                        width: 100%;
                    }
                    .transport-table {
                        width: 65%;
                        max-width: 115mm;
                        border-collapse: collapse;
                        font-size: 6.5pt;
                        margin: 0 auto;
                    }
                    .transport-table td {
                        border: 1px solid #000;
                        padding: 0.8mm 1.5mm;
                        vertical-align: top;
                    }
                    .transport-table .lbl {
                        font-weight: 700;
                        width: 32%;
                        background: #f5f5f5;
                    }
                    .transport-table .val {
                        font-weight: 500;
                    }
                    .transport-table .fare-val {
                        font-weight: 700;
                    }
                    .notes-section {
                        flex-shrink: 0;
                        margin-top: 0;
                        text-align: center;
                    }
                    .notes-section .section-title {
                        text-align: center;
                    }
                    .notes-list {
                        font-size: 5.5pt;
                        margin: 0 auto;
                        padding-left: 0;
                        line-height: 1.35;
                        display: inline-block;
                        text-align: left;
                        list-style-position: inside;
                    }
                `}</style>

                <AdmitCardCopy copyLabel="STUDENT COPY" passenger={passenger} />
                <hr className="copy-separator" aria-hidden="true" />
                <AdmitCardCopy copyLabel="TRANSPORT OFFICE COPY" passenger={passenger} />
            </div>
        </div>
    );
});

export default TransportAdmitCard;
