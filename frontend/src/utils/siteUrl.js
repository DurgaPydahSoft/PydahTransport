/** Public site base URL used in QR codes (set VITE_PUBLIC_SITE_URL in production). */
export const getPublicSiteUrl = () => {
    const fromEnv = import.meta.env.VITE_PUBLIC_SITE_URL;
    if (fromEnv && String(fromEnv).trim()) {
        return String(fromEnv).trim().replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return '';
};

export const getTransportVerifyUrl = (requestId) => {
    if (requestId == null || requestId === '') return '';
    const base = getPublicSiteUrl();
    return `${base}/verify-transport/${encodeURIComponent(requestId)}`;
};
