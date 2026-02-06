const express = require('express');
const router = express.Router();
const { getTransportDues } = require('../controllers/transportDuesController');

router.get('/', getTransportDues);

module.exports = router;
