const mongoose = require('mongoose');
const mysql = require('mysql2/promise');

// Default MongoDB (Transport app: buses, routes, admin)
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected (Transport)');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

// Fee Management MongoDB (separate database for fee portal)
let feeConnection = null;
const connectFeeDB = async () => {
    if (!process.env.FEE_MONGO_URI) {
        console.warn('FEE_MONGO_URI not set – Fee Management features disabled');
        return;
    }
    try {
        feeConnection = mongoose.createConnection(process.env.FEE_MONGO_URI);
        await feeConnection.asPromise();
        console.log('MongoDB Connected (Fee Management)');
    } catch (error) {
        console.error('Fee MongoDB Connection Error:', error.message);
        feeConnection = null;
    }
};

// Employee Management MongoDB (HRMS)
let employeeConnection = null;
const connectEmployeeDB = async () => {
    if (!process.env.MONGO_EMPLOYEE_URI) {
        console.warn('MONGO_EMPLOYEE_URI not set – User Management features disabled');
        return;
    }
    try {
        employeeConnection = mongoose.createConnection(process.env.MONGO_EMPLOYEE_URI);
        await employeeConnection.asPromise();
        console.log('MongoDB Connected (HRMS Employee DB)');
    } catch (error) {
        console.error('Employee MongoDB Connection Error:', error.message);
        employeeConnection = null;
    }
};

const output = {
    connectDB,
    connectFeeDB,
    connectEmployeeDB,
    getFeeConnection: () => feeConnection,
    getEmployeeConnection: () => employeeConnection,
    mysqlPool: null
};

// Initialize MySQL Pool
try {
    output.mysqlPool = mysql.createPool({
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    console.log('MySQL Pool Initialized');
} catch (error) {
    console.error('MySQL Pool Error:', error.message);
}

module.exports = output;
