const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Admin = require('../models/Admin');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const { connectDB } = require('../config/db');
const { buses, routes } = require('../data/seedData');

dotenv.config();

connectDB();

const importData = async () => {
    try {
        // Admin Seeding
        const adminExists = await Admin.findOne({ username: 'superadmin' });
        if (!adminExists) {
            const admin = new Admin({
                username: 'superadmin',
                password: 'superadmin123'
            });
            await admin.save();
            console.log('Superadmin Created!');
        } else {
            console.log('Superadmin already exists.');
        }

        // Bus and Route Seeding
        // Clear existing data to avoid duplicates/conflicts (optional, but good for clean slate)
        await Bus.deleteMany();
        await Route.deleteMany();
        console.log('Data Destroyed!');

        await Bus.insertMany(buses);
        await Route.insertMany(routes);
        console.log('Buses and Routes Imported!');

        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    // destroyData(); // Implement if needed separately, but importData handles reset for now
} else {
    importData();
}
