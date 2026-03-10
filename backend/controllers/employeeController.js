const { getEmployeeConnection } = require('../config/db');

// @desc    Get all employees with designation 'DRIVER' from HRMS
// @route   GET /api/employees/drivers
// @access  Private/Admin
const getDrivers = async (req, res) => {
    try {
        const conn = getEmployeeConnection();
        if (!conn) {
            return res.status(503).json({ message: 'Employee DB connection not available' });
        }

        const designationsCollection = conn.collection('designations');
        const employeesCollection = conn.collection('employees');

        const driverDesignation = await designationsCollection.findOne({ 
            name: { $regex: /^DRIVER$/i } 
        });

        if (!driverDesignation) {
            return res.json([]);
        }

        const drivers = await employeesCollection.find({
            designation_id: driverDesignation._id,
            is_active: true
        }).project({
            emp_no: 1,
            employee_name: 1,
            phone_number: 1,
            is_active: 1
        }).toArray();

        res.json(drivers);
    } catch (error) {
        console.error('Error fetching drivers:', error);
        res.status(500).json({ message: 'Failed to fetch drivers' });
    }
};

// @desc    Get all employees with designation 'CLEANER' from HRMS
// @route   GET /api/employees/cleaners
// @access  Private/Admin
const getCleaners = async (req, res) => {
    try {
        const conn = getEmployeeConnection();
        if (!conn) {
            return res.status(503).json({ message: 'Employee DB connection not available' });
        }

        const designationsCollection = conn.collection('designations');
        const employeesCollection = conn.collection('employees');

        const cleanerDesignation = await designationsCollection.findOne({ 
            name: { $regex: /^CLEANER$/i } 
        });

        if (!cleanerDesignation) {
            return res.json([]);
        }

        const cleaners = await employeesCollection.find({
            designation_id: cleanerDesignation._id,
            is_active: true
        }).project({
            emp_no: 1,
            employee_name: 1,
            phone_number: 1,
            is_active: 1
        }).toArray();

        res.json(cleaners);
    } catch (error) {
        console.error('Error fetching cleaners:', error);
        res.status(500).json({ message: 'Failed to fetch cleaners' });
    }
};

module.exports = { getDrivers, getCleaners };
