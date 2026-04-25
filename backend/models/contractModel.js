const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        unique: true,
    },
    provider: {
        type: String,
        trim: true,
    },
    startDate: {
        type: Date,
    },
    endDate: {
        type: Date,
        index: true,
    },
    noticePeriodDays: {
        type: Number,
    },
    monthlyAmount: {
        type: Number,
    },
    currency: {
        type: String,
        uppercase: true,
        default: 'EUR',
    },
    cancellationTerms: {
        type: String,
    },
    autoRenew: {
        type: Boolean,
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'cancelled'],
        default: 'active',
        index: true,
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
    },
}, { timestamps: true });

module.exports = mongoose.model('Contract', contractSchema);
