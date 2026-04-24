const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const authRoutes = require('./routes/authRoutes');

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        message: "Merge!!!"
    });
});

module.exports = app;