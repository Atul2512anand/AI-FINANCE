/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} - Formatted date string
 */
exports.formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted currency string
 */
exports.formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Calculate percentage
 * @param {number} value - Value
 * @param {number} total - Total
 * @returns {number} - Percentage
 */
exports.calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return (value / total) * 100;
};

/**
 * Group expenses by category
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} - Expenses grouped by category
 */
exports.groupByCategory = (expenses) => {
  return expenses.reduce((acc, expense) => {
    const categoryId = expense.category ? expense.category._id.toString() : 'uncategorized';
    const categoryName = expense.category ? expense.category.name : 'Uncategorized';
    
    if (!acc[categoryId]) {
      acc[categoryId] = {
        id: categoryId,
        name: categoryName,
        color: expense.category ? expense.category.color : '#95a5a6',
        icon: expense.category ? expense.category.icon : 'question',
        total: 0,
        count: 0,
        expenses: []
      };
    }
    
    acc[categoryId].total += expense.amount;
    acc[categoryId].count += 1;
    acc[categoryId].expenses.push(expense);
    
    return acc;
  }, {});
};

/**
 * Group expenses by date
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} - Expenses grouped by date
 */
exports.groupByDate = (expenses) => {
  return expenses.reduce((acc, expense) => {
    const dateStr = this.formatDate(expense.date);
    
    if (!acc[dateStr]) {
      acc[dateStr] = {
        date: dateStr,
        total: 0,
        count: 0,
        expenses: []
      };
    }
    
    acc[dateStr].total += expense.amount;
    acc[dateStr].count += 1;
    acc[dateStr].expenses.push(expense);
    
    return acc;
  }, {});
};

/**
 * Group expenses by month
 * @param {Array} expenses - Array of expense objects
 * @returns {Object} - Expenses grouped by month
 */
exports.groupByMonth = (expenses) => {
  return expenses.reduce((acc, expense) => {
    const date = new Date(expense.date);
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = {
        month: date.getMonth() + 1,
        year: date.getFullYear(),
        total: 0,
        count: 0,
        expenses: []
      };
    }
    
    acc[monthYear].total += expense.amount;
    acc[monthYear].count += 1;
    acc[monthYear].expenses.push(expense);
    
    return acc;
  }, {});
};

/**
 * Calculate date range
 * @param {string} period - Period (day, week, month, year, custom)
 * @param {Date} date - Reference date
 * @returns {Object} - Start and end dates
 */
exports.getDateRange = (period, date = new Date()) => {
  const today = new Date(date);
  let startDate, endDate;
  
  switch (period) {
    case 'day':
      startDate = new Date(today.setHours(0, 0, 0, 0));
      endDate = new Date(today.setHours(23, 59, 59, 999));
      break;
    
    case 'week':
      // Start of week (Sunday)
      const dayOfWeek = today.getDay();
      startDate = new Date(today);
      startDate.setDate(today.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);
      
      // End of week (Saturday)
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    
    case 'month':
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    
    case 'year':
      startDate = new Date(today.getFullYear(), 0, 1);
      endDate = new Date(today.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    
    default:
      startDate = new Date(today.setHours(0, 0, 0, 0));
      endDate = new Date(today.setHours(23, 59, 59, 999));
  }
  
  return { startDate, endDate };
};

/**
 * Generate random color
 * @returns {string} - Random hex color
 */
exports.generateRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length
 * @returns {string} - Truncated text
 */
exports.truncateText = (text, length = 30) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};