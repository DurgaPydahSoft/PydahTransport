/* To reset the transport application number counter for an academic year */
/* node scripts/resetTransportApplicationCounter.js 2026-2027 --dry-run */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { mysqlPool, connectDB } = require('../config/db');
const EmployeeTransportRequest = require('../models/EmployeeTransportRequest');

const args = process.argv.slice(2).filter((a) => a !== '--dry-run');
const dryRun = process.argv.includes('--dry-run');
const academicYear = args[0] || process.env.CURRENT_ACADEMIC_YEAR;

async function countStudentAssignments(pool, year) {
    const [rows] = await pool.query(
        `SELECT COUNT(*) AS cnt
         FROM transport_requests
         WHERE COALESCE(academic_year, ?) = ?
           AND application_number IS NOT NULL`,
        [year, year]
    );
    return Number(rows[0]?.cnt || 0);
}

async function countEmployeeAssignments(year) {
    const docs = await EmployeeTransportRequest.find({
        application_number: { $ne: null },
    })
        .select('academic_year')
        .lean();
    return docs.filter((d) => (d.academic_year || year) === year).length;
}

async function getCounter(pool, year) {
    const [rows] = await pool.query(
        'SELECT academic_year, last_serial, updated_at FROM transport_application_counters WHERE academic_year = ? LIMIT 1',
        [year]
    );
    return rows[0] || null;
}

async function resetCounter(pool, year) {
    const [result] = await pool.query(
        'DELETE FROM transport_application_counters WHERE academic_year = ?',
        [year]
    );
    return result.affectedRows;
}

async function main() {
    if (!academicYear) {
        console.error('Academic year required. Example: node scripts/resetTransportApplicationCounter.js 2025-2026');
        process.exit(1);
    }
    if (!mysqlPool) {
        console.error('MySQL pool not available. Check MYSQL_* variables in backend/.env');
        process.exit(1);
    }

    console.log(`Academic year: ${academicYear}`);
    if (dryRun) console.log('Mode: dry-run (no changes will be made)\n');

    await connectDB();

    const studentCount = await countStudentAssignments(mysqlPool, academicYear);
    const employeeCount = await countEmployeeAssignments(academicYear);
    const counterBefore = await getCounter(mysqlPool, academicYear);

    console.log(`Student requests with application number: ${studentCount}`);
    console.log(`Employee requests with application number: ${employeeCount}`);
    console.log(
        counterBefore
            ? `Counter before: last_serial = ${counterBefore.last_serial} (updated ${counterBefore.updated_at})`
            : 'Counter before: no row for this academic year'
    );

    const totalAssigned = studentCount + employeeCount;
    if (totalAssigned > 0) {
        console.error(
            `\nAborted: ${totalAssigned} request(s) already have application numbers for ${academicYear}.`
        );
        console.error('Delete or reassign those records first, or pick another academic year.');
        process.exit(1);
    }

    if (dryRun) {
        console.log('\nDry-run OK. Would reset counter so the next approval gets 0001.');
        process.exit(0);
    }

    if (!counterBefore) {
        console.log('\nNo counter row exists. Next approval will already start at 0001 — nothing to reset.');
        process.exit(0);
    }

    const deleted = await resetCounter(mysqlPool, academicYear);
    const counterAfter = await getCounter(mysqlPool, academicYear);

    console.log(`\nReset complete. Deleted ${deleted} counter row(s).`);
    console.log(counterAfter ? `Counter after: last_serial = ${counterAfter.last_serial}` : 'Counter after: none (next approval → 0001)');
    process.exit(0);
}

main().catch((err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
