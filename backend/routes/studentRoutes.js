const express = require('express');
const router = express.Router();
const { searchStudents, getCourses } = require('../controllers/studentController');

router.get('/search', searchStudents);
router.get('/courses', getCourses);

module.exports = router;
