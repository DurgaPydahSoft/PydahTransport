const express = require('express');
const router = express.Router();
const {
    getTransportRequests,
    getSemesterOptions,
    updateTransportRequest,
    approveTransportRequest,
    rejectTransportRequest,
    createTransportRequest,
    getConcessions,
    getDashboardStats,
    updateConcession,
    deleteConcession,
    getApprovedPassengers,
    submitRouteChangeRequest
} = require('../controllers/transportRequestController');

router.get('/', getTransportRequests);
router.post('/', createTransportRequest);
router.get('/approved-passengers', getApprovedPassengers);
router.post('/change-request', submitRouteChangeRequest);
router.get('/concessions', getConcessions);
router.get('/stats', getDashboardStats);
router.patch('/:id/concession', updateConcession);
router.get('/:id/semester-options', getSemesterOptions);
router.patch('/:id/approve', approveTransportRequest);
router.patch('/:id/reject', rejectTransportRequest);
router.patch('/:id', updateTransportRequest);

router.delete('/:id/concession', deleteConcession);
router.delete('/:id', deleteConcession);

module.exports = router;
