const DAY_MS = 86_400_000;

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function daysBetween(from, to) {
    return Math.ceil((to.getTime() - from.getTime()) / DAY_MS);
}

function buildTimeline({ obligations = [], contracts = [], fromDate = new Date(), monthsAhead = 12 } = {}) {
    const horizon = addDays(fromDate, monthsAhead * 30);
    const events = [];

    for (const o of obligations) {
        if (o.paid) continue;
        if (!o.dueDate) continue;
        const due = new Date(o.dueDate);
        if (due > horizon) continue;

        const days = daysBetween(fromDate, due);
        const overdue = due < fromDate;
        events.push({
            kind: 'bill_due',
            obligationId: o._id,
            type: o.type,
            provider: o.provider || 'Unknown provider',
            amount: o.amount,
            currency: o.currency,
            eventDate: due,
            daysUntil: days,
            overdue,
            message: overdue
                ? `${o.provider || 'Bill'} was due ${due.toISOString().slice(0, 10)} (${Math.abs(days)} days overdue).`
                : `${o.provider || 'Bill'} due on ${due.toISOString().slice(0, 10)}.`,
        });
    }

    for (const c of contracts) {
        if (c.status && c.status !== 'active') continue;
        if (!c.endDate) continue;
        const end = new Date(c.endDate);

        if (end >= fromDate && end <= horizon) {
            events.push({
                kind: 'contract_ends',
                contractId: c._id,
                provider: c.provider || 'Unknown provider',
                eventDate: end,
                daysUntil: daysBetween(fromDate, end),
                overdue: false,
                message: `${c.provider || 'Contract'} ends on ${end.toISOString().slice(0, 10)}.`,
            });
        }

        if (c.noticePeriodDays && c.noticePeriodDays > 0) {
            const noticeDeadline = addDays(end, -c.noticePeriodDays);
            if (noticeDeadline >= fromDate && noticeDeadline <= horizon) {
                events.push({
                    kind: 'notice_deadline',
                    contractId: c._id,
                    provider: c.provider || 'Unknown provider',
                    eventDate: noticeDeadline,
                    daysUntil: daysBetween(fromDate, noticeDeadline),
                    overdue: false,
                    message: `Give notice to ${c.provider || 'provider'} by ${noticeDeadline.toISOString().slice(0, 10)} (${c.noticePeriodDays} days before contract end).`,
                });
            }
        }
    }

    events.sort((a, b) => a.eventDate - b.eventDate);
    return events;
}

module.exports = { buildTimeline };
