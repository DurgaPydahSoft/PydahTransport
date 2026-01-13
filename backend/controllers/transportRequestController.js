const { mysqlPool } = require('../config/db');

// @desc    Get all transport requests
// @route   GET /api/transport-requests
// @access  Private/Admin
const getTransportRequests = async (req, res) => {
    try {
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        const [rows] = await mysqlPool.query('SELECT * FROM transport_requests ORDER BY request_date DESC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching transport requests:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getTransportRequests
};
