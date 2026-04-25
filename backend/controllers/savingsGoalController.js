const SavingsGoal = require('../models/savingsGoalModel');
const { buildSpendingContext } = require('../services/spendingContext');
const { analyzeGoal } = require('../services/goalAnalyzer');

const DAY_MS = 86_400_000;
const round2 = (n) => Math.round(n * 100) / 100;

const ALLOWED_FIELDS = [
    'name', 'targetAmount', 'currency', 'targetDate',
    'currentSaved', 'description', 'status',
];

exports.createGoal = async (req, res) => {
    try {
        const { name, targetAmount, targetDate, currency, currentSaved, description } = req.body;
        if (!name || !targetAmount || !targetDate) {
            return res.status(400).json({ message: 'name, targetAmount, and targetDate are required' });
        }

        const goal = await SavingsGoal.create({
            userId: req.user._id,
            name,
            targetAmount,
            targetDate,
            currency: currency || 'EUR',
            currentSaved: currentSaved ?? 0,
            description,
        });

        res.status(201).json({ status: 'success', goal });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getGoals = async (req, res) => {
    try {
        const filter = { userId: req.user._id };
        if (req.query.status) filter.status = req.query.status;

        const goals = await SavingsGoal
            .find(filter)
            .sort({ targetDate: 1 });

        res.status(200).json({ status: 'success', count: goals.length, goals });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getGoal = async (req, res) => {
    try {
        const goal = await SavingsGoal.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        res.status(200).json({ status: 'success', goal });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateGoal = async (req, res) => {
    try {
        const updates = {};
        for (const key of ALLOWED_FIELDS) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        if (!Object.keys(updates).length) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const goal = await SavingsGoal.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            updates,
            { new: true, runValidators: true }
        );
        if (!goal) return res.status(404).json({ message: 'Goal not found' });
        res.status(200).json({ status: 'success', goal });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.deleteGoal = async (req, res) => {
    try {
        const result = await SavingsGoal.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!result) return res.status(404).json({ message: 'Goal not found' });
        res.status(200).json({ status: 'success' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.analyzeGoal = async (req, res) => {
    try {
        const goal = await SavingsGoal.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!goal) return res.status(404).json({ message: 'Goal not found' });

        const now = new Date();
        const monthsLeft = round2(Math.max(0.1, (new Date(goal.targetDate) - now) / (30 * DAY_MS)));
        const remaining = goal.targetAmount - (goal.currentSaved || 0);
        const requiredMonthly = round2(remaining / monthsLeft);

        const context = await buildSpendingContext(req.user._id, { lookbackMonths: 6 });

        let analysis;
        try {
            analysis = await analyzeGoal({
                goal: { ...goal.toObject(), monthsLeft, requiredMonthly },
                context,
            });
        } catch (err) {
            return res.status(502).json({
                message: 'Analysis failed',
                error: err.message,
            });
        }

        goal.lastAnalysis = {
            runAt: now,
            ...analysis,
            context: {
                avgMonthlyIncome: context.avgMonthlyIncome,
                avgMonthlyExpenses: context.avgMonthlyExpenses,
                currentMonthlyNet: context.currentMonthlyNet,
                monthsLeft,
                requiredMonthly,
                recurringObligations: context.recurringObligations,
            },
        };
        await goal.save();

        res.status(200).json({ status: 'success', goal });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
