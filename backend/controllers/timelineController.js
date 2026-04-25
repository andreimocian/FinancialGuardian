const Obligation = require('../models/obligationModel');
const Contract = require('../models/contractModel');
const { buildTimeline } = require('../services/timelineBuilder');

const VALID_KINDS = ['bills', 'contracts', 'all'];

exports.getTimeline = async (req, res) => {
    try {
        const kind = VALID_KINDS.includes(req.query.kind) ? req.query.kind : 'bills';

        const loadObligations = kind === 'bills' || kind === 'all';
        const loadContracts = kind === 'contracts' || kind === 'all';

        const [obligations, contracts] = await Promise.all([
            loadObligations
                ? Obligation.find({ userId: req.user._id, paid: false })
                : Promise.resolve([]),
            loadContracts
                ? Contract.find({ userId: req.user._id, status: 'active' })
                : Promise.resolve([]),
        ]);

        const events = buildTimeline({
            obligations,
            contracts,
            fromDate: new Date(),
            monthsAhead: 12,
        });

        res.status(200).json({
            status: 'success',
            kind,
            count: events.length,
            events,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
