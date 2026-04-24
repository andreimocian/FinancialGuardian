const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const protect = require('../middleware/protect');

router.use(protect);

router.post('/seed', transactionController.seedTransactions);
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.patch('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
