const { mysqlPool } = require('../config/db');
const { getDefaultAcademicYear, resolveAcademicYear } = require('./transportRequestController');

// @desc    Search students from MySQL
// @route   GET /api/students/search
// @access  Private/Admin
const searchStudents = async (req, res) => {
    const { q } = req.query;
    if (!q) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        // Search by name, admission number, or PIN number
        const sql = `
            SELECT id, admission_number, admission_no, pin_no, student_name, course, branch, current_year, current_semester, stud_type
            FROM students
            WHERE student_name LIKE ? OR admission_number LIKE ? OR admission_no LIKE ? OR pin_no LIKE ?
            LIMIT 50
        `;
        const searchTerm = `%${q}%`;
        const [rows] = await mysqlPool.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);

        res.json(rows);
    } catch (error) {
        console.error('Error searching students:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all courses from MySQL
// @route   GET /api/students/courses
// @access  Private/Admin
const getCourses = async (req, res) => {
    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        const [rows] = await mysqlPool.query('SELECT id, name, code, total_years FROM courses WHERE is_active = 1 ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    List course-level transport expiry dates for an academic year
// @route   GET /api/students/course-expiry?academicYear=2024-2025
const getCourseExpiry = async (req, res) => {
    const academicYear = resolveAcademicYear(req.query);
    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        const [rows] = await mysqlPool.query(
            `SELECT c.id AS course_id, c.name AS course_name, c.code AS course_code, c.total_years,
                    yrs.year_of_study,
                    cte.id AS expiry_id, cte.expiry_date, cte.academic_year,
                    CASE
                        WHEN cte.expiry_date IS NOT NULL AND CURDATE() > cte.expiry_date THEN 1
                        ELSE 0
                    END AS is_past,
                    COALESCE(pc.passenger_count, 0) AS passenger_count,
                    COALESCE(pc.active_passenger_count, 0) AS active_passenger_count,
                    COALESCE(pc.expired_passenger_count, 0) AS expired_passenger_count
             FROM courses c
             JOIN (
               SELECT 1 AS year_of_study UNION ALL SELECT 2 UNION ALL SELECT 3
               UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6
             ) yrs ON yrs.year_of_study <= c.total_years
             LEFT JOIN course_transport_expiry cte
               ON cte.course_id = c.id
              AND cte.academic_year = ?
              AND cte.year_of_study = yrs.year_of_study
             LEFT JOIN (
               SELECT
                 c2.id AS course_id,
                 COALESCE(s1.current_year, s2.current_year, tr.year_of_study, 1) AS year_of_study,
                 COUNT(*) AS passenger_count,
                 SUM(CASE
                   WHEN COALESCE(cte2.expiry_date, tr.expiry_date) IS NULL
                     OR CURDATE() <= COALESCE(cte2.expiry_date, tr.expiry_date)
                   THEN 1 ELSE 0
                 END) AS active_passenger_count,
                 SUM(CASE
                   WHEN COALESCE(cte2.expiry_date, tr.expiry_date) IS NOT NULL
                     AND CURDATE() > COALESCE(cte2.expiry_date, tr.expiry_date)
                   THEN 1 ELSE 0
                 END) AS expired_passenger_count
               FROM transport_requests tr
               LEFT JOIN students s1 ON tr.admission_number = s1.admission_number
               LEFT JOIN students s2 ON tr.admission_number = s2.admission_no AND s1.id IS NULL
               INNER JOIN courses c2 ON c2.name = COALESCE(s1.course, s2.course) AND c2.is_active = 1
               LEFT JOIN course_transport_expiry cte2
                 ON cte2.course_id = c2.id
                AND cte2.academic_year = ?
                AND cte2.year_of_study = COALESCE(s1.current_year, s2.current_year, tr.year_of_study, 1)
               WHERE tr.status = 'approved'
               GROUP BY c2.id, COALESCE(s1.current_year, s2.current_year, tr.year_of_study, 1)
             ) pc ON pc.course_id = c.id AND pc.year_of_study = yrs.year_of_study
             WHERE c.is_active = 1
             ORDER BY c.name ASC, yrs.year_of_study ASC`,
            [academicYear, academicYear]
        );

        res.json({ academicYear, courses: rows });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(503).json({
                message: 'Table course_transport_expiry not found. Run the SQL migration first.',
            });
        }
        console.error('Error fetching course expiry:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Set or update course-level transport expiry (overrides semester expiry for that course)
// @route   PUT /api/students/course-expiry
const setCourseExpiry = async (req, res) => {
    const { course_id, academic_year, expiry_date, year_of_study } = req.body || {};
    const academicYear = academic_year || resolveAcademicYear(req.body);
    const yearOfStudy = Number(year_of_study);

    if (!course_id || !expiry_date || !yearOfStudy || yearOfStudy < 1) {
        return res.status(400).json({ message: 'course_id, year_of_study, and expiry_date are required.' });
    }

    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        const [courseRows] = await mysqlPool.query(
            'SELECT id, name, total_years FROM courses WHERE id = ? AND is_active = 1 LIMIT 1',
            [course_id]
        );
        if (!courseRows[0]) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        if (yearOfStudy > courseRows[0].total_years) {
            return res.status(400).json({
                message: `Year ${yearOfStudy} is invalid for ${courseRows[0].name} (max ${courseRows[0].total_years} years).`,
            });
        }

        await mysqlPool.query(
            `INSERT INTO course_transport_expiry (course_id, academic_year, year_of_study, expiry_date)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE expiry_date = VALUES(expiry_date), updated_at = CURRENT_TIMESTAMP`,
            [course_id, academicYear, yearOfStudy, expiry_date]
        );

        const [saved] = await mysqlPool.query(
            `SELECT id, course_id, academic_year, year_of_study, expiry_date FROM course_transport_expiry
             WHERE course_id = ? AND academic_year = ? AND year_of_study = ? LIMIT 1`,
            [course_id, academicYear, yearOfStudy]
        );

        res.json({
            message: `Transport expiry set for ${courseRows[0].name} Year ${yearOfStudy} (${academicYear}). Passes expire on ${expiry_date}, regardless of semester dates.`,
            ...saved[0],
            course_name: courseRows[0].name,
        });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(503).json({
                message: 'Table course_transport_expiry not found. Run the SQL migration first.',
            });
        }
        console.error('Error setting course expiry:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Remove course-level transport expiry (falls back to per-request semester expiry)
// @route   DELETE /api/students/course-expiry/:courseId?academicYear=2024-2025
const deleteCourseExpiry = async (req, res) => {
    const courseId = req.params.courseId;
    const academicYear = resolveAcademicYear(req.query);
    const yearOfStudy = Number(req.query.yearOfStudy);

    if (!yearOfStudy || yearOfStudy < 1) {
        return res.status(400).json({ message: 'Query parameter yearOfStudy is required (e.g. 1, 2, 3).' });
    }

    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        const [result] = await mysqlPool.query(
            'DELETE FROM course_transport_expiry WHERE course_id = ? AND academic_year = ? AND year_of_study = ?',
            [courseId, academicYear, yearOfStudy]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'No course expiry record found for this course, academic year, and year of study.',
            });
        }

        res.json({
            message: 'Course transport expiry removed.',
            course_id: Number(courseId),
            academic_year: academicYear,
            year_of_study: yearOfStudy,
        });
    } catch (error) {
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return res.status(503).json({
                message: 'Table course_transport_expiry not found. Run the SQL migration first.',
            });
        }
        console.error('Error deleting course expiry:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    searchStudents,
    getCourses,
    getCourseExpiry,
    setCourseExpiry,
    deleteCourseExpiry,
};
