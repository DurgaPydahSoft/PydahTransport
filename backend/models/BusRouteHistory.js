const mongoose = require('mongoose');

const busRouteHistorySchema = new mongoose.Schema({
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
    },
    busNumber: {
        type: String,
        required: true,
        trim: true,
    },
    routeId: {
        type: String,
        default: null,
    },
    routeName: {
        type: String,
        default: null,
    },
    previousRouteId: {
        type: String,
        default: null,
    },
    previousRouteName: {
        type: String,
        default: null,
    },
    assignedAt: {
        type: Date,
        default: Date.now,
    },
    action: {
        type: String,
        enum: ['assigned', 'changed', 'removed'],
        default: 'assigned',
    },
    changedBy: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('BusRouteHistory', busRouteHistorySchema);
