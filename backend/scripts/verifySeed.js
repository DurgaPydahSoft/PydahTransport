const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const { connectDB } = require('../config/db');

dotenv.config();
connectDB();

const verify = async () => {
    try {
        const busCount = await Bus.countDocuments();
        const routeCount = await Route.countDocuments();
        console.log(`Buses count: ${busCount}`);
        console.log(`Routes count: ${routeCount}`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

verify();
