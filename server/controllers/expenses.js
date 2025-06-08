const Expense = require('../models/Expense');
const Category = require('../models/Category');
const { validationResult } = require('express-validator');
const mlService = require('../services/mlService');

/**
 * @desc    Get all expenses for a user
 * @route   GET /api/expenses
 * @access  Private
 */
exports.getExpenses = async (req, res) => {
  try {
    // Build query
    let query = { user: req.user.id };

    // Filter by date range
    if (req.query.startDate && req.query.endDate) {
      query.date = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by amount range
    if (req.query.minAmount || req.query.maxAmount) {
      query.amount = {};
      if (req.query.minAmount) query.amount.$gte = parseFloat(req.query.minAmount);
      if (req.query.maxAmount) query.amount.$lte = parseFloat(req.query.maxAmount);
    }

    // Filter by search term (in description)
    if (req.query.search) {
      query.description = { $regex: req.query.search, $options: 'i' };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Expense.countDocuments(query);

    // Execute query with pagination
    const expenses = await Expense.find(query)
      .populate('category', 'name color icon')
      .sort({ date: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: expenses.length,
      pagination,
      data: expenses
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
 * @desc    Get single expense
 * @route   GET /api/expenses/:id
 * @access  Private
 */
exports.getExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('category', 'name color icon');

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Make sure user owns expense
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this expense'
      });
    }

    res.status(200).json({
      success: true,
      data: expense
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
 * @desc    Create new expense
 * @route   POST /api/expenses
 * @access  Private
 */
exports.createExpense = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Add user to request body
    req.body.user = req.user.id;

    // If no category provided, try to predict category using ML
    if (!req.body.category) {
      try {
        const { description, amount } = req.body;
        const { categoryId, confidence } = await mlService.predictCategory(description, amount, req.user.id);
        
        if (categoryId) {
          req.body.category = categoryId;
          req.body.mlConfidence = confidence;
        }
      } catch (mlErr) {
        console.error('ML prediction error:', mlErr.message);
        // Continue without ML prediction if it fails
      }
    }

    // If still no category, use default 'Uncategorized' category
    if (!req.body.category) {
      const defaultCategory = await Category.findOne({ 
        user: req.user.id, 
        name: 'Uncategorized' 
      });

      if (defaultCategory) {
        req.body.category = defaultCategory._id;
      } else {
        // Create default category if it doesn't exist
        const newDefaultCategory = await Category.create({
          name: 'Uncategorized',
          description: 'Default category for uncategorized expenses',
          color: '#95a5a6',
          icon: 'question',
          isDefault: true,
          user: req.user.id
        });
        req.body.category = newDefaultCategory._id;
      }
    }

    const expense = await Expense.create(req.body);

    // Populate category details
    const populatedExpense = await Expense.findById(expense._id).populate('category', 'name color icon');

    res.status(201).json({
      success: true,
      data: populatedExpense
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
 * @desc    Update expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
exports.updateExpense = async (req, res) => {
  try {
    let expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Make sure user owns expense
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to update this expense'
      });
    }

    // Update expense
    expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('category', 'name color icon');

    res.status(200).json({
      success: true,
      data: expense
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
 * @desc    Delete expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({
        success: false,
        error: 'Expense not found'
      });
    }

    // Make sure user owns expense
    if (expense.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to delete this expense'
      });
    }

    await expense.remove();

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
 * @desc    Get expense statistics
 * @route   GET /api/expenses/stats
 * @access  Private
 */
exports.getExpenseStats = async (req, res) => {
  try {
    // Get total expenses for current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthlyTotal = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    // Get expenses by category for current month
    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        }
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Get category details
    const categoryIds = expensesByCategory.map(item => item._id);
    const categories = await Category.find({ _id: { $in: categoryIds } });

    // Combine category details with expense totals
    const categoryData = expensesByCategory.map(item => {
      const category = categories.find(cat => cat._id.toString() === item._id.toString());
      return {
        _id: item._id,
        name: category ? category.name : 'Unknown',
        color: category ? category.color : '#000000',
        icon: category ? category.icon : 'question',
        total: item.total
      };
    });

    // Get daily expenses for current month
    const dailyExpenses = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: firstDayOfMonth, $lte: lastDayOfMonth }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        monthlyTotal: monthlyTotal.length > 0 ? monthlyTotal[0].total : 0,
        categoryData,
        dailyExpenses
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