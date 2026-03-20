const mongoose = require('mongoose');

const inventoryItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        default: 'General'
    },
    unit: {
        type: String,
        required: true,
        default: 'Pcs'
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('InventoryItem', inventoryItemSchema);
