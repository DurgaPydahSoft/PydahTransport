const InventoryItem = require('../models/InventoryItem');
const InventoryAllocation = require('../models/InventoryAllocation');
const Bus = require('../models/Bus');

// Get all inventory items
exports.getItems = async (req, res) => {
    try {
        const items = await InventoryItem.find().sort({ itemName: 1 });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inventory items', error: error.message });
    }
};

// Create a new inventory item
exports.createItem = async (req, res) => {
    try {
        const { itemName, category, totalQuantity, unit, description } = req.body;
        
        const newItem = new InventoryItem({
            itemName,
            category,
            totalQuantity,
            availableQuantity: totalQuantity,
            unit,
            description
        });

        await newItem.save();
        res.status(201).json({ message: 'Item created successfully', item: newItem });
    } catch (error) {
        res.status(400).json({ message: 'Error creating inventory item', error: error.message });
    }
};

// Update an inventory item
exports.updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { itemName, category, totalQuantity, unit, description } = req.body;

        const item = await InventoryItem.findById(id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Adjust available quantity if total quantity changed
        const diff = totalQuantity - item.totalQuantity;
        item.itemName = itemName || item.itemName;
        item.category = category || item.category;
        item.totalQuantity = totalQuantity;
        item.availableQuantity += diff;
        item.unit = unit || item.unit;
        item.description = description || item.description;

        await item.save();
        res.status(200).json({ message: 'Item updated successfully', item });
    } catch (error) {
        res.status(400).json({ message: 'Error updating inventory item', error: error.message });
    }
};

// Delete an inventory item
exports.deleteItem = async (req, res) => {
    try {
        const { id } = req.params;
        const allocations = await InventoryAllocation.countDocuments({ itemId: id });
        
        if (allocations > 0) {
            return res.status(400).json({ message: 'Cannot delete item with active allocations' });
        }

        await InventoryItem.findByIdAndDelete(id);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting inventory item', error: error.message });
    }
};

// Allocate item to a bus
exports.allocateItem = async (req, res) => {
    try {
        const { busId, itemId, quantity, remarks, adminName } = req.body;

        const item = await InventoryItem.findById(itemId);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (item.availableQuantity < quantity) {
            return res.status(400).json({ message: 'Insufficient stock available' });
        }

        const bus = await Bus.findOne({ busNumber: busId }).catch(() => null) || await Bus.findById(busId).catch(() => null);
        if (!bus) return res.status(404).json({ message: 'Bus not found' });

        const allocation = new InventoryAllocation({
            busId: bus._id,
            itemId,
            quantity,
            remarks,
            adminName
        });

        await allocation.save();

        // Update item stock
        item.availableQuantity -= quantity;
        await item.save();

        res.status(201).json({ message: 'Item allocated successfully', allocation });
    } catch (error) {
        res.status(400).json({ message: 'Error allocating item', error: error.message });
    }
};

// Get allocation history
exports.getHistory = async (req, res) => {
    try {
        const { busId } = req.params;
        const query = {};
        
        if (busId && busId !== 'all') {
            // Find bus by number or ID
            const bus = await Bus.findOne({ busNumber: busId }).catch(() => null) || await Bus.findById(busId).catch(() => null);
            if (bus) query.busId = bus._id;
        }

        const history = await InventoryAllocation.find(query)
            .populate('itemId', 'itemName category unit')
            .populate('busId', 'busNumber type')
            .sort({ allocatedDate: -1 });

        res.status(200).json(history);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching allocation history', error: error.message });
    }
};
