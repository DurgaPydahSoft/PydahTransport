const Bus = require('../models/Bus');
const Route = require('../models/Route');
const { mysqlPool } = require('../config/db');

// @desc    Get bus details with assigned route, passenger list, seats filled
// @route   GET /api/buses/:id/details
// @access  Private/Admin
const getBusDetails = async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }
        let route = null;
        if (bus.assignedRouteId) {
            route = await Route.findOne({ routeId: bus.assignedRouteId });
        }
        let passengers = [];
        if (mysqlPool) {
            const [rows] = await mysqlPool.query(
                "SELECT id, admission_number, student_name, route_name, stage_name, fare, request_date FROM transport_requests WHERE bus_id = ? AND status = 'approved' ORDER BY stage_name, student_name",
                [bus.busNumber]
            );
            passengers = rows;
        }
        const capacity = bus.capacity || 0;
        const seatsFilled = passengers.length;
        const seatsAvailable = Math.max(0, capacity - seatsFilled);
        const occupancyPercent = capacity > 0 ? Math.min(100, Math.round((seatsFilled / capacity) * 100)) : 0;

        res.json({
            bus: {
                _id: bus._id,
                busNumber: bus.busNumber,
                capacity: bus.capacity,
                type: bus.type,
                driverName: bus.driverName,
                attendantName: bus.attendantName,
                status: bus.status,
                assignedRouteId: bus.assignedRouteId,
            },
            route: route ? {
                _id: route._id,
                routeId: route.routeId,
                routeName: route.routeName,
                startPoint: route.startPoint,
                endPoint: route.endPoint,
                totalDistance: route.totalDistance,
                estimatedTime: route.estimatedTime,
                stages: route.stages,
            } : null,
            passengers,
            seatsFilled,
            seatsAvailable,
            capacity,
            occupancyPercent,
        });
    } catch (error) {
        console.error('Error fetching bus details:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all buses with occupancy (for fleet / allocation page)
// @route   GET /api/buses/overview
// @access  Public
const getBusesOverview = async (req, res) => {
    try {
        const buses = await Bus.find().lean();
        const routeIds = [...new Set(buses.map((b) => b.assignedRouteId).filter(Boolean))];
        const routes = await Route.find({ routeId: { $in: routeIds } }).lean();
        const routeMap = Object.fromEntries(routes.map((r) => [r.routeId, r]));

        let counts = {};
        if (mysqlPool && buses.length > 0) {
            const busNumbers = buses.map((b) => b.busNumber);
            const placeholders = busNumbers.map(() => '?').join(',');
            const [rows] = await mysqlPool.query(
                `SELECT bus_id AS busNumber, COUNT(*) AS seatsFilled FROM transport_requests WHERE status = 'approved' AND bus_id IN (${placeholders}) GROUP BY bus_id`,
                busNumbers
            );
            counts = Object.fromEntries((rows || []).map((r) => [r.busNumber, Number(r.seatsFilled)]));
        }

        const list = buses.map((bus) => {
            const capacity = bus.capacity || 0;
            const seatsFilled = counts[bus.busNumber] || 0;
            const seatsAvailable = Math.max(0, capacity - seatsFilled);
            const occupancyPercent = capacity > 0 ? Math.min(100, Math.round((seatsFilled / capacity) * 100)) : 0;
            const route = bus.assignedRouteId ? routeMap[bus.assignedRouteId] : null;
            return {
                bus: {
                    _id: bus._id,
                    busNumber: bus.busNumber,
                    capacity: bus.capacity,
                    type: bus.type,
                    status: bus.status,
                    assignedRouteId: bus.assignedRouteId,
                },
                route: route ? { routeId: route.routeId, routeName: route.routeName } : null,
                seatsFilled,
                seatsAvailable,
                capacity,
                occupancyPercent,
            };
        });
        res.json(list);
    } catch (error) {
        console.error('Error fetching buses overview:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auto-allocate approved transport requests for this bus's route to this bus up to capacity
// @route   POST /api/buses/:id/auto-allocate
// @access  Private/Admin
const autoAllocate = async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);
        if (!bus) {
            return res.status(404).json({ message: 'Bus not found' });
        }
        if (!bus.assignedRouteId) {
            return res.status(400).json({ message: 'Assign this bus to a route first.' });
        }
        if (!mysqlPool) {
            return res.status(500).json({ message: 'MySQL connection not established' });
        }

        const capacity = bus.capacity || 0;
        const [current] = await mysqlPool.query(
            "SELECT COUNT(*) AS n FROM transport_requests WHERE bus_id = ? AND status = 'approved'",
            [bus.busNumber]
        );
        const currentFilled = current[0]?.n ?? 0;
        const slotsLeft = Math.max(0, capacity - currentFilled);
        if (slotsLeft === 0) {
            return res.json({ message: 'Bus is already full.', allocated: 0, seatsFilled: currentFilled, capacity });
        }

        const [unassigned] = await mysqlPool.query(
            "SELECT id FROM transport_requests WHERE route_id = ? AND status = 'approved' AND (bus_id IS NULL OR bus_id = '') ORDER BY request_date ASC, id ASC LIMIT ?",
            [bus.assignedRouteId, slotsLeft]
        );
        const toAssign = unassigned || [];
        for (const row of toAssign) {
            await mysqlPool.query('UPDATE transport_requests SET bus_id = ? WHERE id = ?', [bus.busNumber, row.id]);
        }
        const allocated = toAssign.length;
        res.json({
            message: allocated ? `Allocated ${allocated} passenger(s) to this bus.` : 'No unassigned approved requests for this route.',
            allocated,
            seatsFilled: currentFilled + allocated,
            capacity,
        });
    } catch (error) {
        console.error('Error auto-allocating:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all buses
// @route   GET /api/buses
// @access  Public
const getBuses = async (req, res) => {
    try {
        const buses = await Bus.find();
        res.json(buses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a bus
// @route   POST /api/buses
// @access  Private/Admin
const createBus = async (req, res) => {
    try {
        const bus = new Bus(req.body);
        const createdBus = await bus.save();
        res.status(201).json(createdBus);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update a bus
// @route   PUT /api/buses/:id
// @access  Private/Admin
const updateBus = async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);

        if (bus) {
            bus.busNumber = req.body.busNumber || bus.busNumber;
            bus.capacity = req.body.capacity || bus.capacity;
            bus.type = req.body.type || bus.type;
            bus.amenities = req.body.amenities || bus.amenities;
            bus.driverName = req.body.driverName || bus.driverName;
            bus.attendantName = req.body.attendantName || bus.attendantName;
            bus.status = req.body.status || bus.status;
            if (req.body.assignedRouteId !== undefined) bus.assignedRouteId = req.body.assignedRouteId || null;

            const updatedBus = await bus.save();
            res.json(updatedBus);
        } else {
            res.status(404).json({ message: 'Bus not found' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete a bus
// @route   DELETE /api/buses/:id
// @access  Private/Admin
const deleteBus = async (req, res) => {
    try {
        const bus = await Bus.findById(req.params.id);

        if (bus) {
            await bus.deleteOne();
            res.json({ message: 'Bus removed' });
        } else {
            res.status(404).json({ message: 'Bus not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getBuses,
    getBusesOverview,
    getBusDetails,
    autoAllocate,
    createBus,
    updateBus,
    deleteBus
};
