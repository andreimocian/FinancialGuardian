const Contract = require('../models/contractModel');

const ALLOWED_FIELDS = [
    'provider', 'startDate', 'endDate', 'noticePeriodDays',
    'monthlyAmount', 'currency', 'cancellationTerms', 'autoRenew',
    'description', 'status',
];

exports.getContracts = async (req, res) => {
    try {
        const filter = { userId: req.user._id };
        if (req.query.status) filter.status = req.query.status;

        const contracts = await Contract
            .find(filter)
            .sort({ endDate: 1 });

        res.status(200).json({
            status: 'success',
            count: contracts.length,
            contracts,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getContract = async (req, res) => {
    try {
        const contract = await Contract.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!contract) return res.status(404).json({ message: 'Contract not found' });
        res.status(200).json({ status: 'success', contract });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateContract = async (req, res) => {
    try {
        const updates = {};
        for (const key of ALLOWED_FIELDS) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const contract = await Contract.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updates,
            { new: true, runValidators: true }
        );
        if (!contract) return res.status(404).json({ message: 'Contract not found' });

        res.status(200).json({ status: 'success', contract });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteContract = async (req, res) => {
    try {
        const result = await Contract.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!result) return res.status(404).json({ message: 'Contract not found' });
        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
