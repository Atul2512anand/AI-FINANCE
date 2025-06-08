const express = require('express');
const router = express.Router();
const {
  getReports,
  getReport,
  getMonthlyReport,
  generateReport,
  getSpendingAdvice,
  getYearlySummary
} = require('../controllers/reports');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Get spending advice
router.get('/advice', getSpendingAdvice);

// Get yearly summary
router.get('/yearly/:year', getYearlySummary);

// Get monthly report
router.get('/monthly/:month/:year', getMonthlyReport);

// Generate/regenerate report
router.post('/generate/:month/:year', generateReport);

// CRUD routes
router.route('/')
  .get(getReports);

router.route('/:id')
  .get(getReport);

module.exports = router;