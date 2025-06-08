const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpense,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseStats
} = require('../controllers/expenses');
const { protect } = require('../middleware/auth');
const { expenseValidation } = require('../middleware/validators');

// All routes are protected
router.use(protect);

// Get expense statistics
router.get('/stats', getExpenseStats);

// CRUD routes
router.route('/')
  .get(getExpenses)
  .post(expenseValidation, createExpense);

router.route('/:id')
  .get(getExpense)
  .put(expenseValidation, updateExpense)
  .delete(deleteExpense);

module.exports = router;