const { mysqlPool, getFeeConnection } = require('../config/db');
const { getFeePortalModels } = require('../models/fee-portal-models');
const Bus = require('../models/Bus');

const TRANSPORT_FEE_HEAD_CODE = 'TRN01';

// Get the last semester of the student's year (expiry = end of that semester).
async function getLastSemesterForRequest(mysqlPool, transportRequest) {
    const admissionNumber = transportRequest.admission_number || transportRequest.admission_no;
    if (!admissionNumber) return null;
    const [studentRows] = await mysqlPool.query(
        'SELECT course, current_year FROM students WHERE admission_number = ? OR admission_no = ? LIMIT 1',
        [admissionNumber, admissionNumber]
    );
    const student = studentRows[0];
    if (!student || !student.course) return null;
    const [courseRows] = await mysqlPool.query('SELECT id FROM courses WHERE name = ? LIMIT 1', [student.course]);
    const course = courseRows[0];
    if (!course) return null;
    const yearOfStudy = student.current_year != null ? Number(student.current_year) : 1;
    const [semRows] = await mysqlPool.query(
        'SELECT id, college_id, course_id, academic_year_id, year_of_study, semester_number, start_date, end_date FROM semesters WHERE course_id = ? AND year_of_study = ? ORDER BY academic_year_id DESC, semester_number DESC LIMIT 1',
        [course.id, yearOfStudy]
    );
    const row = semRows[0];
    if (!row) return null;
    return {
        id: row.id,
        college_id: row.college_id,
        course_id: row.course_id,
        academic_year_id: row.academic_year_id,
        year_of_study: row.year_of_study,
        semester_number: row.semester_number,
        start_date: row.start_date,
        end_date: row.end_date,
        expiry_date: row.end_date,
    };
}

// @desc    Get expiry for a transport request (last sem of student's year – for approve popup)
// @route   GET /api/transport-requests/:id/semester-options
// @access  Private/Admin
const getSemesterOptions = async (req, res) => {
    const requestId = req.params.id;
    if (!mysqlPool) {
        return res.status(500).json({ message: 'MySQL connection not established' });
    }
    try {
        const [reqRows] = await mysqlPool.query('SELECT * FROM transport_requests WHERE id = ?', [requestId]);
        const transportRequest = reqRows[0];
        if (!transportRequest) {
            return res.status(404).json({ message: 'Transport request not found' });
        }
        const admissionNumber = transportRequest.admission_number || transportRequest.admission_no;
        if (!admissionNumber) {
            return res.status(400).json({ message: 'Request has no admission number.' });
        }
        const lastSem = await getLastSemesterForRequest(mysqlPool, transportRequest);
        const [studentRows] = await mysqlPool.query(
            'SELECT course, current_year FROM students WHERE admission_number = ? OR admission_no = ? LIMIT 1',
            [admissionNumber, admissionNumber]
        );
        const student = studentRows[0] || {};
        const routeId = transportRequest.route_id || null;
        const routeName = transportRequest.route_name || null;
        let busesOnRoute = [];
        if (routeId) {
            const buses = await Bus.find({ assignedRouteId: routeId }).lean();
            if (mysqlPool && buses.length > 0) {
                const busNumbers = buses.map((b) => b.busNumber);
                const placeholders = busNumbers.map(() => '?').join(',');
                const [countRows] = await mysqlPool.query(
                    `SELECT bus_id AS busNumber, COUNT(*) AS seatsFilled FROM transport_requests WHERE status = 'approved' AND bus_id IN (${placeholders}) GROUP BY bus_id`,
                    busNumbers
                );
                const countMap = Object.fromEntries((countRows || []).map((r) => [r.busNumber, Number(r.seatsFilled)]));
                busesOnRoute = buses.map((b) => {
                    const capacity = b.capacity || 0;
                    const seatsFilled = countMap[b.busNumber] || 0;
                    return {
                        busNumber: b.busNumber,
                        capacity,
                        seatsFilled,
                        seatsAvailable: Math.max(0, capacity - seatsFilled),
                    };
                });
            } else {
                busesOnRoute = buses.map((b) => ({
                    busNumber: b.busNumber,
                    capacity: b.capacity || 0,
                    seatsFilled: 0,
                    seatsAvailable: b.capacity || 0,
                }));
            }
        }
        return res.json({
            requestId: Number(requestId),
            studentName: transportRequest.student_name,
            admissionNumber,
            course: student.course,
            yearOfStudy: student.current_year != null ? Number(student.current_year) : 1,
            route_id: routeId,
            route_name: routeName,
            busesOnRoute,
            expiry: lastSem
                ? {
                    expiry_date: lastSem.end_date,
                    year_of_study: lastSem.year_of_study,
                    semester_number: lastSem.semester_number,
                    label: `End of Year ${lastSem.year_of_study}, Sem ${lastSem.semester_number}`,
                    semester_id: lastSem.id,
                    semester_start_date: lastSem.start_date,
                    semester_end_date: lastSem.end_date,
                    academic_year_id: lastSem.academic_year_id,
                }
                : null,
        });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(503).json({ message: 'Semesters table not found. Please create it and run alter-transport-requests-semester.sql.' });
        }
        console.error('Error fetching semester options:', error);
        return res.status(500).json({ message: error.message || 'Failed to fetch expiry' });
    }
};

