const Report = require('../models/Report');
const Expense = require('../models/Expense');
const Category = require('../models/Category');
const User = require('../models/User');

/**
 * Generate a monthly report for a user
 * @param {string} userId - User ID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year
 * @param {boolean} forceRegenerate - Whether to regenerate if report exists
 * @returns {Promise<Object>} - Generated report
 */
async function generateMonthlyReport(userId, month, year, forceRegenerate = false) {
  try {
    // Check if report already exists
    let existingReport = null;
    if (!forceRegenerate) {
      existingReport = await Report.findOne({
        user: userId,
        month,
        year
      });

      if (existingReport) {
        return existingReport;
      }
    }

    // Get date range for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get all expenses for the month
    const expenses = await Expense.find({
      user: userId,
      date: { $gte: startDate, $lte: endDate }
    }).populate('category');

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    // Get category breakdown
    const categoryMap = {};
    expenses.forEach(expense => {
      const categoryId = expense.category ? expense.category._id.toString() : 'uncategorized';
      const categoryName = expense.category ? expense.category.name : 'Uncategorized';
      const categoryColor = expense.category ? expense.category.color : '#95a5a6';

      if (!categoryMap[categoryId]) {
        categoryMap[categoryId] = {
          category: categoryId,
          categoryName,
          color: categoryColor,
          amount: 0,
          percentage: 0
        };
      }

      categoryMap[categoryId].amount += expense.amount;
    });

    // Calculate percentages
    Object.values(categoryMap).forEach(category => {
      category.percentage = totalExpenses > 0 ? (category.amount / totalExpenses) * 100 : 0;
    });

    // Sort by amount descending
    const categoryBreakdown = Object.values(categoryMap).sort((a, b) => b.amount - a.amount);

    // Get comparison with previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1);
    const prevEndDate = new Date(prevYear, prevMonth, 0);

    const prevExpenses = await Expense.find({
      user: userId,
      date: { $gte: prevStartDate, $lte: prevEndDate }
    });

    const prevTotalExpenses = prevExpenses.reduce((sum, expense) => sum + expense.amount, 0);

    const comparisonWithPreviousMonth = {
      difference: totalExpenses - prevTotalExpenses,
      percentageChange: prevTotalExpenses > 0 
        ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 
        : 0
    };

    // Get top expenses
    const topExpenses = expenses
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map(expense => ({
        expense: expense._id,
        amount: expense.amount,
        description: expense.description,
        date: expense.date,
        category: expense.category ? expense.category.name : 'Uncategorized'
      }));

    // Get daily expense trend
    const dailyExpenseMap = {};
    const daysInMonth = new Date(year, month, 0).getDate();

    // Initialize all days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      dailyExpenseMap[dateStr] = 0;
    }

    // Fill in actual expenses
    expenses.forEach(expense => {
      const dateStr = expense.date.toISOString().split('T')[0];
      if (dailyExpenseMap[dateStr] !== undefined) {
        dailyExpenseMap[dateStr] += expense.amount;
      }
    });

    const dailyExpenseTrend = Object.entries(dailyExpenseMap).map(([date, amount]) => ({
      date: new Date(date),
      amount
    })).sort((a, b) => a.date - b.date);

    // Get user's budget
    const user = await User.findById(userId);
    const monthlyBudget = user.monthlyBudget || 0;

    // Calculate budget status
    const budgetStatus = {
      budgetAmount: monthlyBudget,
      spent: totalExpenses,
      remaining: monthlyBudget - totalExpenses,
      percentageUsed: monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : 0
    };

    // Calculate savings rate if budget is set
    const savingsRate = monthlyBudget > 0 && monthlyBudget > totalExpenses 
      ? ((monthlyBudget - totalExpenses) / monthlyBudget) * 100 
      : 0;

    // Generate insights
    const insights = generateInsights(
      totalExpenses, 
      prevTotalExpenses, 
      categoryBreakdown, 
      budgetStatus,
      dailyExpenseTrend
    );

    // Generate recommendations
    const recommendations = generateRecommendations(
      categoryBreakdown, 
      comparisonWithPreviousMonth, 
      budgetStatus,
      savingsRate
    );

    // Create or update report
    const reportData = {
      user: userId,
      month,
      year,
      totalExpenses,
      categoryBreakdown,
      comparisonWithPreviousMonth,
      topExpenses,
      dailyExpenseTrend,
      savingsRate,
      budgetStatus,
      insights,
      recommendations
    };

    if (existingReport && forceRegenerate) {
      // Update existing report
      const updatedReport = await Report.findByIdAndUpdate(
        existingReport._id,
        reportData,
        { new: true }
      );
      return updatedReport;
    } else {
      // Create new report
      const newReport = await Report.create(reportData);
      return newReport;
    }
  } catch (err) {
    console.error('Error generating monthly report:', err);
    throw err;
  }
}

