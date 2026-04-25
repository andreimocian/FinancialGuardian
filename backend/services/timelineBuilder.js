const DAY_MS = 86_400_000;

function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

function daysBetween(from, to) {
    return Math.ceil((to.getTime() - from.getTime()) / DAY_MS);
}

function buildTimeline(obligations, { fromDate = new Date(), monthsAhead = 12 } = {}) {
    const horizon = addDays(fromDate, monthsAhead * 30);
    const events = [];

    for (const o of obligations) {
        if (o.paid) continue;
        if (!o.dueDate) continue;

        const due = new Date(o.dueDate);
        const days = daysBetween(fromDate, due);
        const overdue = due < fromDate;

        if (due > horizon) continue;

        events.push({
            obligationId: o._id,
            type: o.type,
            provider: o.provider || 'Unknown provider',
            amount: o.amount,
            currency: o.currency,
            dueDate: due,
            daysUntil: days,
            overdue,
            message: overdue
                ? `${o.provider || 'Bill'} was due ${due.toISOString().slice(0, 10)} (${Math.abs(days)} days overdue).`
                : `${o.provider || 'Bill'} due on ${due.toISOString().slice(0, 10)}.`,
        });
    }

    events.sort((a, b) => a.dueDate - b.dueDate);
    return events;
}

module.exports = { buildTimeline };