// @desc    Get all transport requests (optional filters: route_id, status, bus_id; bus_id=unassigned for null/empty)
// @route   GET /api/transport-requests
// @access  Private/Admin
const getTransportRequests = async (req, res) => {
    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }
        const { route_id, status, bus_id } = req.query;
        let sql = 'SELECT * FROM transport_requests WHERE 1=1';
        const params = [];
        if (route_id) {
            sql += ' AND route_id = ?';
            params.push(route_id);
        }
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        if (bus_id !== undefined) {
            if (bus_id === '' || bus_id === 'unassigned') {
                sql += ' AND (bus_id IS NULL OR bus_id = \'\')';
            } else {
                sql += ' AND bus_id = ?';
                params.push(bus_id);
            }
        }
        sql += ' ORDER BY request_date DESC';
        const [rows] = await mysqlPool.query(sql, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching transport requests:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a transport request (e.g. assign bus_id)
// @route   PATCH /api/transport-requests/:id
// @access  Private/Admin
const updateTransportRequest = async (req, res) => {
    const requestId = req.params.id;
    const { bus_id } = req.body || {};
    if (!mysqlPool) {
        return res.status(500).json({ message: 'MySQL connection not established' });
    }
    try {
        const [rows] = await mysqlPool.query('SELECT id FROM transport_requests WHERE id = ?', [requestId]);
        if (!rows[0]) {
            return res.status(404).json({ message: 'Transport request not found' });
        }
        await mysqlPool.query('UPDATE transport_requests SET bus_id = ? WHERE id = ?', [bus_id || null, requestId]);
        const [updated] = await mysqlPool.query('SELECT * FROM transport_requests WHERE id = ?', [requestId]);
        res.json(updated[0]);
    } catch (error) {
        console.error('Error updating transport request:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve transport request and create Transport Fee (TRN01) in Fee Management
// @route   PATCH /api/transport-requests/:id/approve
// @access  Private/Admin
const approveTransportRequest = async (req, res) => {
    const requestId = req.params.id;
    const { academicYear } = req.body || {};

    if (!mysqlPool) {
        return res.status(500).json({ message: 'MySQL connection not established' });
    }

    try {
        const [rows] = await mysqlPool.query(
            'SELECT * FROM transport_requests WHERE id = ?',
            [requestId]
        );
        const request = rows[0];
        if (!request) {
            return res.status(404).json({ message: 'Transport request not found' });
        }
        if (request.status === 'approved') {
            return res.status(400).json({ message: 'Request is already approved' });
        }
        if (request.status === 'rejected') {
            return res.status(400).json({ message: 'Request was rejected and cannot be approved' });
        }

        // Expiry = last semester of student's year (same regardless of which sem they applied in)
        const lastSem = await getLastSemesterForRequest(mysqlPool, request);

        const admissionNumber = request.admission_number || request.admission_no;
        if (!admissionNumber) {
            return res.status(400).json({
                message: 'Transport request has no admission number; cannot create fee in Fee Management.',
            });
        }

        const resolvedAcademicYear = academicYear || process.env.CURRENT_ACADEMIC_YEAR || getDefaultAcademicYear();
        if (!resolvedAcademicYear) {
            return res.status(400).json({
                message: 'Academic year is required. Set CURRENT_ACADEMIC_YEAR in env or send academicYear in request body (e.g. "2024-2025").',
            });
        }

        // Fetch student from MySQL for course, branch, batch, year, semester, category
        let student = null;
        if (admissionNumber) {
            const [studentRows] = await mysqlPool.query(
                'SELECT course, branch, batch, current_year, current_semester, stud_type FROM students WHERE admission_number = ? OR admission_no = ? LIMIT 1',
                [admissionNumber, admissionNumber]
            );
            student = studentRows[0] || null;
        }

        const college = process.env.FEE_DEFAULT_COLLEGE || 'Default';
        const course = student?.course || 'N/A';
        const branch = student?.branch || 'N/A';
        const batch = student?.batch || 'N/A';
        const studentYear = student?.current_year != null ? Number(student.current_year) : 1;
        const semester = student?.current_semester != null ? Number(student.current_semester) : null;
        const category = student?.stud_type || 'Regular';
        const amount = Number(request.fare);
        const studentName = request.student_name || '';
        const remarks = 'Transport';

        const feeModels = getFeePortalModels();
        if (!feeModels) {
            return res.status(503).json({
                message: 'Fee Management database is not configured or not connected. Set FEE_MONGO_URI and ensure Fee DB is connected.',
            });
        }

        const { FeeHead, StudentFee } = feeModels;
        const transportFeeHead = await FeeHead.findOne({ code: TRANSPORT_FEE_HEAD_CODE });
        if (!transportFeeHead) {
            return res.status(500).json({
                message: `Transport Fee Head (code: ${TRANSPORT_FEE_HEAD_CODE}) not found in Fee Management. Please seed Fee Heads.`,
            });
        }

        const existingFee = await StudentFee.findOne({
            studentId: String(admissionNumber),
            feeHead: transportFeeHead._id,
            academicYear: resolvedAcademicYear,
            studentYear,
            semester: semester || null,
            remarks,
        });
        if (existingFee) {
            if (lastSem) {
                await updateTransportRequestSemester(mysqlPool, requestId, {
                    semester_id: lastSem.id,
                    semester_start_date: lastSem.start_date,
                    semester_end_date: lastSem.end_date,
                    academic_year_id: lastSem.academic_year_id,
                    year_of_study: lastSem.year_of_study,
                    semester_number: lastSem.semester_number,
                });
            }
            await mysqlPool.query('UPDATE transport_requests SET status = ? WHERE id = ?', ['approved', requestId]);
            return res.json({
                message: 'Request approved. Transport fee for this student/year already exists in Fee Management.',
                requestId: Number(requestId),
                expiry_date: lastSem?.end_date || null,
            });
        }

        await StudentFee.create({
            studentId: String(admissionNumber),
            studentName: studentName,
            feeHead: transportFeeHead._id,
            college,
            course,
            branch,
            academicYear: resolvedAcademicYear,
            studentYear,
            semester: semester || undefined,
            amount,
            remarks,
        });

        if (lastSem) {
            await updateTransportRequestSemester(mysqlPool, requestId, {
                semester_id: lastSem.id,
                semester_start_date: lastSem.start_date,
                semester_end_date: lastSem.end_date,
                academic_year_id: lastSem.academic_year_id,
                year_of_study: lastSem.year_of_study,
                semester_number: lastSem.semester_number,
            });
        }
        await mysqlPool.query('UPDATE transport_requests SET status = ? WHERE id = ?', ['approved', requestId]);

        res.json({
            message: 'Transport request approved and Transport Fee (TRN01) created in Fee Management.',
            requestId: Number(requestId),
            academicYear: resolvedAcademicYear,
            amount,
            expiry_date: lastSem?.end_date || null,
        });
    } catch (error) {
        console.error('Error approving transport request:', error);
        res.status(500).json({ message: error.message || 'Failed to approve request' });
    }
};

// @desc    Reject transport request
// @route   PATCH /api/transport-requests/:id/reject
// @access  Private/Admin
const rejectTransportRequest = async (req, res) => {
    const requestId = req.params.id;

    if (!mysqlPool) {
        return res.status(500).json({ message: 'MySQL connection not established' });
    }

    try {
        const [rows] = await mysqlPool.query('SELECT id, status FROM transport_requests WHERE id = ?', [requestId]);
        const request = rows[0];
        if (!request) {
            return res.status(404).json({ message: 'Transport request not found' });
        }
        if (request.status === 'rejected') {
            return res.json({ message: 'Request was already rejected.', requestId: Number(requestId) });
        }
        if (request.status === 'approved') {
            return res.status(400).json({ message: 'Cannot reject an approved request.' });
        }

        await mysqlPool.query('UPDATE transport_requests SET status = ? WHERE id = ?', ['rejected', requestId]);
        res.json({ message: 'Transport request rejected.', requestId: Number(requestId) });
    } catch (error) {
        console.error('Error rejecting transport request:', error);
        res.status(500).json({ message: error.message || 'Failed to reject request' });
    }
};

function getDefaultAcademicYear() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0–11; assume July+ is next year start
    if (month >= 6) {
        return `${year}-${year + 1}`;
    }
    return `${year - 1}-${year}`;
}

async function updateTransportRequestSemester(mysqlPool, requestId, fields) {
    const {
        semester_id,
        semester_start_date,
        semester_end_date,
        academic_year_id,
        year_of_study,
        semester_number,
    } = fields || {};
    const hasAny =
        semester_id != null ||
        semester_start_date != null ||
        semester_end_date != null ||
        academic_year_id != null ||
        year_of_study != null ||
        semester_number != null;
    if (!hasAny) return;
    // expiry_date = semester end date (transport valid until end of that semester)
    const expiry_date = semester_end_date ?? null;
    await mysqlPool.query(
        `UPDATE transport_requests SET
      semester_id = ?, semester_start_date = ?, semester_end_date = ?,
      expiry_date = ?, academic_year_id = ?, year_of_study = ?, semester_number = ?
    WHERE id = ?`,
        [
            semester_id ?? null,
            semester_start_date ?? null,
            semester_end_date ?? null,
            expiry_date,
            academic_year_id ?? null,
            year_of_study ?? null,
            semester_number ?? null,
            requestId,
        ]
    );
}

module.exports = {
    getTransportRequests,
    getSemesterOptions,
    updateTransportRequest,
    approveTransportRequest,
    rejectTransportRequest,
};
