const Obligation = require('../models/obligationModel');
const Contract = require('../models/contractModel');

const DAY_MS = 86_400_000;

function daysBetween(from, to) {
    return Math.ceil((to.getTime() - from.getTime()) / DAY_MS);
}

function dayLabel(n) {
    return n === 1 ? '1 day' : `${n} days`;
}

function isoDate(d) {
    return new Date(d).toISOString().slice(0, 10);
}

async function buildDigestForUser(userId, { daysAhead = 14, fromDate = new Date() } = {}) {
    const horizon = new Date(fromDate.getTime() + daysAhead * DAY_MS);

    const [bills, contracts] = await Promise.all([
        Obligation.find({
            userId,
            paid: false,
            dueDate: { $gte: fromDate, $lte: horizon },
        }).sort({ dueDate: 1 }),
        Contract.find({ userId, status: 'active' }),
    ]);

    const contractsEnding = [];
    const noticeDeadlines = [];

    for (const c of contracts) {
        if (!c.endDate) continue;
        const end = new Date(c.endDate);
        if (end >= fromDate && end <= horizon) {
            contractsEnding.push({ contract: c, eventDate: end });
        }
        if (c.noticePeriodDays && c.noticePeriodDays > 0) {
            const deadline = new Date(end.getTime() - c.noticePeriodDays * DAY_MS);
            if (deadline >= fromDate && deadline <= horizon) {
                noticeDeadlines.push({ contract: c, eventDate: deadline });
            }
        }
    }

    const totalItems = bills.length + contractsEnding.length + noticeDeadlines.length;
    if (totalItems === 0) return null;

    const subject = `FinancialGuardian weekly summary — ${totalItems} item${totalItems === 1 ? '' : 's'} in the next ${daysAhead} days`;

    const lines = [];
    lines.push('Here is what is coming up in the next 14 days:');
    lines.push('');

    if (bills.length) {
        lines.push(`BILLS DUE (${bills.length})`);
        for (const b of bills) {
            const days = daysBetween(fromDate, new Date(b.dueDate));
            const amt = b.amount != null ? `${b.amount} ${b.currency || 'EUR'}` : 'amount unknown';
            lines.push(`  - ${b.provider || 'Bill'} — ${amt} due ${isoDate(b.dueDate)} (in ${dayLabel(days)})`);
        }
        lines.push('');
    }

    if (noticeDeadlines.length) {
        lines.push(`NOTICE DEADLINES (${noticeDeadlines.length})`);
        for (const n of noticeDeadlines) {
            const days = daysBetween(fromDate, n.eventDate);
            lines.push(`  - ${n.contract.provider || 'Contract'} — last day to give notice ${isoDate(n.eventDate)} (in ${dayLabel(days)}, ${n.contract.noticePeriodDays} days before contract end)`);
        }
        lines.push('');
    }

    if (contractsEnding.length) {
        lines.push(`CONTRACTS ENDING (${contractsEnding.length})`);
        for (const u of contractsEnding) {
            const days = daysBetween(fromDate, u.eventDate);
            lines.push(`  - ${u.contract.provider || 'Contract'} — ends ${isoDate(u.eventDate)} (in ${dayLabel(days)})`);
        }
        lines.push('');
    }

    lines.push('— FinancialGuardian');

    return {
        subject,
        text: lines.join('\n'),
        counts: {
            bills: bills.length,
            noticeDeadlines: noticeDeadlines.length,
            contractsEnding: contractsEnding.length,
        },
    };
}

module.exports = { buildDigestForUser };
