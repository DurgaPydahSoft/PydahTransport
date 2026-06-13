function normalizeApplicationCode(value, fallback = 'UNK') {
    const text = String(value || '').trim().toUpperCase();
    if (!text) return fallback;
    return text.replace(/\s+/g, '').replace(/[^A-Z0-9.-]/g, '') || fallback;
}

/** Use official DB code as-is (trim + uppercase only). */
function formatApplicationCode(value, fallback = 'UNK') {
    const text = String(value || '').trim().toUpperCase();
    return text || fallback;
}

function formatTransportApplicationNumber(collegeCode, courseCode, serial) {
    const college = formatApplicationCode(collegeCode, 'UNK');
    const course = formatApplicationCode(courseCode, 'GEN');
    const sequence = String(serial).padStart(4, '0');
    return `${college}-${course}-${sequence}`;
}

function parseLegacyApplicationNumber(applicationNumber) {
    if (!applicationNumber) return null;
    const text = String(applicationNumber).trim();
    if (/^\d{4}$/.test(text)) {
        return { collegeCode: null, courseCode: null, serial: Number(text) };
    }
    const match = text.match(/^([A-Z0-9.-]+)-([A-Z0-9.-]+)-(\d{4,})$/i);
    if (!match) return null;
    return {
        collegeCode: formatApplicationCode(match[1]),
        courseCode: formatApplicationCode(match[2]),
        serial: Number(match[3]),
    };
}

const COUNTERS_TABLE = 'transport_application_counters_v2';
const LEGACY_COUNTERS_TABLE = 'transport_application_counters';

async function ensureCountersTable(connection) {
    await connection.query(`
        CREATE TABLE IF NOT EXISTS ${COUNTERS_TABLE} (
            academic_year VARCHAR(20) NOT NULL,
            college_code VARCHAR(32) NOT NULL,
            course_code VARCHAR(32) NOT NULL,
            last_serial INT UNSIGNED NOT NULL DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (academic_year, college_code, course_code)
        )
    `);
}

/**
 * Assign next application number for academic year + college + course (approval only).
 */
async function assignTransportApplicationNumber(
    mysqlPool,
    {
        academicYear,
        collegeCode,
        courseCode,
        existingApplicationNumber = null,
        existingApplicationSerial = null,
    }
) {
    if (existingApplicationNumber) {
        const parsed = parseLegacyApplicationNumber(existingApplicationNumber);
        return {
            application_number: existingApplicationNumber,
            application_serial: existingApplicationSerial != null
                ? Number(existingApplicationSerial)
                : (parsed?.serial ?? null),
            college_code: parsed?.collegeCode || formatApplicationCode(collegeCode),
            course_code: parsed?.courseCode || formatApplicationCode(courseCode),
        };
    }

    if (!academicYear) {
        throw new Error('Academic year is required to generate a transport application number.');
    }

    const normalizedCollege = formatApplicationCode(collegeCode, 'UNK');
    const normalizedCourse = formatApplicationCode(courseCode, 'GEN');

    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();
        await ensureCountersTable(connection);

        await connection.query(
            `INSERT INTO ${COUNTERS_TABLE} (academic_year, college_code, course_code, last_serial)
             VALUES (?, ?, ?, 0)
             ON DUPLICATE KEY UPDATE college_code = college_code`,
            [academicYear, normalizedCollege, normalizedCourse]
        );

        const [counterRows] = await connection.query(
            `SELECT last_serial
             FROM ${COUNTERS_TABLE}
             WHERE academic_year = ? AND college_code = ? AND course_code = ?
             FOR UPDATE`,
            [academicYear, normalizedCollege, normalizedCourse]
        );

        const nextSerial = Number(counterRows[0]?.last_serial || 0) + 1;

        await connection.query(
            `UPDATE ${COUNTERS_TABLE}
             SET last_serial = ?
             WHERE academic_year = ? AND college_code = ? AND course_code = ?`,
            [nextSerial, academicYear, normalizedCollege, normalizedCourse]
        );

        await connection.commit();

        return {
            application_number: formatTransportApplicationNumber(
                normalizedCollege,
                normalizedCourse,
                nextSerial
            ),
            application_serial: nextSerial,
            college_code: normalizedCollege,
            course_code: normalizedCourse,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/** Read-only preview of the next serial for a college/course in an academic year. */
async function peekNextTransportApplicationNumber(
    mysqlPool,
    { academicYear, collegeCode, courseCode }
) {
    if (!academicYear) {
        throw new Error('Academic year is required to preview a transport application number.');
    }

    const normalizedCollege = formatApplicationCode(collegeCode, 'UNK');
    const normalizedCourse = formatApplicationCode(courseCode, 'GEN');

    let nextSerial = 1;
    try {
        const [counterRows] = await mysqlPool.query(
            `SELECT last_serial
             FROM ${COUNTERS_TABLE}
             WHERE academic_year = ? AND college_code = ? AND course_code = ?
             LIMIT 1`,
            [academicYear, normalizedCollege, normalizedCourse]
        );
        nextSerial = Number(counterRows[0]?.last_serial || 0) + 1;
    } catch (error) {
        if (error.code !== 'ER_NO_SUCH_TABLE') {
            throw error;
        }
    }

    return {
        application_number: formatTransportApplicationNumber(
            normalizedCollege,
            normalizedCourse,
            nextSerial
        ),
        application_serial: nextSerial,
        college_code: normalizedCollege,
        course_code: normalizedCourse,
        academic_year: academicYear,
    };
}

module.exports = {
    normalizeApplicationCode,
    formatApplicationCode,
    formatTransportApplicationNumber,
    parseLegacyApplicationNumber,
    assignTransportApplicationNumber,
    peekNextTransportApplicationNumber,
    COUNTERS_TABLE,
    LEGACY_COUNTERS_TABLE,
};
