const Obligation = require('../models/obligationModel');
const { buildTimeline } = require('../services/timelineBuilder');

exports.getTimeline = async (req, res) => {
    try {
        const obligations = await Obligation.find({
            userId: req.user._id,
            paid: false,
        });

        const events = buildTimeline(obligations, {
            fromDate: new Date(),
            monthsAhead: 12,
        });

        res.status(200).json({
            status: 'success',
            count: events.length,
            events,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
