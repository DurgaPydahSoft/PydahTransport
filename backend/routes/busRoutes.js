const express = require('express');
const router = express.Router();
const {
    getBuses,
    getBusesOverview,
    getBusDetails,
    autoAllocate,
    createBus,
    updateBus,
    deleteBus
} = require('../controllers/busController');

router.get('/overview', getBusesOverview);
router.route('/').get(getBuses).post(createBus);
router.get('/:id/details', getBusDetails);
router.post('/:id/auto-allocate', autoAllocate);
router.route('/:id').put(updateBus).delete(deleteBus);

module.exports = router;
