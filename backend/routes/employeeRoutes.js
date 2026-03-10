const express = require('express');
const router = express.Router();
const { getDrivers, getCleaners } = require('../controllers/employeeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/drivers', protect, admin, getDrivers);
router.get('/cleaners', protect, admin, getCleaners);

module.exports = router;
