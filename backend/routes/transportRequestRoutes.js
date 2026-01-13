const express = require('express');
const router = express.Router();
const { getTransportRequests } = require('../controllers/transportRequestController');

router.get('/', getTransportRequests);

module.exports = router;
