const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    filename: {
        type: String,
        required: true,
    },
    mimeType: {
        type: String,
        default: 'application/pdf',
    },
    type: {
        type: String,
        enum: ['lease', 'utility', 'contract'],
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'extracted', 'failed'],
        default: 'pending',
    },
    extractionError: {
        type: String,
    },
    obligationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Obligation',
    },
    contractId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Contract',
    },
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);
