import React from 'react';

const BillPrint = ({ billData, vendor, bus }) => {
    if (!billData || !billData.items || billData.items.length === 0) return null;

    const totalAmount = billData.totalAmount;
    const formattedDate = new Date(billData.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });

    return (
        <div id="printable-bill" className="bg-white text-black font-sans max-w-5xl mx-auto p-10 min-h-screen">
            {/* Header */}
            <div className="text-center mb-10 border-b-2 border-black pb-6">
                <h1 className="text-3xl font-bold uppercase tracking-widest">Pydah Transport Bills</h1>
                <p className="text-sm mt-2 font-semibold italic underline">Vehicle Maintenance & Spares Invoice</p>
            </div>

            {/* Bill Info */}
            <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
                <div className="border border-black p-4 space-y-2">
                    <div className="font-bold border-b border-black pb-1 mb-2">VEHICLE DETAILS</div>
                    <div><span className="font-bold">Bus Number:</span> {bus?.busNumber || billData.items[0]?.busId?.busNumber || 'N/A'}</div>
                    <div><span className="font-bold">Bill Number:</span> #{billData.billNo || 'N/A'}</div>
                    <div><span className="font-bold">Date:</span> {formattedDate}</div>
                </div>
                <div className="border border-black p-4 space-y-2">
                    <div className="font-bold border-b border-black pb-1 mb-2">VENDOR DETAILS</div>
                    <div className="font-bold">{vendor?.name || 'GENERIC VENDOR'}</div>
                    <div className="text-xs uppercase">{vendor?.address || 'Address Not Provided'}</div>
                    {vendor?.phone && <div className="text-xs font-bold">Ph: {vendor.phone}</div>}
                </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse border border-black mb-10 text-sm">
                <thead>
                    <tr className="bg-gray-100 border-b border-black">
                        <th className="border border-black p-2 text-center w-12 text-xs">SL.</th>
                        <th className="border border-black p-2 text-left text-xs">DESCRIPTION OF SPARES / SERVICES</th>
                        <th className="border border-black p-2 text-center w-24 text-xs">QUANTITY</th>
                        <th className="border border-black p-2 text-right w-32 text-xs">UNIT PRICE</th>
                        <th className="border border-black p-2 text-right w-32 text-xs">AMOUNT (₹)</th>
                    </tr>
                </thead>
                <tbody>
                    {billData.items.map((item, index) => (
                        <tr key={index} className="border-b border-black">
                            <td className="border border-black p-2 text-center">{index + 1}</td>
                            <td className="border border-black p-2">
                                <div className="font-bold uppercase leading-tight">{item.itemId?.itemName || 'General Part'}</div>
                                <div className="text-[10px] uppercase font-semibold mt-1 opacity-70 italic">Category: {item.itemId?.category}</div>
                                {item.tyrePosition && item.itemId?.category === 'Tires' && (
                                    <div className="text-[10px] font-bold mt-1 uppercase">Pos: {item.tyrePosition} | Reading: {item.kmReading} KM</div>
                                )}
                                {item.remarks && (
                                    <div className="text-[10px] mt-1 border-t border-dotted border-black/20 pt-1 italic max-w-sm">Note: {item.remarks}</div>
                                )}
                            </td>
                            <td className="border border-black p-2 text-center font-semibold">
                                {item.quantity} {item.itemId?.unit || 'Pcs'}
                            </td>
                            <td className="border border-black p-2 text-right font-semibold">
                                {item.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="border border-black p-2 text-right font-bold">
                                {(item.quantity * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                        </tr>
                    ))}
                    {/* Filler Rows for look */}
                    {[...Array(Math.max(0, 5 - billData.items.length))].map((_, i) => (
                        <tr key={`filler-${i}`} className="border-b border-black h-8">
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                            <td className="border border-black p-2"></td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="font-bold">
                        <td colSpan="4" className="border border-black p-2 text-right uppercase tracking-widest text-xs">Grand Total</td>
                        <td className="border border-black p-2 text-right text-base">
                            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                    </tr>
                </tfoot>
            </table>

            {/* Footer Signatures */}
            <div className="mt-auto pt-16 grid grid-cols-3 gap-10 text-center text-xs font-bold uppercase tracking-widest">
                <div className="border-t border-black pt-2">Receiver's Signature</div>
                <div className="border-t border-black pt-2">Fleet Manager</div>
                <div className="border-t border-black pt-2">Authorized Signatory</div>
            </div>

            <div className="mt-8 text-center text-[10px] opacity-50 uppercase font-semibold border-t border-black pt-4">
                This is a computer generated document. Physical seal and sign required for validation.
            </div>

            {/* Simple Print Styles */}
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: A4 portrait; 
                        margin: 10mm; 
                    }
                    @media print {
                        body * { visibility: hidden; }
                        #print-container, #print-container * { visibility: visible !important; }
                        #print-container {
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                        }
                        tr { page-break-inside: avoid; }
                    }
                    #printable-bill { 
                        font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
                        width: 100% !important; 
                        max-width: none !important; 
                        margin: 0 !important; 
                        padding: 0 !important;
                    }
                    /* Ensure borders and header backgrounds print */
                    table, th, td { border: 1px solid black !important; }
                    .bg-gray-100 { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; }
                `}
            </style>
        </div>
    );
};

export default BillPrint;
