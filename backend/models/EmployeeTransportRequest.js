const mongoose = require('mongoose');

const employeeTransportRequestSchema = new mongoose.Schema({
    emp_no: {
        type: String,
        required: true
    },
    employee_name: {
        type: String,
        required: true
    },
    route_id: {
        type: String,
        required: true
    },
    route_name: {
        type: String,
        required: true
    },
    stage_name: {
        type: String,
        required: true
    },
    bus_id: {
        type: String,
        default: null
    },
    fare: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    raised_by: {
        type: String,
        default: 'employee'
    },
    raised_by_id: {
        type: String,
        default: null
    },
    academic_year: {
        type: String,
        default: null
    },
    application_number: {
        type: String,
        default: null
    },
    application_serial: {
        type: Number,
        default: null
    },
    request_date: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const EmployeeTransportRequest = mongoose.model('EmployeeTransportRequest', employeeTransportRequestSchema);

module.exports = EmployeeTransportRequest;
