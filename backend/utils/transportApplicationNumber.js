function formatTransportApplicationNumber(serial) {
    return String(serial).padStart(4, '0');
}

/**
 * Assign the next continuous application number for an academic year (approval only).
 * Uses row lock on transport_application_counters for concurrent approvals.
 */
async function assignTransportApplicationNumber(mysqlPool, academicYear, existingApplicationNumber = null, existingSerial = null) {
    if (existingApplicationNumber) {
        return {
            application_number: existingApplicationNumber,
            application_serial: existingSerial != null ? Number(existingSerial) : null,
        };
    }

    if (!academicYear) {
        throw new Error('Academic year is required to generate a transport application number.');
    }

    const connection = await mysqlPool.getConnection();
    try {
        await connection.beginTransaction();

        await connection.query(
            `INSERT INTO transport_application_counters (academic_year, last_serial)
             VALUES (?, 0)
             ON DUPLICATE KEY UPDATE academic_year = academic_year`,
            [academicYear]
        );

        const [counterRows] = await connection.query(
            `SELECT last_serial FROM transport_application_counters WHERE academic_year = ? FOR UPDATE`,
            [academicYear]
        );

        const nextSerial = Number(counterRows[0]?.last_serial || 0) + 1;

        await connection.query(
            `UPDATE transport_application_counters SET last_serial = ? WHERE academic_year = ?`,
            [nextSerial, academicYear]
        );

        await connection.commit();

        return {
            application_number: formatTransportApplicationNumber(nextSerial),
            application_serial: nextSerial,
        };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

/** Read-only preview of the next serial for an academic year (does not increment). */
async function peekNextTransportApplicationNumber(mysqlPool, academicYear) {
    if (!academicYear) {
        throw new Error('Academic year is required to preview a transport application number.');
    }

    const [counterRows] = await mysqlPool.query(
        'SELECT last_serial FROM transport_application_counters WHERE academic_year = ? LIMIT 1',
        [academicYear]
    );

    const nextSerial = Number(counterRows[0]?.last_serial || 0) + 1;

    return {
        application_number: formatTransportApplicationNumber(nextSerial),
        application_serial: nextSerial,
        academic_year: academicYear,
    };
}

module.exports = {
    formatTransportApplicationNumber,
    assignTransportApplicationNumber,
    peekNextTransportApplicationNumber,
};
