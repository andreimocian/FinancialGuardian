const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const app = require('./app');
const { startReminderCron } = require('./jobs/reminderCron');

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.PASSWORD);

mongoose.connect(DB).then(() => {
    console.log('DB connection succesful!');
    startReminderCron();
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`App running on port ${port}`);
});