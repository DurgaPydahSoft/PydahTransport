const express = require('express');
const router = express.Router();
const {
    getBuses,
    getBusesOverview,
    getBusDetails,
    getBusRouteHistory,
    getBusStaffHistory,
    autoAllocate,
    createBus,
    updateBus,
    deleteBus
} = require('../controllers/busController');

router.get('/overview', getBusesOverview);
router.route('/').get(getBuses).post(createBus);
router.get('/:id/details', getBusDetails);
router.get('/:id/history/route', getBusRouteHistory);
router.get('/:id/history/staff', getBusStaffHistory);
router.post('/:id/auto-allocate', autoAllocate);
router.route('/:id').put(updateBus).delete(deleteBus);

module.exports = router;
