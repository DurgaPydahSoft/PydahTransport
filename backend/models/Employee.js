const mongoose = require('mongoose');
const { getEmployeeConnection } = require('../config/db');

const employeeSchema = new mongoose.Schema({
    emp_no: {
        type: String,
        required: true,
        unique: true
    },
    employee_name: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: false },
    toObject: { virtuals: false }
});

let EmployeeModel = null;

const getEmployeeModel = () => {
    const conn = getEmployeeConnection();
    if (!conn) {
        console.error('getEmployeeModel: Employee DB Connection is null');
        return null;
    }
    if (!EmployeeModel) {
        EmployeeModel = conn.model('Employee', employeeSchema);
    }
    return EmployeeModel;
};

module.exports = { getEmployeeModel };
