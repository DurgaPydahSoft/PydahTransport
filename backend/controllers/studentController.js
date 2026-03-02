const { mysqlPool } = require('../config/db');

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

        // Search by name or admission number
        const sql = `
            SELECT id, admission_number, admission_no, student_name, course, branch, current_year, current_semester, stud_type
            FROM students
            WHERE student_name LIKE ? OR admission_number LIKE ? OR admission_no LIKE ?
            LIMIT 50
        `;
        const searchTerm = `%${q}%`;
        const [rows] = await mysqlPool.query(sql, [searchTerm, searchTerm, searchTerm]);

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

        const [rows] = await mysqlPool.query('SELECT id, name, code FROM courses WHERE is_active = 1 ORDER BY name ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    searchStudents,
    getCourses
};
