const Bus = require('../models/Bus');
const Route = require('../models/Route');
const { mysqlPool } = require('../config/db');
const EmployeeTransportRequest = require('../models/EmployeeTransportRequest');
const { resolveAcademicYear, getActivePassengerSqlParts } = require('./transportRequestController');

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
        let mysqlPassengers = [];
        if (mysqlPool) {
            const parts = getActivePassengerSqlParts(resolveAcademicYear(req.query));
            const [rows] = await mysqlPool.query(
                `SELECT tr.id, tr.admission_number, tr.student_name, tr.route_name, tr.stage_name, tr.fare, tr.request_date, tr.bus_id,
                        COALESCE(s1.course, s2.course) as course,
                        COALESCE(s1.branch, s2.branch) as branch,
                        COALESCE(s1.pin_no, s2.pin_no) as pin_no,
                        ${parts.effectiveExpiryExpr} as effective_expiry_date,
                        ${parts.isExpiredExpr} as is_expired
                 FROM transport_requests tr
                 ${parts.studentJoins}
                 ${parts.expiryJoins}
                 WHERE tr.bus_id = ? AND tr.status = 'approved'
                 ORDER BY tr.stage_name, tr.student_name`,
                [...parts.expiryParams, bus.busNumber]
            );
            mysqlPassengers = rows.map(r => ({
                ...r,
                user_type: 'student',
                is_expired: Boolean(r.is_expired),
            }));
        }

        const mongoRequests = await EmployeeTransportRequest.find({ bus_id: bus.busNumber, status: 'approved' }).lean();
        const mongoPassengers = mongoRequests.map(r => ({
            id: r._id.toString(),
            admission_number: r.emp_no,
            student_name: r.employee_name,
            route_name: r.route_name,
            stage_name: r.stage_name,
            fare: r.fare,
            request_date: r.request_date || r.created_at,
            user_type: 'employee',
            bus_id: r.bus_id,
            course: 'Employee'
        }));

        const activePassengers = mysqlPassengers.filter((p) => !p.is_expired);
        const expiredPassengers = mysqlPassengers.filter((p) => p.is_expired);
        const passengers = [...activePassengers, ...mongoPassengers, ...expiredPassengers];
        passengers.sort((a, b) => a.stage_name.localeCompare(b.stage_name) || a.student_name.localeCompare(b.student_name));
        const capacity = bus.capacity || 0;
        const seatsFilled = activePassengers.length + mongoPassengers.length;
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
            expiredPassengers,
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
            const parts = getActivePassengerSqlParts(resolveAcademicYear(req.query));
            const busNumbers = buses.map((b) => b.busNumber);
            const placeholders = busNumbers.map(() => '?').join(',');
            const [rows] = await mysqlPool.query(
                `SELECT tr.bus_id AS busNumber, COUNT(*) AS seatsFilled
                 FROM transport_requests tr
                 ${parts.studentJoins}
                 ${parts.expiryJoins}
                 WHERE tr.status = 'approved' AND ${parts.activeWhere} AND tr.bus_id IN (${placeholders})
                 GROUP BY tr.bus_id`,
                [...parts.expiryParams, ...busNumbers]
            );
            const mysqlCounts = Object.fromEntries((rows || []).map((r) => [r.busNumber, Number(r.seatsFilled)]));
            
            const mongoCountsRaw = await EmployeeTransportRequest.aggregate([
                { $match: { status: 'approved', bus_id: { $in: busNumbers } } },
                { $group: { _id: '$bus_id', count: { $sum: 1 } } }
            ]);
            const mongoCounts = Object.fromEntries(mongoCountsRaw.map(r => [r._id, r.count]));

            busNumbers.forEach(bn => {
                counts[bn] = (mysqlCounts[bn] || 0) + (mongoCounts[bn] || 0);
            });
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
        const parts = getActivePassengerSqlParts(resolveAcademicYear(req.query));
        const [current] = await mysqlPool.query(
            `SELECT COUNT(*) AS n
             FROM transport_requests tr
             ${parts.studentJoins}
             ${parts.expiryJoins}
             WHERE tr.bus_id = ? AND tr.status = 'approved' AND ${parts.activeWhere}`,
            [...parts.expiryParams, bus.busNumber]
        );
        const currentFilled = current[0]?.n ?? 0;
        const slotsLeft = Math.max(0, capacity - currentFilled);
        if (slotsLeft === 0) {
            return res.json({ message: 'Bus is already full.', allocated: 0, seatsFilled: currentFilled, capacity });
        }

        const [unassigned] = await mysqlPool.query(
            `SELECT tr.id
             FROM transport_requests tr
             ${parts.studentJoins}
             ${parts.expiryJoins}
             WHERE tr.route_id = ? AND tr.status = 'approved' AND ${parts.activeWhere}
               AND (tr.bus_id IS NULL OR tr.bus_id = '')
             ORDER BY tr.request_date ASC, tr.id ASC
             LIMIT ?`,
            [...parts.expiryParams, bus.assignedRouteId, slotsLeft]
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
