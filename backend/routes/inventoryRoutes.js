const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

// Master Inventory
router.get('/', inventoryController.getItems);
router.post('/', inventoryController.createItem);
router.put('/:id', inventoryController.updateItem);
router.delete('/:id', inventoryController.deleteItem);

// Allocations
router.post('/allocate', inventoryController.allocateItem);
router.get('/history/:busId?', inventoryController.getHistory);

module.exports = router;
