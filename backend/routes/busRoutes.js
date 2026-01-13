const express = require('express');
const router = express.Router();
const {
    getBuses,
    createBus,
    updateBus,
    deleteBus
} = require('../controllers/busController');

router.route('/').get(getBuses).post(createBus);
router.route('/:id').put(updateBus).delete(deleteBus);

module.exports = router;
