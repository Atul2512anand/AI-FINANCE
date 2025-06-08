const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

// All routes are protected
router.use(protect);

// Admin-only routes will be added here
// For now, we'll just have a placeholder route
router.get('/admin', authorize('admin'), (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Admin access granted'
  });
});

module.exports = router;