const mongoose = require('mongoose');
const { getEmployeeConnection } = require('../config/db');

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, required: true },
    scope: { type: String, default: 'global' },
    roles: [{ type: String }],
    employeeId: { type: String, required: true },
    employeeRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    dataScope: { type: String, default: 'department' },
    divisionMapping: [{
        division: { type: mongoose.Schema.Types.ObjectId, ref: 'Division' },
        departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }]
    }],
    preferences: {
        language: { type: String, default: 'en' }
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    featureControl: [{ type: String }],
    lastLogin: { type: Date }
}, {
    timestamps: true
});

let UserModel = null;

const getUserModel = () => {
    const conn = getEmployeeConnection();
    if (!conn) {
        console.error('getUserModel: Employee DB Connection is null');
        return null;
    }
    if (!UserModel) {
        UserModel = conn.model('User', userSchema, 'users'); // Explicitly specifying 'users' collection
    }
    return UserModel;
};

module.exports = { getUserModel };
