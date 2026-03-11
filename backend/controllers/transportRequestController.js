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
        const { route_id, status, bus_id, course, search } = req.query;
        let sql = 'SELECT tr.*, s.course FROM transport_requests tr LEFT JOIN students s ON (tr.admission_number = s.admission_number OR tr.admission_number = s.admission_no)';
        const params = [];

        sql += ' WHERE 1=1';

        if (route_id) {
            sql += ' AND tr.route_id = ?';
            params.push(route_id);
        }
        if (status) {
            sql += ' AND tr.status = ?';
            params.push(status);
        }
        if (bus_id !== undefined) {
            if (bus_id === '' || bus_id === 'unassigned') {
                sql += ' AND (tr.bus_id IS NULL OR tr.bus_id = \'\')';
            } else {
                sql += ' AND tr.bus_id = ?';
                params.push(bus_id);
            }
        }
        if (course) {
            sql += ' AND s.course = ?';
            params.push(course);
        }
        if (search) {
            sql += ' AND (tr.student_name LIKE ? OR tr.admission_number LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern);
        }

        sql += ' ORDER BY tr.request_date DESC';
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

        const { FeeHead, StudentFee, TransportConcession } = feeModels;
        const transportFeeHead = await FeeHead.findOne({ code: TRANSPORT_FEE_HEAD_CODE });
        if (!transportFeeHead) {
            return res.status(500).json({
                message: `Transport Fee Head (code: ${TRANSPORT_FEE_HEAD_CODE}) not found in Fee Management. Please seed Fee Heads.`,
            });
        }

        // Check for persistent concession
        let finalAmount = amount;
        if (TransportConcession) {
            const persistentConcession = await TransportConcession.findOne({
                studentId: String(admissionNumber),
                feeHead: transportFeeHead._id
            });
            if (persistentConcession && persistentConcession.yearConcessions) {
                const yearKey = String(studentYear);
                const concessionForYear = persistentConcession.yearConcessions.get(yearKey);
                if (concessionForYear !== undefined && concessionForYear !== null) {
                    finalAmount = concessionForYear;
                }
            }
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
            amount: finalAmount,
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

// @desc    Create a transport request (Admin or Student)
// @route   POST /api/transport-requests
// @access  Private/Admin
const createTransportRequest = async (req, res) => {
    const {
        admission_number,
        student_name,
        route_id,
        route_name,
        stage_name,
        fare,
        raised_by = 'student',
        raised_by_id = null
    } = req.body;

    if (!mysqlPool) {
        return res.status(500).json({ message: 'MySQL connection not established' });
    }

    try {
        // Fetch student's current year if not provided
        let yearOfStudy = 1;
        if (admission_number) {
            const [studentRows] = await mysqlPool.query(
                'SELECT current_year FROM students WHERE admission_number = ? OR admission_no = ? LIMIT 1',
                [admission_number, admission_number]
            );
            if (studentRows[0] && studentRows[0].current_year != null) {
                yearOfStudy = Number(studentRows[0].current_year);
            }
        }

        const sql = `
            INSERT INTO transport_requests 
            (admission_number, student_name, route_id, route_name, stage_name, fare, raised_by, raised_by_id, status, year_of_study)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
        `;
        const [result] = await mysqlPool.query(sql, [
            admission_number,
            student_name,
            route_id,
            route_name,
            stage_name,
            fare,
            raised_by,
            raised_by_id,
            yearOfStudy
        ]);

        const [newRequest] = await mysqlPool.query('SELECT * FROM transport_requests WHERE id = ?', [result.insertId]);
        res.status(201).json(newRequest[0]);
    } catch (error) {
        console.error('Error creating transport request:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get data for Concessions Management
// @route   GET /api/transport-requests/concessions
// @access  Private/Admin
const getConcessions = async (req, res) => {
    const { course, route_id, search } = req.query;
    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        const feeModels = getFeePortalModels();
        if (!feeModels) {
            return res.status(503).json({ message: 'Fee Management database connection not available' });
        }

        const { StudentFee, FeeHead, TransportConcession } = feeModels;
        const transportFeeHead = await FeeHead.findOne({ code: TRANSPORT_FEE_HEAD_CODE });

        if (!transportFeeHead) {
            return res.status(500).json({ message: 'Transport Fee Head not found' });
        }

        const { page = 1, limit = 10 } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        // 1. Fetch total count for pagination
        let countSql = `
            SELECT COUNT(*) as total
            FROM transport_requests tr
            LEFT JOIN students s ON (tr.admission_number = s.admission_number OR tr.admission_number = s.admission_no)
            WHERE tr.status = 'approved' 
        `;
        const countParams = [];

        if (course) {
            countSql += ` AND s.course = ?`;
            countParams.push(course);
        }

        if (route_id) {
            countSql += ` AND tr.route_id = ?`;
            countParams.push(route_id);
        }

        if (search) {
            countSql += ` AND tr.student_name LIKE ?`;
            countParams.push(`%${search}%`);
        }

        const [[{ total }]] = await mysqlPool.query(countSql, countParams);

        // 1. Fetch approved requests from MySQL, including course duration and filters
        let sql = `
            SELECT tr.*, c.total_years as total_course_years 
            FROM transport_requests tr
            LEFT JOIN students s ON (tr.admission_number = s.admission_number OR tr.admission_number = s.admission_no)
            LEFT JOIN courses c ON s.course = c.name
            WHERE tr.status = 'approved' 
        `;
        const params = [];

        if (course) {
            sql += ` AND s.course = ?`;
            params.push(course);
        }

        if (route_id) {
            sql += ` AND tr.route_id = ?`;
            params.push(route_id);
        }

        if (search) {
            sql += ` AND tr.student_name LIKE ?`;
            params.push(`%${search}%`);
        }

        sql += ` ORDER BY tr.request_date DESC LIMIT ? OFFSET ?`;
        params.push(Number(limit), offset);

        const [requests] = await mysqlPool.query(sql, params);

        if (requests.length === 0) {
            return res.json({ 
                data: [], 
                pagination: { 
                    total, 
                    pages: Math.ceil(total / limit), 
                    currentPage: Number(page),
                    limit: Number(limit)
                } 
            });
        }

        // 2. Cross-reference with StudentFee and TransportConcession in MongoDB
        const admissionNumbers = requests.map(r => String(r.admission_number || r.admission_no));

        const [fees, concessions] = await Promise.all([
            StudentFee.find({
                studentId: { $in: admissionNumbers },
                feeHead: transportFeeHead._id
            }).lean(),
            TransportConcession ? TransportConcession.find({
                studentId: { $in: admissionNumbers },
                feeHead: transportFeeHead._id
            }).lean() : Promise.resolve([])
        ]);

        const feeMap = {};
        fees.forEach(f => {
            feeMap[f.studentId] = f;
        });

        const concessionMap = {};
        concessions.forEach(c => {
            concessionMap[c.studentId] = c;
        });

        const data = requests.map(req => {
            const studentId = String(req.admission_number || req.admission_no);
            const fee = feeMap[studentId];
            const persistent = concessionMap[studentId];
            return {
                id: req.id,
                admission_number: req.admission_number,
                student_name: req.student_name,
                route_id: req.route_id,
                route_name: req.route_name,
                stage_name: req.stage_name,
                original_fare: req.fare,
                current_fee: fee ? fee.amount : null,
                fee_id: fee ? fee._id : null,
                student_year: fee ? fee.studentYear : null,
                yearConcessions: persistent ? persistent.yearConcessions : {},
                total_course_years: req.total_course_years || 4,
                updated_at: req.updated_at
            };
        });

        res.json({
            data,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: Number(page),
                limit: Number(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching concessions:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update fee concession
// @route   PATCH /api/transport-requests/:id/concession
// @access  Private/Admin
const updateConcession = async (req, res) => {
    const { id } = req.params; // transport_request id
    const { revised_amount, admin_name, admin_id, targetYear } = req.body;

    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        const [rows] = await mysqlPool.query('SELECT * FROM transport_requests WHERE id = ?', [id]);
        const request = rows[0];

        if (!request) {
            return res.status(404).json({ message: 'Transport request not found' });
        }

        const feeModels = getFeePortalModels();
        const { StudentFee, FeeHead, TransportConcession } = feeModels;
        const transportFeeHead = await FeeHead.findOne({ code: TRANSPORT_FEE_HEAD_CODE });

        const studentId = String(request.admission_number || request.admission_no);

        // 1. Update/Create persistent concession logic
        if (TransportConcession && targetYear) {
            let persistent = await TransportConcession.findOne({ studentId, feeHead: transportFeeHead._id });
            if (!persistent) {
                persistent = new TransportConcession({
                    studentId,
                    feeHead: transportFeeHead._id,
                    yearConcessions: new Map(),
                });
            }
            
            persistent.yearConcessions.set(String(targetYear), Number(revised_amount));
            persistent.updatedBy = admin_name;
            await persistent.save();
        }

        // 2. Update current active StudentFee if years match
        const fee = await StudentFee.findOne({
            studentId,
            feeHead: transportFeeHead._id
        });

        if (fee && String(fee.studentYear) === String(targetYear)) {
            fee.amount = Number(revised_amount);
            await fee.save();
        }

        // Log to audit logs in MySQL
        const auditDetails = JSON.stringify({
            action: 'fee_concession',
            target_year: targetYear,
            new_fee: revised_amount,
            admin_name
        });

        await mysqlPool.query(
            'INSERT INTO audit_logs (action_type, entity_type, entity_id, admin_id, details) VALUES (?, ?, ?, ?, ?)',
            ['FEE_ADJUSTMENT', 'TRANSPORT_REQUEST', String(id), admin_id || null, auditDetails]
        );

        res.json({ message: 'Concession updated successfully', targetYear, new_amount: revised_amount });

    } catch (error) {
        console.error('Error updating concession:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete concession and associated student fee
// @route   DELETE /api/transport-requests/:id/concession
// @access  Private/Admin
const deleteConcession = async (req, res) => {
    const { id } = req.params; // transport_request id
    const { admin_name, admin_id } = req.body;

    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        const [rows] = await mysqlPool.query('SELECT * FROM transport_requests WHERE id = ?', [id]);
        const request = rows[0];

        if (!request) {
            return res.status(404).json({ message: 'Transport request not found' });
        }

        const feeModels = getFeePortalModels();
        const { StudentFee, FeeHead, TransportConcession } = feeModels;
        const transportFeeHead = await FeeHead.findOne({ code: TRANSPORT_FEE_HEAD_CODE });

        const studentId = String(request.admission_number || request.admission_no);

        // 1. Delete persistent concession
        if (TransportConcession) {
            await TransportConcession.deleteOne({ studentId, feeHead: transportFeeHead._id });
        }

        // 2. Delete active StudentFee
        const fee = await StudentFee.findOne({
            studentId,
            feeHead: transportFeeHead._id
        });

        if (fee) {
            await fee.deleteOne();
        }

        // 3. Delete MySQL Transport Request
        await mysqlPool.query('DELETE FROM transport_requests WHERE id = ?', [id]);

        // Log to audit logs in MySQL
        const auditDetails = JSON.stringify({
            action: 'delete_concession',
            student_id: studentId,
            admin_name
        });

        await mysqlPool.query(
            'INSERT INTO audit_logs (action_type, entity_type, entity_id, admin_id, details) VALUES (?, ?, ?, ?, ?)',
            ['FEE_DELETION', 'TRANSPORT_REQUEST', String(id), admin_id || null, auditDetails]
        );

        res.json({ message: 'Concession, fee, and transport request deleted successfully' });

    } catch (error) {
        console.error('Error deleting concession:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTransportRequests,
    getSemesterOptions,
    updateTransportRequest,
    approveTransportRequest,
    rejectTransportRequest,
    createTransportRequest,
    getConcessions,
    updateConcession,
    deleteConcession
};
