const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contractController');
const protect = require('../middleware/protect');

router.use(protect);

router.get('/', contractController.getContracts);
router.get('/:id', contractController.getContract);
router.patch('/:id', contractController.updateContract);
router.delete('/:id', contractController.deleteContract);

module.exports = router;
