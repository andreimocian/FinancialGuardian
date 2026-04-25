const { createEvents } = require('ics');
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

function dateToArray(d) {
    const x = new Date(d);
    return [x.getFullYear(), x.getMonth() + 1, x.getDate()];
}

function buildIcs({ bills, noticeDeadlines, contractsEnding }) {
    const events = [];

    for (const b of bills) {
        const amt = b.amount != null ? `${b.amount} ${b.currency || 'EUR'}` : '';
        events.push({
            uid: `bill-${b._id}@financialguardian`,
            title: `Bill due — ${b.provider || 'Bill'}${amt ? ' ' + amt : ''}`.trim(),
            description: b.description || `Mark this bill as paid in FinancialGuardian.`,
            start: dateToArray(b.dueDate),
            duration: { days: 1 },
            categories: ['FinancialGuardian', 'bill'],
            alarms: [
                { action: 'display', description: 'Bill due tomorrow', trigger: { hours: 24, before: true } },
            ],
            productId: 'FinancialGuardian',
        });
    }

    for (const n of noticeDeadlines) {
        events.push({
            uid: `notice-${n.contract._id}@financialguardian`,
            title: `Notice deadline — ${n.contract.provider || 'Contract'}`,
            description: n.contract.cancellationTerms
                || `Last day to give notice if you want to end the contract on ${isoDate(n.contract.endDate)}.`,
            start: dateToArray(n.eventDate),
            duration: { days: 1 },
            categories: ['FinancialGuardian', 'notice'],
            alarms: [
                { action: 'display', description: 'Notice deadline tomorrow', trigger: { hours: 24, before: true } },
            ],
            productId: 'FinancialGuardian',
        });
    }

    for (const u of contractsEnding) {
        events.push({
            uid: `contract-${u.contract._id}@financialguardian`,
            title: `Contract ends — ${u.contract.provider || 'Contract'}`,
            description: u.contract.description || `Contract ends today.`,
            start: dateToArray(u.eventDate),
            duration: { days: 1 },
            categories: ['FinancialGuardian', 'contract'],
            alarms: [
                { action: 'display', description: 'Contract ends tomorrow', trigger: { hours: 24, before: true } },
            ],
            productId: 'FinancialGuardian',
        });
    }

    if (!events.length) return null;

    const { value, error } = createEvents(events);
    if (error) throw error;
    return value;
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

    lines.push('Tip: open the attached calendar invite to add all events to your calendar in one click.');
    lines.push('');
    lines.push('— FinancialGuardian');

    const ics = buildIcs({ bills, noticeDeadlines, contractsEnding });

    return {
        subject,
        text: lines.join('\n'),
        ics,
        counts: {
            bills: bills.length,
            noticeDeadlines: noticeDeadlines.length,
            contractsEnding: contractsEnding.length,
        },
    };
}

module.exports = { buildDigestForUser };
