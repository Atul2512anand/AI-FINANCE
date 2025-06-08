const { check } = require('express-validator');

/**
 * Validation rules for user registration
 */
exports.registerValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
];

/**
 * Validation rules for user login
 */
exports.loginValidation = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];

/**
 * Validation rules for updating password
 */
exports.updatePasswordValidation = [
  check('currentPassword', 'Current password is required').not().isEmpty(),
  check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
];

/**
 * Validation rules for creating/updating expense
 */
exports.expenseValidation = [
  check('amount', 'Amount is required and must be a positive number').isFloat({ min: 0.01 }),
  check('description', 'Description is required').not().isEmpty(),
  check('date', 'Valid date is required').optional().isISO8601().toDate()
];

/**
 * Validation rules for creating/updating category
 */
exports.categoryValidation = [
  check('name', 'Name is required').not().isEmpty(),
  check('color', 'Color should be a valid hex color').optional().isHexColor(),
  check('icon', 'Icon is required').optional().not().isEmpty()
];