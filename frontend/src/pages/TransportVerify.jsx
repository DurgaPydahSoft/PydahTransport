import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Bus, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import Loader from '../components/Loader';
import { API_BASE } from '../utils/api';
import { normalizeStudentPhoto } from '../utils/studentPhoto';

const formatDate = (value) => {
    if (!value) return '—';
    try {
        return new Date(value).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    } catch {
        return '—';
    }
};

const TransportVerify = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchVerification = async () => {
            if (!id) {
                setError('Invalid verification link.');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError('');
            try {
                const response = await fetch(`${API_BASE}/transport-verify/${encodeURIComponent(id)}`);
                const json = await response.json();
                if (!response.ok) {
                    setError(json.message || 'Unable to verify transport registration.');
                    setData(null);
                } else {
                    setData(json);
                }
            } catch {
                setError('Could not reach the verification service. Please try again later.');
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchVerification();
    }, [id]);

    const photoSrc = normalizeStudentPhoto(data?.student_photo);
    const isRegistered = Boolean(data?.registered);

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 px-4 py-8">
            <div className="max-w-lg mx-auto">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 text-blue-900 font-bold text-lg">
                        <Bus size={22} />
                        Pydah Transport Verification
                    </div>
                    <p className="text-sm text-slate-500 mt-1">Scan result for bus ID card</p>
                </div>

                {loading ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 py-16">
                        <Loader text="Verifying registration..." />
                    </div>
                ) : error ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-8 text-center">
                        <XCircle className="mx-auto text-red-500 mb-3" size={40} />
                        <h1 className="text-lg font-bold text-slate-900 mb-2">Verification failed</h1>
                        <p className="text-sm text-slate-600">{error}</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className={`px-6 py-4 flex items-center gap-3 ${isRegistered ? 'bg-emerald-50 border-b border-emerald-100' : 'bg-amber-50 border-b border-amber-100'}`}>
                            {isRegistered ? (
                                <CheckCircle2 className="text-emerald-600 shrink-0" size={28} />
                            ) : (
                                <ShieldCheck className="text-amber-600 shrink-0" size={28} />
                            )}
                            <div>
                                <p className={`text-sm font-black uppercase tracking-wide ${isRegistered ? 'text-emerald-800' : 'text-amber-800'}`}>
                                    {isRegistered ? 'Registered in transport system' : 'Not active in transport system'}
                                </p>
                                <p className="text-xs text-slate-600 mt-0.5">
                                    {data.message || (isRegistered ? 'This passenger has an approved transport record.' : 'No approved transport record found.')}
                                </p>
                            </div>
                        </div>

                        <div className="p-6">
                            {(data.student_name || data.admission_number) && (
                                <div className="flex gap-4 items-start mb-6">
                                    {photoSrc && (
                                        <div className="shrink-0 w-20 h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                                            <img src={photoSrc} alt={data.student_name} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Passenger</p>
                                        <h1 className="text-xl font-black text-slate-900 uppercase leading-tight">
                                            {data.student_name || '—'}
                                        </h1>
                                        <p className="text-sm font-semibold text-blue-700 mt-1">
                                            {data.admission_number || '—'}
                                        </p>
                                        {data.pin_no && (
                                            <p className="text-xs text-slate-500 mt-1">PIN: {data.pin_no}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {isRegistered && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <Detail label="Type" value={data.user_type === 'employee' ? 'Employee' : 'Student'} />
                                    <Detail label="Academic year" value={data.academic_year || '—'} />
                                    <Detail label="Transport ID" value={data.application_number || '—'} />
                                    <Detail label="Course" value={data.course ? `${data.course}${data.branch ? ` (${data.branch})` : ''}` : '—'} />
                                    <Detail label="Route" value={data.route_name ? `${data.route_name}${data.route_id ? ` (${data.route_id})` : ''}` : '—'} />
                                    <Detail label="Stage" value={data.stage_name || '—'} />
                                    <Detail label="Bus" value={data.bus_id || 'Not assigned'} />
                                    <Detail label="Fare" value={data.user_type === 'employee' ? 'Free (₹0)' : `₹${data.fare ?? 0}`} />
                                    <Detail label="Pass valid until" value={data.user_type === 'employee' ? 'N/A' : formatDate(data.effective_expiry_date)} />
                                    <Detail
                                        label="Pass status"
                                        value={data.is_expired ? 'Expired' : 'Valid'}
                                        valueClass={data.is_expired ? 'text-red-700' : 'text-emerald-700'}
                                    />
                                </div>
                            )}

                            {!isRegistered && !data.student_name && (
                                <p className="text-sm text-slate-600 text-center py-4">
                                    This QR code does not match any transport registration in our application.
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <p className="text-center text-xs text-slate-500 mt-6">
                    Pydah Group Of Institutions · Transport Office
                </p>
                <p className="text-center mt-3">
                    <Link to="/login" className="text-xs font-semibold text-blue-700 hover:underline">
                        Staff login
                    </Link>
                </p>
            </div>
        </div>
    );
};

const Detail = ({ label, value, valueClass = 'text-slate-900' }) => (
    <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-semibold mt-0.5 ${valueClass}`}>{value}</p>
    </div>
);

export default TransportVerify;
