/**
 * Resolve a displayable student photo from MySQL row fields.
 * Handles student_photo column, student_data JSON, and Buffer values.
 */
function normalizePhotoString(photo) {
    if (photo == null) return null;

    if (Buffer.isBuffer(photo)) {
        photo = photo.toString('utf8');
    }

    if (typeof photo !== 'string') return null;

    const trimmed = photo.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('data:image')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
        return trimmed;
    }

    // Raw base64 (strip whitespace that sometimes appears in LONGTEXT)
    const base64 = trimmed.replace(/\s/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(base64) && base64.length > 100) {
        return `data:image/jpeg;base64,${base64}`;
    }

    return null;
}

function parseStudentDataPhoto(studentData) {
    if (!studentData) return null;

    let parsed = studentData;
    if (typeof studentData === 'string') {
        try {
            parsed = JSON.parse(studentData);
        } catch {
            return null;
        }
    }

    if (!parsed || typeof parsed !== 'object') return null;

    const candidates = [
        parsed.student_photo,
        parsed.studentPhoto,
        parsed.photo,
        parsed.Photo,
        parsed.profile_photo,
        parsed.profilePhoto,
        parsed.image,
    ];

    for (const candidate of candidates) {
        const normalized = normalizePhotoString(candidate);
        if (normalized) return normalized;
    }

    return null;
}

function resolveStudentPhoto(row) {
    if (!row) return null;

    const fromColumn = normalizePhotoString(row.student_photo);
    if (fromColumn) return fromColumn;

    return parseStudentDataPhoto(row.student_data);
}

module.exports = {
    normalizePhotoString,
    parseStudentDataPhoto,
    resolveStudentPhoto,
};
