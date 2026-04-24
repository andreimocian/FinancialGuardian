const express = require('express');
const morgan = require('morgan');

const app = express();

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

app.use(express.json());


app.get('/', (req, res) => {
    res.status(200).json({
        message: "Merge!!!"
    });
});

module.exports = app;