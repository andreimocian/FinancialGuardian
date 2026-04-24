const Transaction = require('../models/transactionModel');
const { generateSeed } = require('../services/seedData');

exports.createTransaction = async (req, res) => {
    try {
        const { merchant, amount, currency, category, date, description, type } = req.body;

        if (!merchant || amount === undefined || amount === null) {
            return res.status(400).json({ message: 'merchant and amount are required' });
        }

        if (amount < 0) {
            return res.status(400).json({ message: 'amount must be positive; use type="income" or "expense"' });
        }

        const transaction = await Transaction.create({
            userId: req.user._id,
            merchant,
            amount,
            currency,
            category,
            date,
            description,
            type,
        });

        res.status(201).json({ status: 'success', transaction });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        const filter = { userId: req.user._id };
        if (req.query.type === 'income' || req.query.type === 'expense') {
            filter.type = req.query.type;
        }

        const transactions = await Transaction
            .find(filter)
            .sort({ date: -1 });

        res.status(200).json({
            status: 'success',
            count: transactions.length,
            transactions,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        const allowed = ['merchant', 'amount', 'currency', 'category', 'date', 'description', 'type'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updates,
            { new: true, runValidators: true }
        );

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json({ status: 'success', transaction });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.seedTransactions = async (req, res) => {
    try {
        await Transaction.deleteMany({ userId: req.user._id });
        const docs = await Transaction.insertMany(generateSeed(req.user._id));
        res.status(201).json({ status: 'success', count: docs.length });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteTransaction = async (req, res) => {
    try {
        const result = await Transaction.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!result) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
