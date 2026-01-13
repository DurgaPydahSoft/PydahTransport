const mongoose = require('mongoose');
const mysql = require('mysql2/promise');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

const output = {
    connectDB,
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
