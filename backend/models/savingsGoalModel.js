const mongoose = require('mongoose');

const recommendationSchema = new mongoose.Schema({
    category: String,
    action: { type: String, enum: ['reduce', 'eliminate', 'review', 'maintain'] },
    fromMonthly: Number,
    toMonthly: Number,
    monthlySavings: Number,
    reasoning: String,
}, { _id: false });

const analysisSchema = new mongoose.Schema({
    runAt: { type: Date, default: Date.now },
    feasibility: { type: String, enum: ['achievable', 'tight', 'unrealistic'] },
    feasibilityReason: String,
    narrative: String,
    recommendations: [recommendationSchema],
    totalProjectedSavings: Number,
    context: {
        avgMonthlyIncome: Number,
        avgMonthlyExpenses: Number,
        currentMonthlyNet: Number,
        monthsLeft: Number,
        requiredMonthly: Number,
        recurringObligations: Number,
    },
}, { _id: false });

const savingsGoalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    name: {
        type: String,
        required: true,
        trim: true,
    },
    targetAmount: {
        type: Number,
        required: true,
    },
    currency: {
        type: String,
        uppercase: true,
        default: 'EUR',
    },
    targetDate: {
        type: Date,
        required: true,
    },
    currentSaved: {
        type: Number,
        default: 0,
    },
    description: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'abandoned'],
        default: 'active',
        index: true,
    },
    lastAnalysis: analysisSchema,
}, { timestamps: true });

module.exports = mongoose.model('SavingsGoal', savingsGoalSchema);
