const express = require('express');
const router = express.Router();
const timelineController = require('../controllers/timelineController');
const protect = require('../middleware/protect');

router.use(protect);

router.get('/', timelineController.getTimeline);

module.exports = router;
