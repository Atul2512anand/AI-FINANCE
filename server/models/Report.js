const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true,
    min: 2000,
    max: 2100
  },
  totalExpenses: {
    type: Number,
    required: true,
    default: 0
  },
  categoryBreakdown: [{
    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category'
    },
    categoryName: String,
    amount: Number,
    percentage: Number
  }],
  comparisonWithPreviousMonth: {
    difference: Number,
    percentageChange: Number
  },
  topExpenses: [{
    expense: {
      type: mongoose.Schema.ObjectId,
      ref: 'Expense'
    },
    amount: Number,
    description: String,
    date: Date,
    category: String
  }],
  dailyExpenseTrend: [{
    date: Date,
    amount: Number
  }],
  savingsRate: {
    type: Number,
    min: 0,
    max: 100
  },
  budgetStatus: {
    budgetAmount: Number,
    spent: Number,
    remaining: Number,
    percentageUsed: Number
  },
  insights: [{
    type: String
  }],
  recommendations: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create compound index for user, month, and year to ensure uniqueness
ReportSchema.index({ user: 1, month: 1, year: 1 }, { unique: true });

// Virtual for month name
ReportSchema.virtual('monthName').get(function() {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return monthNames[this.month - 1];
});

// Enable virtuals in JSON
ReportSchema.set('toJSON', { virtuals: true });
ReportSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Report', ReportSchema);