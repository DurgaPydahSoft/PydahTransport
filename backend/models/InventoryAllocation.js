const mongoose = require('mongoose');

const inventoryAllocationSchema = new mongoose.Schema({
    busId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bus',
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'InventoryItem',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    allocatedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Allocated', 'Consumed', 'Returned'],
        default: 'Allocated'
    },
    remarks: {
        type: String,
        trim: true
    },
    adminName: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('InventoryAllocation', inventoryAllocationSchema);
