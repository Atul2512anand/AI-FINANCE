const express = require('express');
const router = express.Router();
const {
  getCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
} = require('../controllers/categories');
const { protect } = require('../middleware/auth');
const { categoryValidation } = require('../middleware/validators');

// All routes are protected
router.use(protect);

// Get category statistics
router.get('/stats', getCategoryStats);

// CRUD routes
router.route('/')
  .get(getCategories)
  .post(categoryValidation, createCategory);

router.route('/:id')
  .get(getCategory)
  .put(categoryValidation, updateCategory)
  .delete(deleteCategory);

module.exports = router;