/**
 * Generate insights based on expense data
 */
function generateInsights(totalExpenses, prevTotalExpenses, categoryBreakdown, budgetStatus, dailyExpenseTrend) {
  const insights = [];

  // Spending trend
  if (totalExpenses > prevTotalExpenses) {
    insights.push(`Your spending increased by ${(totalExpenses - prevTotalExpenses).toFixed(2)} compared to last month.`);
  } else if (totalExpenses < prevTotalExpenses) {
    insights.push(`Your spending decreased by ${(prevTotalExpenses - totalExpenses).toFixed(2)} compared to last month.`);
  } else {
    insights.push('Your spending is the same as last month.');
  }

  // Budget status
  if (budgetStatus.budgetAmount > 0) {
    if (budgetStatus.percentageUsed > 100) {
      insights.push(`You've exceeded your monthly budget by ${(budgetStatus.spent - budgetStatus.budgetAmount).toFixed(2)}.`);
    } else if (budgetStatus.percentageUsed > 90) {
      insights.push(`You've used ${budgetStatus.percentageUsed.toFixed(1)}% of your monthly budget.`);
    } else if (budgetStatus.percentageUsed < 50) {
      insights.push(`You've only used ${budgetStatus.percentageUsed.toFixed(1)}% of your monthly budget.`);
    }
  }

  // Top spending categories
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    insights.push(`Your highest spending category was ${topCategory.categoryName} at ${topCategory.amount.toFixed(2)} (${topCategory.percentage.toFixed(1)}% of total).`);
  }

  // Daily spending pattern
  if (dailyExpenseTrend.length > 0) {
    const highestDay = dailyExpenseTrend.reduce((max, day) => day.amount > max.amount ? day : max, dailyExpenseTrend[0]);
    if (highestDay.amount > 0) {
      insights.push(`Your highest spending day was ${highestDay.date.toISOString().split('T')[0]} with ${highestDay.amount.toFixed(2)} spent.`);
    }
  }

  return insights;
}

/**
 * Generate recommendations based on expense data
 */
function generateRecommendations(categoryBreakdown, comparison, budgetStatus, savingsRate) {
  const recommendations = [];

  // Budget recommendations
  if (budgetStatus.budgetAmount === 0) {
    recommendations.push('Set a monthly budget to better track your spending goals.');
  } else if (budgetStatus.percentageUsed > 100) {
    recommendations.push('Consider reviewing your budget or finding ways to reduce expenses next month.');
  } else if (savingsRate < 10 && budgetStatus.budgetAmount > 0) {
    recommendations.push('Try to increase your savings rate to at least 10% of your income.');
  } else if (savingsRate > 20) {
    recommendations.push('Great job saving! Consider investing some of your savings for long-term growth.');
  }

  // Category-specific recommendations
  if (categoryBreakdown.length > 0) {
    const topCategory = categoryBreakdown[0];
    if (topCategory.percentage > 40) {
      recommendations.push(`Your ${topCategory.categoryName} expenses are ${topCategory.percentage.toFixed(1)}% of your total spending. Consider if you can reduce this category.`);
    }
  }

  // Trend recommendations
  if (comparison.percentageChange > 20) {
    recommendations.push('Your spending increased significantly from last month. Review your expenses to identify areas to cut back.');
  } else if (comparison.percentageChange < -20) {
    recommendations.push('Great job reducing your spending from last month! Keep up the good work.');
  }

  // General recommendations
  recommendations.push('Track your expenses regularly to stay on top of your financial goals.');
  recommendations.push('Review recurring subscriptions and services to eliminate unused ones.');

  return recommendations;
}

