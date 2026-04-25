const Obligation = require('../models/obligationModel');

const ALLOWED_FIELDS = [
    'provider', 'amount', 'currency', 'dueDate',
    'paid', 'paidAt', 'description',
];

exports.getObligations = async (req, res) => {
    try {
        const filter = { userId: req.user._id };
        if (req.query.type) filter.type = req.query.type;
        if (req.query.paid === 'true') filter.paid = true;
        if (req.query.paid === 'false') filter.paid = false;

        const obligations = await Obligation
            .find(filter)
            .sort({ dueDate: 1 });

        res.status(200).json({
            status: 'success',
            count: obligations.length,
            obligations,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getObligation = async (req, res) => {
    try {
        const obligation = await Obligation.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!obligation) return res.status(404).json({ message: 'Obligation not found' });
        res.status(200).json({ status: 'success', obligation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateObligation = async (req, res) => {
    try {
        const updates = {};
        for (const key of ALLOWED_FIELDS) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        if (updates.paid === true && !updates.paidAt) {
            updates.paidAt = new Date();
        }
        if (updates.paid === false) {
            updates.paidAt = null;
        }

        const obligation = await Obligation.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updates,
            { new: true, runValidators: true }
        );
        if (!obligation) return res.status(404).json({ message: 'Obligation not found' });

        res.status(200).json({ status: 'success', obligation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markPaid = async (req, res) => {
    try {
        const obligation = await Obligation.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { paid: true, paidAt: new Date() },
            { new: true }
        );
        if (!obligation) return res.status(404).json({ message: 'Obligation not found' });
        res.status(200).json({ status: 'success', obligation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.markUnpaid = async (req, res) => {
    try {
        const obligation = await Obligation.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { paid: false, paidAt: null },
            { new: true }
        );
        if (!obligation) return res.status(404).json({ message: 'Obligation not found' });
        res.status(200).json({ status: 'success', obligation });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteObligation = async (req, res) => {
    try {
        const result = await Obligation.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!result) return res.status(404).json({ message: 'Obligation not found' });
        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
