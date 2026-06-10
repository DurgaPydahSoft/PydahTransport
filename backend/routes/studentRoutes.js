const express = require('express');
const router = express.Router();
const { searchStudents, getStudentProfile, getCourses, getCourseExpiry, setCourseExpiry, deleteCourseExpiry } = require('../controllers/studentController');

router.get('/search', searchStudents);
router.get('/profile', getStudentProfile);
router.get('/courses', getCourses);
router.get('/course-expiry', getCourseExpiry);
router.put('/course-expiry', setCourseExpiry);
router.delete('/course-expiry/:courseId', deleteCourseExpiry);

module.exports = router;
