const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const protect = require('../middleware/protect');

router.use(protect);

router.post('/run', reminderController.runForCurrentUser);
router.get('/preview', reminderController.previewForCurrentUser);

module.exports = router;
