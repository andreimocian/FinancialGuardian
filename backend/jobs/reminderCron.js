const cron = require('node-cron');
const { runRemindersForAllUsers } = require('../services/reminderRunner');

function startReminderCron() {
    cron.schedule('0 9 * * 1', async () => {
        console.log('[reminderCron] running weekly digest');
        try {
            const r = await runRemindersForAllUsers();
            console.log(`[reminderCron] sent=${r.sent} skipped=${r.skipped} total=${r.total}`);
        } catch (err) {
            console.error('[reminderCron] failed:', err);
        }
    });
    console.log('[reminderCron] scheduled — every Monday at 09:00');
}

module.exports = { startReminderCron };
