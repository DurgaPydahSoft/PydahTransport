const express = require('express');
const router = express.Router();
const { getUsers, updateUserRole, deleteUserRole, searchEmployees } = require('../controllers/userController');

// Middleware to protect routes could be added here
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/search', protect, admin, searchEmployees);
router.get('/', protect, admin, getUsers);
router.put('/:id/role', protect, admin, updateUserRole);
router.delete('/:id/role', protect, admin, deleteUserRole);

module.exports = router;
