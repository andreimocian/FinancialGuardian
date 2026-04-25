const User = require('../models/userModel');
const { sendDigestToUser } = require('../services/reminderRunner');
const { buildDigestForUser } = require('../services/digestBuilder');

exports.runForCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const result = await sendDigestToUser(user);
        res.status(200).json({ status: 'success', ...result });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.previewForCurrentUser = async (req, res) => {
    try {
        const digest = await buildDigestForUser(req.user._id);
        if (!digest) {
            return res.status(200).json({ status: 'success', empty: true });
        }
        res.status(200).json({ status: 'success', ...digest });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
