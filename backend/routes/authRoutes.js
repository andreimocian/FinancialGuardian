const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/protect');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.get('/me', protect, authController.me);

module.exports = router;