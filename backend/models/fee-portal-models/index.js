/**
 * Fee Portal models bound to the Fee Management MongoDB connection.
 * Use these when creating StudentFee / looking up FeeHead from the Transport app.
 * Requires FEE_MONGO_URI and connectFeeDB() to have been called at startup.
 */
const { getFeeConnection } = require('../../config/db');
const FeeHeadModel = require('./FeeHead');
const StudentFeeModel = require('./StudentFee');
const TransactionModel = require('./Transaction');

let FeeHead = null;
let StudentFee = null;
let Transaction = null;

function getFeePortalModels() {
    const conn = getFeeConnection();
    if (!conn) {
        return null;
    }
    if (!FeeHead) {
        FeeHead = conn.model('FeeHead', FeeHeadModel.schema);
    }
    if (!StudentFee) {
        StudentFee = conn.model('StudentFee', StudentFeeModel.schema);
    }
    if (!Transaction) {
        Transaction = conn.model('Transaction', TransactionModel.schema);
    }
    const TransportConcessionModel = require('./TransportConcession');
    const TransportConcession = conn.model('TransportConcession', TransportConcessionModel.schema);

    return { FeeHead, StudentFee, Transaction, TransportConcession };
}

module.exports = {
    getFeePortalModels,
    // Re-export original models for use in Fee Portal app (default connection)
    FeeHead: FeeHeadModel,
    StudentFee: StudentFeeModel,
};
