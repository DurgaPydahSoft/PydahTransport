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
    updateConcession,
    deleteConcession
} = require('../controllers/transportRequestController');

router.get('/', getTransportRequests);
router.post('/', createTransportRequest);
router.get('/concessions', getConcessions);
router.patch('/:id/concession', updateConcession);
router.get('/:id/semester-options', getSemesterOptions);
router.patch('/:id/approve', approveTransportRequest);
router.patch('/:id/reject', rejectTransportRequest);
router.patch('/:id', updateTransportRequest);

router.delete('/:id/concession', deleteConcession);
router.delete('/:id', deleteConcession);

module.exports = router;
