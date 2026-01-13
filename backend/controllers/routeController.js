const Route = require('../models/Route');

// @desc    Get all routes
// @route   GET /api/routes
// @access  Public
const getRoutes = async (req, res) => {
    try {
        const routes = await Route.find();
        res.json(routes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a route
// @route   POST /api/routes
// @access  Private/Admin
const createRoute = async (req, res) => {
    try {
        const route = new Route(req.body);
        const createdRoute = await route.save();
        res.status(201).json(createdRoute);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a route
// @route   PUT /api/routes/:id
// @access  Private/Admin
const updateRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (route) {
            route.routeId = req.body.routeId || route.routeId;
            route.routeName = req.body.routeName || route.routeName;
            route.startPoint = req.body.startPoint || route.startPoint;
            route.endPoint = req.body.endPoint || route.endPoint;
            route.totalDistance = req.body.totalDistance || route.totalDistance;
            route.estimatedTime = req.body.estimatedTime || route.estimatedTime;
            route.stages = req.body.stages || route.stages;

            const updatedRoute = await route.save();
            res.json(updatedRoute);
        } else {
            res.status(404).json({ message: 'Route not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a route
// @route   DELETE /api/routes/:id
// @access  Private/Admin
const deleteRoute = async (req, res) => {
    try {
        const route = await Route.findById(req.params.id);

        if (route) {
            await route.deleteOne();
            res.json({ message: 'Route removed' });
        } else {
            res.status(404).json({ message: 'Route not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getRoutes,
    createRoute,
    updateRoute,
    deleteRoute
};
