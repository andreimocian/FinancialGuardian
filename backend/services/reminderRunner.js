const User = require('../models/userModel');
const { buildDigestForUser } = require('./digestBuilder');
const { sendEmail } = require('./mailer');

async function sendDigestToUser(user) {
    if (!user?.email) return { sent: false, reason: 'no email' };

    const digest = await buildDigestForUser(user._id);
    if (!digest) return { sent: false, reason: 'nothing upcoming' };

    await sendEmail({
        to: user.email,
        subject: digest.subject,
        text: digest.text,
        ics: digest.ics,
    });

    return { sent: true, counts: digest.counts };
}

async function runRemindersForAllUsers() {
    const users = await User.find({});
    let sent = 0, skipped = 0;
    const results = [];

    for (const u of users) {
        try {
            const r = await sendDigestToUser(u);
            if (r.sent) sent++; else skipped++;
            results.push({ userId: u._id, email: u.email, ...r });
        } catch (err) {
            skipped++;
            results.push({ userId: u._id, email: u.email, error: err.message });
        }
    }

    return { sent, skipped, total: users.length, results };
}

module.exports = { sendDigestToUser, runRemindersForAllUsers };
