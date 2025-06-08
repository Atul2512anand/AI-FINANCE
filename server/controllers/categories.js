const Category = require('../models/Category');
const Expense = require('../models/Expense');
const { validationResult } = require('express-validator');

/**
 * @desc    Get all categories for a user
 * @route   GET /api/categories
 * @access  Private
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user.id }).sort('name');

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * @desc    Get single category
 * @route   GET /api/categories/:id
 * @access  Private
 */
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Make sure user owns category
    if (category.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this category'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * @desc    Create new category
 * @route   POST /api/categories
 * @access  Private
 */
exports.createCategory = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Add user to request body
    req.body.user = req.user.id;

    // Check if category with same name already exists for this user
    const existingCategory = await Category.findOne({
      name: req.body.name,
      user: req.user.id
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        error: 'Category with this name already exists'
      });
    }

    const category = await Category.create(req.body);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * @desc    Update category
 * @route   PUT /api/categories/:id
 * @access  Private
 */
exports.updateCategory = async (req, res) => {
  try {
    let category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Make sure user owns category
    if (category.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this category'
      });
    }

    // Check if updating to a name that already exists
    if (req.body.name && req.body.name !== category.name) {
      const existingCategory = await Category.findOne({
        name: req.body.name,
        user: req.user.id,
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          error: 'Category with this name already exists'
        });
      }
    }

    // Update category
    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * @desc    Delete category
 * @route   DELETE /api/categories/:id
 * @access  Private
 */
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }

    // Make sure user owns category
    if (category.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this category'
      });
    }

    // Check if category is default
    if (category.isDefault) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete default category'
      });
    }

    // Find default 'Uncategorized' category
    const defaultCategory = await Category.findOne({
      user: req.user.id,
      name: 'Uncategorized'
    });

    if (!defaultCategory) {
      return res.status(500).json({
        success: false,
        error: 'Default category not found'
      });
    }

    // Update all expenses with this category to use the default category
    await Expense.updateMany(
      { category: category._id },
      { category: defaultCategory._id }
    );

    // Delete the category
    await category.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

/**
 * @desc    Get category statistics
 * @route   GET /api/categories/stats
 * @access  Private
 */
exports.getCategoryStats = async (req, res) => {
  try {
    // Get date range (default to current month)
    const now = new Date();
    const startDate = req.query.startDate 
      ? new Date(req.query.startDate) 
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = req.query.endDate 
      ? new Date(req.query.endDate) 
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get expenses by category for the date range
    const categoryStats = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' },
          minAmount: { $min: '$amount' },
          maxAmount: { $max: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Get total expenses for the period
    const totalExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const total = totalExpenses.length > 0 ? totalExpenses[0].total : 0;

    // Get category details
    const categoryIds = categoryStats.map(item => item._id);
    const categories = await Category.find({ _id: { $in: categoryIds } });

    // Combine category details with stats
    const result = categoryStats.map(item => {
      const category = categories.find(cat => cat._id.toString() === item._id.toString());
      return {
        _id: item._id,
        name: category ? category.name : 'Unknown',
        color: category ? category.color : '#000000',
        icon: category ? category.icon : 'question',
        total: item.total,
        count: item.count,
        avgAmount: item.avgAmount,
        minAmount: item.minAmount,
        maxAmount: item.maxAmount,
        percentage: total > 0 ? (item.total / total) * 100 : 0
      };
    });

    res.status(200).json({
      success: true,
      data: {
        categories: result,
        total
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};