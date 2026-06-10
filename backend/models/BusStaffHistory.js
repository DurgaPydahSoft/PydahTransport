const mongoose = require('mongoose');

const busStaffHistorySchema = new mongoose.Schema({
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
    },
    busNumber: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ['driver', 'cleaner'],
        required: true,
    },
    staffName: {
        type: String,
        required: true,
        trim: true,
    },
    empNo: {
        type: String,
        trim: true,
    },
    entryDate: {
        type: Date,
        required: true,
    },
    exitDate: {
        type: Date,
        default: null,
    },
    isCurrent: {
        type: Boolean,
        default: true,
    },
    changedBy: {
        type: String,
        trim: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('BusStaffHistory', busStaffHistorySchema);
