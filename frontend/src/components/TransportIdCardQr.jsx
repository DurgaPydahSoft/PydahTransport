import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { getTransportVerifyUrl } from '../utils/siteUrl';

const TransportIdCardQr = ({ passenger, qrDataUrl: presetQr, className = '' }) => {
    const [dataUrl, setDataUrl] = useState(presetQr || '');

    useEffect(() => {
        if (presetQr) {
            setDataUrl(presetQr);
            return undefined;
        }

        let cancelled = false;
        const requestId = passenger?.id ?? passenger?._id;
        const url = getTransportVerifyUrl(requestId);

        if (!url) {
            setDataUrl('');
            return undefined;
        }

        QRCode.toDataURL(url, {
            errorCorrectionLevel: 'M',
            margin: 1,
            width: 256,
            color: { dark: '#000000', light: '#ffffff' },
        })
            .then((src) => {
                if (!cancelled) setDataUrl(src);
            })
            .catch(() => {
                if (!cancelled) setDataUrl('');
            });

        return () => {
            cancelled = true;
        };
    }, [passenger?.id, passenger?._id, presetQr]);

    if (!dataUrl) {
        return (
            <div className={`id-back-qr-square ${className}`}>
                <span className="id-back-qr-label">QR</span>
            </div>
        );
    }

    return (
        <img
            src={dataUrl}
            alt="Transport verification QR code"
            className={`id-back-qr-image ${className}`}
        />
    );
};

export default TransportIdCardQr;
