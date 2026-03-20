const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Master Inventory
router.get('/', inventoryController.getItems);
router.post('/', inventoryController.createItem);
router.put('/:id', inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);

// Vendors
router.get('/vendors', inventoryController.getVendors);
router.post('/vendors', inventoryController.createVendor);
router.put('/vendors/:id', inventoryController.updateVendor);

// Bill / Allocate to Bus
router.post('/raise-bill', inventoryController.raiseBill);

// Allocations
router.post('/allocate', inventoryController.allocateItem);
router.get('/history/:busId?', inventoryController.getHistory);

// Tyre Registry
router.get('/tyre-registry/:busId?', inventoryController.getTyreRegistry);

module.exports = router;