/**
 * Generate spending advice based on reports
 */
async function generateSpendingAdvice(userId, currentReport, prevReport, monthlyBudget) {
  try {
    // Get all categories
    const categories = await Category.find({ user: userId });

    // Initialize advice object
    const advice = {
      summary: '',
      budgetStatus: {
        budgetAmount: monthlyBudget,
        spent: currentReport.totalExpenses,
        remaining: monthlyBudget - currentReport.totalExpenses,
        percentageUsed: monthlyBudget > 0 ? (currentReport.totalExpenses / monthlyBudget) * 100 : 0
      },
      categoryAdvice: [],
      generalTips: []
    };

    // Generate summary
    if (monthlyBudget > 0) {
      if (advice.budgetStatus.percentageUsed > 100) {
        advice.summary = `You've exceeded your monthly budget by ${(advice.budgetStatus.spent - advice.budgetStatus.budgetAmount).toFixed(2)}. Here are some tips to help you get back on track.`;
      } else if (advice.budgetStatus.percentageUsed > 90) {
        advice.summary = `You're close to your monthly budget limit (${advice.budgetStatus.percentageUsed.toFixed(1)}% used). Consider reducing discretionary spending for the rest of the month.`;
      } else if (advice.budgetStatus.percentageUsed < 50) {
        advice.summary = `You're well under your monthly budget (${advice.budgetStatus.percentageUsed.toFixed(1)}% used). You're on track for significant savings this month.`;
      } else {
        advice.summary = `You've used ${advice.budgetStatus.percentageUsed.toFixed(1)}% of your monthly budget. You're on track with your spending plan.`;
      }
    } else {
      advice.summary = `You've spent ${currentReport.totalExpenses.toFixed(2)} this month. Setting a budget can help you manage your finances better.`;
    }

    // Generate category-specific advice
    currentReport.categoryBreakdown.forEach(category => {
      // Skip categories with very small amounts
      if (category.amount < 10) return;

      let categoryAdvice = {
        category: category.categoryName,
        amount: category.amount,
        percentage: category.percentage,
        advice: ''
      };

      // Compare with previous month if available
      if (prevReport) {
        const prevCategory = prevReport.categoryBreakdown.find(
          c => c.categoryName === category.categoryName
        );

        if (prevCategory) {
          const change = category.amount - prevCategory.amount;
          const percentChange = prevCategory.amount > 0 
            ? (change / prevCategory.amount) * 100 
            : 0;

          if (percentChange > 20 && change > 20) {
            categoryAdvice.advice = `Your ${category.categoryName} spending increased by ${change.toFixed(2)} (${percentChange.toFixed(1)}%) from last month. Consider if this increase was necessary or if you can reduce it next month.`;
          } else if (percentChange < -20 && Math.abs(change) > 20) {
            categoryAdvice.advice = `Great job reducing your ${category.categoryName} spending by ${Math.abs(change).toFixed(2)} from last month!`;
          } else {
            categoryAdvice.advice = `Your ${category.categoryName} spending is similar to last month.`;
          }
        } else {
          categoryAdvice.advice = `This is a new spending category compared to last month.`;
        }
      } else {
        // No previous month data
        if (category.percentage > 30) {
          categoryAdvice.advice = `${category.categoryName} makes up a significant portion of your spending (${category.percentage.toFixed(1)}%). Consider if this aligns with your financial priorities.`;
        } else {
          categoryAdvice.advice = `${category.categoryName} accounts for ${category.percentage.toFixed(1)}% of your monthly spending.`;
        }
      }

      advice.categoryAdvice.push(categoryAdvice);
    });

    // Sort category advice by amount descending
    advice.categoryAdvice.sort((a, b) => b.amount - a.amount);

    // Generate general tips
    advice.generalTips = [
      'Review subscriptions and recurring charges to eliminate unused services.',
      'Consider meal planning to reduce food expenses.',
      'Use cashback and rewards programs for regular purchases.',
      'Set specific savings goals to stay motivated.',
      'Track your expenses regularly to identify spending patterns.'
    ];

    return advice;
  } catch (err) {
    console.error('Error generating spending advice:', err);
    throw err;
  }
}

module.exports = {
  generateMonthlyReport,
  generateSpendingAdvice
};