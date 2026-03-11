const mongoose = require('mongoose');

const transportConcessionSchema = mongoose.Schema({
  studentId: {
    type: String, // Admission Number
    required: true,
  },
  feeHead: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FeeHead',
    required: true,
  },
  // Map of year (string "1", "2", "3", "4") to concession amount (Number)
  yearConcessions: {
    type: Map,
    of: Number,
    default: {},
  },
  remarks: {
    type: String,
  },
  updatedBy: {
    type: String, // Admin Name
  }
}, {
  timestamps: true,
});

// One concession config per student per fee head
transportConcessionSchema.index({ studentId: 1, feeHead: 1 }, { unique: true });

const TransportConcession = mongoose.model('TransportConcession', transportConcessionSchema);
TransportConcession.schema = transportConcessionSchema;

module.exports = TransportConcession;
