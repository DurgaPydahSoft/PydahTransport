const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from one level up from scripts
dotenv.config({ path: path.join(__dirname, '../.env') });

const InventoryItem = require('../models/InventoryItem');
const { connectDB } = require('../config/db');

const items = [
    { itemName: 'Front Tyre (Heavy Duty)', category: 'Tires', unit: 'Pcs', description: 'Standard front tyre for passenger buses' },
    { itemName: 'Rear Tyre (Dual Traction)', category: 'Tires', unit: 'Pcs', description: 'Traction tyre for rear axle' },
    { itemName: 'Engine Oil (15W-40)', category: 'Lubricants', unit: 'Ltr', description: 'Premium diesel engine oil' },
    { itemName: 'Oil Filter', category: 'Mechanical', unit: 'Pcs', description: 'High-flow oil filter for long-haul buses' },
    { itemName: 'Brake Pad Set (Front)', category: 'Mechanical', unit: 'Set', description: 'High-performance ceramic brake pads' },
    { itemName: 'Air Filter (Primary)', category: 'Mechanical', unit: 'Pcs', description: 'Heavy-duty air intake filter' },
    { itemName: 'Headlight Bulb (H7 LED)', category: 'Electrical', unit: 'Pcs', description: 'Bright white LED headlight bulb' },
    { itemName: 'Windshield Wiper Blade', category: 'General', unit: 'Pcs', description: '24-inch heavy-duty wiper blade' },
    { itemName: 'Coolant (Pre-mixed)', category: 'Lubricants', unit: 'Can', description: 'Anti-freeze and anti-rust coolant' },
    { itemName: 'Fire Extinguisher (2Kg)', category: 'Safety', unit: 'Pcs', description: 'Dry powder fire extinguisher for bus cabin' },
    { itemName: 'First Aid Kit (Bus)', category: 'Safety', unit: 'Box', description: 'Mandatory first aid kit for commercial vehicles' },
    { itemName: 'Seat Cover (Blue Velvet)', category: 'Body & Interior', unit: 'Set', description: 'Standard blue seat covers for fleet consistency' },
    { itemName: 'Hand Sanitizer Refill', category: 'Cleaning', unit: 'Ltr', description: 'Bulk refill for passenger hand sanitizer' },
    { itemName: 'Side Mirror (Left)', category: 'Body & Interior', unit: 'Pcs', description: 'Adjustable wide-angle side mirror' },
    { itemName: 'Battery (12V 100Ah)', category: 'Electrical', unit: 'Pcs', description: 'Maintenance-free bus battery' }
];

const seedInventory = async () => {
    try {
        await connectDB();
        
        console.log('Clearing existing inventory items...');
        // Optional: comment this out if you just want to append
        // await InventoryItem.deleteMany({});
        
        console.log(`Seeding ${items.length} items...`);
        await InventoryItem.insertMany(items);
        
        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedInventory();
