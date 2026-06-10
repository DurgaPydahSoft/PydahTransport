/** Normalize student_photo from API (base64, data URL, http URL, or Buffer-like). */
export const normalizeStudentPhoto = (photo) => {
    if (photo == null) return null;

    if (typeof photo === 'object' && photo.type === 'Buffer' && Array.isArray(photo.data)) {
        try {
            photo = String.fromCharCode(...photo.data);
        } catch {
            return null;
        }
    }

    if (typeof photo !== 'string') return null;

    const trimmed = photo.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('data:image')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        return trimmed;
    }

    const base64 = trimmed.replace(/\s/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(base64) && base64.length > 100) {
        return `data:image/jpeg;base64,${base64}`;
    }

    return null;
};

/** Wait for all images inside a print container to load before printing. */
export const waitForPrintImages = (container, timeoutMs = 5000) => {
    if (!container) return Promise.resolve();

    const images = Array.from(container.querySelectorAll('img'));
    if (images.length === 0) return Promise.resolve();

    return Promise.all(
        images.map(
            (img) =>
                new Promise((resolve) => {
                    if (img.complete && img.naturalWidth > 0) {
                        resolve();
                        return;
                    }
                    const done = () => resolve();
                    img.addEventListener('load', done, { once: true });
                    img.addEventListener('error', done, { once: true });
                    setTimeout(done, timeoutMs);
                })
        )
    );
};
