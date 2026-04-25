const express = require('express');
const router = express.Router();
const obligationController = require('../controllers/obligationController');
const protect = require('../middleware/protect');

router.use(protect);

router.get('/', obligationController.getObligations);
router.get('/:id', obligationController.getObligation);
router.patch('/:id', obligationController.updateObligation);
router.post('/:id/pay', obligationController.markPaid);
router.post('/:id/unpay', obligationController.markUnpaid);
router.delete('/:id', obligationController.deleteObligation);

module.exports = router;
