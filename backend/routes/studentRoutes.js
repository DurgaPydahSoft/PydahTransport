const express = require('express');
const router = express.Router();
const { searchStudents } = require('../controllers/studentController');

router.get('/search', searchStudents);

module.exports = router;
