const express = require('express');
const router = express.Router();
const {
    getRoutes,
    createRoute,
    updateRoute,
    deleteRoute
} = require('../controllers/routeController');

router.route('/').get(getRoutes).post(createRoute);
router.route('/:id').put(updateRoute).delete(deleteRoute);

module.exports = router;
