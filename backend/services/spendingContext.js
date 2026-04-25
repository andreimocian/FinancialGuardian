const Transaction = require('../models/transactionModel');
const Contract = require('../models/contractModel');
const Obligation = require('../models/obligationModel');

const DAY_MS = 86_400_000;
const round2 = (n) => Math.round(n * 100) / 100;

function monthKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function mostCommon(values, fallback) {
    if (!values.length) return fallback;
    const counts = new Map();
    for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

async function buildSpendingContext(userId, { lookbackMonths = 6 } = {}) {
    const fromDate = new Date(Date.now() - lookbackMonths * 30 * DAY_MS);

    const [txns, contracts, unpaidBills] = await Promise.all([
        Transaction.find({ userId, date: { $gte: fromDate } }),
        Contract.find({ userId, status: 'active' }),
        Obligation.find({ userId, paid: false }),
    ]);

    const dominantCurrency = mostCommon(txns.map(t => t.currency).filter(Boolean), 'EUR');

    const incomeByMonth = new Map();
    const expensesByMonth = new Map();
    const expenseByCategory = new Map();

    for (const t of txns) {
        const key = monthKey(t.date);
        if (t.type === 'income') {
            incomeByMonth.set(key, (incomeByMonth.get(key) || 0) + t.amount);
        } else {
            expensesByMonth.set(key, (expensesByMonth.get(key) || 0) + t.amount);
            const cat = t.category || 'uncategorized';
            expenseByCategory.set(cat, (expenseByCategory.get(cat) || 0) + t.amount);
        }
    }

    const monthsCount = Math.max(incomeByMonth.size, expensesByMonth.size, 1);
    const avgMonthlyIncome = round2([...incomeByMonth.values()].reduce((a, b) => a + b, 0) / monthsCount);
    const avgMonthlyExpenses = round2([...expensesByMonth.values()].reduce((a, b) => a + b, 0) / monthsCount);
    const currentMonthlyNet = round2(avgMonthlyIncome - avgMonthlyExpenses);

    const spendingByCategory = [...expenseByCategory.entries()]
        .map(([category, total]) => ({ category, monthly: round2(total / monthsCount) }))
        .sort((a, b) => b.monthly - a.monthly);

    const recurringObligations = round2(
        contracts.reduce((s, c) => s + (c.monthlyAmount || 0), 0)
        + unpaidBills.reduce((s, b) => s + (b.amount || 0), 0)
    );

    const largestRecurring = contracts
        .filter(c => c.monthlyAmount)
        .sort((a, b) => (b.monthlyAmount || 0) - (a.monthlyAmount || 0))[0];

    return {
        currency: dominantCurrency,
        avgMonthlyIncome,
        avgMonthlyExpenses,
        currentMonthlyNet,
        spendingByCategory,
        recurringObligations,
        largestRecurring: largestRecurring
            ? { provider: largestRecurring.provider, amount: largestRecurring.monthlyAmount }
            : null,
        lookbackMonths,
        transactionCount: txns.length,
    };
}

module.exports = { buildSpendingContext };
