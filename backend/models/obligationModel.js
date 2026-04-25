const mongoose = require('mongoose');

const obligationSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: ['lease', 'utility'],
        required: true,
    },
    provider: {
        type: String,
        trim: true,
    },
    amount: {
        type: Number,
    },
    currency: {
        type: String,
        uppercase: true,
        default: 'EUR',
    },
    dueDate: {
        type: Date,
        index: true,
    },
    paid: {
        type: Boolean,
        default: false,
        index: true,
    },
    paidAt: {
        type: Date,
    },
    description: {
        type: String,
        trim: true,
    },
    confidence: {
        type: Number,
        min: 0,
        max: 1,
    },
}, { timestamps: true });

module.exports = mongoose.model('Obligation', obligationSchema);
