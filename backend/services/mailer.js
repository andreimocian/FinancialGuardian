const nodemailer = require('nodemailer');

let cached;

function getTransporter() {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be set');
    }
    if (!cached) {
        cached = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });
    }
    return cached;
}

async function sendEmail({ to, subject, text, html, ics }) {
    const transporter = getTransporter();

    const attachments = [];
    if (ics) {
        attachments.push({
            filename: 'upcoming.ics',
            content: ics,
            contentType: 'text/calendar; method=PUBLISH; charset=UTF-8',
        });
    }

    return transporter.sendMail({
        from: `FinancialGuardian <${process.env.GMAIL_USER}>`,
        to,
        subject,
        text,
        html,
        attachments: attachments.length ? attachments : undefined,
    });
}

module.exports = { sendEmail };
