const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    merchant: {
        type: String,
        required: [true, 'Please provide a merchant'],
        trim: true,
    },
    amount: {
        type: Number,
        required: [true, 'Please provide an amount'],
    },
    currency: {
        type: String,
        default: 'USD',
        uppercase: true,
    },
    category: {
        type: String,
        trim: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    description: {
        type: String,
        trim: true,
    },
    type: {
        type: String,
        enum: ['expense', 'income'],
        default: 'expense',
        index: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
