const express = require('express');
const router = express.Router();
const goalController = require('../controllers/savingsGoalController');
const protect = require('../middleware/protect');

router.use(protect);

router.post('/', goalController.createGoal);
router.get('/', goalController.getGoals);
router.get('/:id', goalController.getGoal);
router.patch('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);
router.post('/:id/analyze', goalController.analyzeGoal);

module.exports = router;
