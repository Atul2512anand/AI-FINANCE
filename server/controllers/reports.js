const Report = require('../models/Report');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const User = require('../models/User');
const reportService = require('../services/reportService');

/**
 * @desc    Get all reports for a user
 * @route   GET /api/reports
 * @access  Private
 */
exports.getReports = async (req, res) => {
  try {
    // Build query
    let query = { user: req.user.id };

    // Filter by year
    if (req.query.year) {
      query.year = parseInt(req.query.year);
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Report.countDocuments(query);

    // Execute query with pagination
    const reports = await Report.find(query)
      .sort({ year: -1, month: -1 })
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
      count: reports.length,
      pagination,
      data: reports
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
 * @desc    Get single report
 * @route   GET /api/reports/:id
 * @access  Private
 */
exports.getReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    // Make sure user owns report
    if (report.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this report'
      });
    }

    res.status(200).json({
      success: true,
      data: report
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
 * @desc    Get report by month and year
 * @route   GET /api/reports/monthly/:month/:year
 * @access  Private
 */
exports.getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    // Validate month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (monthNum < 1 || monthNum > 12 || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month or year'
      });
    }

    // Find existing report
    let report = await Report.findOne({
      user: req.user.id,
      month: monthNum,
      year: yearNum
    });

    // If report doesn't exist, generate it
    if (!report) {
      report = await reportService.generateMonthlyReport(req.user.id, monthNum, yearNum);
    }

    res.status(200).json({
      success: true,
      data: report
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
 * @desc    Generate or regenerate report for a specific month
 * @route   POST /api/reports/generate/:month/:year
 * @access  Private
 */
exports.generateReport = async (req, res) => {
  try {
    const { month, year } = req.params;
    
    // Validate month and year
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (monthNum < 1 || monthNum > 12 || yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid month or year'
      });
    }

    // Generate report (will overwrite if exists)
    const report = await reportService.generateMonthlyReport(req.user.id, monthNum, yearNum, true);

    res.status(200).json({
      success: true,
      data: report
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
 * @desc    Get spending advice based on reports
 * @route   GET /api/reports/advice
 * @access  Private
 */
exports.getSpendingAdvice = async (req, res) => {
  try {
    // Get user's monthly budget
    const user = await User.findById(req.user.id);
    const monthlyBudget = user.monthlyBudget || 0;

    // Get current month's report
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    let currentReport = await Report.findOne({
      user: req.user.id,
      month: currentMonth,
      year: currentYear
    });

    // Generate report if it doesn't exist
    if (!currentReport) {
      currentReport = await reportService.generateMonthlyReport(req.user.id, currentMonth, currentYear);
    }

    // Get previous month's report
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    let prevReport = await Report.findOne({
      user: req.user.id,
      month: prevMonth,
      year: prevYear
    });

    // Generate advice based on reports
    const advice = await reportService.generateSpendingAdvice(req.user.id, currentReport, prevReport, monthlyBudget);

    res.status(200).json({
      success: true,
      data: advice
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
 * @desc    Get yearly summary
 * @route   GET /api/reports/yearly/:year
 * @access  Private
 */
exports.getYearlySummary = async (req, res) => {
  try {
    const { year } = req.params;
    const yearNum = parseInt(year);
    
    if (yearNum < 2000 || yearNum > 2100) {
      return res.status(400).json({
        success: false,
        error: 'Invalid year'
      });
    }

    // Get all reports for the year
    const reports = await Report.find({
      user: req.user.id,
      year: yearNum
    }).sort('month');

    // Generate missing reports
    const existingMonths = reports.map(report => report.month);
    const missingMonths = [];
    
    // Only generate reports for past months up to current month if it's the current year
    const now = new Date();
    const currentYear = now.getFullYear();
    const maxMonth = yearNum === currentYear ? now.getMonth() + 1 : 12;
    
    for (let i = 1; i <= maxMonth; i++) {
      if (!existingMonths.includes(i)) {
        missingMonths.push(i);
      }
    }

    // Generate missing reports
    for (const month of missingMonths) {
      const report = await reportService.generateMonthlyReport(req.user.id, month, yearNum);
      reports.push(report);
    }

    // Sort reports by month
    reports.sort((a, b) => a.month - b.month);

    // Calculate yearly totals
    const yearlyTotal = reports.reduce((sum, report) => sum + report.totalExpenses, 0);
    
    // Aggregate category data across all months
    const categoryMap = {};
    reports.forEach(report => {
      report.categoryBreakdown.forEach(category => {
        if (!categoryMap[category.categoryName]) {
          categoryMap[category.categoryName] = {
            categoryName: category.categoryName,
            amount: 0,
            color: category.color || '#000000'
          };
        }
        categoryMap[category.categoryName].amount += category.amount;
      });
    });

    // Convert to array and calculate percentages
    const yearlyCategories = Object.values(categoryMap).map(category => ({
      ...category,
      percentage: yearlyTotal > 0 ? (category.amount / yearlyTotal) * 100 : 0
    }));

    // Sort by amount descending
    yearlyCategories.sort((a, b) => b.amount - a.amount);

    // Monthly trend data
    const monthlyTrend = reports.map(report => ({
      month: report.month,
      monthName: report.monthName,
      totalExpenses: report.totalExpenses
    }));

    res.status(200).json({
      success: true,
      data: {
        year: yearNum,
        yearlyTotal,
        monthlyReports: reports,
        monthlyTrend,
        yearlyCategories
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