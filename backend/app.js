const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const documentRoutes = require('./routes/documentRoutes');
const obligationRoutes = require('./routes/obligationRoutes');
const contractRoutes = require('./routes/contractRoutes');
const timelineRoutes = require('./routes/timelineRoutes');
const cors = require('cors');

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/obligations', obligationRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/timeline', timelineRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Merge!!!"
    });
});

module.exports = app;