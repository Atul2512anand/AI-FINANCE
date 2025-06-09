import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  CardHeader,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import InsightsIcon from '@mui/icons-material/Insights';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PieChartIcon from '@mui/icons-material/PieChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import SavingsIcon from '@mui/icons-material/Savings';

import { useAuth } from '../context/AuthContext';
import axios from 'axios';

// Import chart components
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend, 
  ArcElement,
  Filler
);

const Reports = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch report data
  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
        const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
        
        const response = await axios.get(`/api/reports/monthly?startDate=${startDate}&endDate=${endDate}`);
        setReportData(response.data.data);
      } catch (err) {
        console.error('Error fetching report data:', err);
        setError(err.response?.data?.message || 'Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchReportData();
  }, [selectedDate]);
  
  // Handle month navigation
  const handlePreviousMonth = () => {
    setSelectedDate(prevDate => subMonths(prevDate, 1));
  };
  
  const handleNextMonth = () => {
    const nextMonth = addMonths(selectedDate, 1);
    if (nextMonth <= new Date()) {
      setSelectedDate(nextMonth);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Download report as PDF
  const handleDownloadReport = async () => {
    try {
      const startDate = format(startOfMonth(selectedDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(selectedDate), 'yyyy-MM-dd');
      
      const response = await axios.get(
        `/api/reports/download?startDate=${startDate}&endDate=${endDate}`,
        { responseType: 'blob' }
      );
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Financial_Report_${format(selectedDate, 'yyyy-MM')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
      setError('Failed to download report. Please try again.');
    }
  };
  
  // Prepare chart data for daily expenses
  const getDailyExpensesChartData = () => {
    if (!reportData || !reportData.dailyExpenses) return null;
    
    const sortedDates = Object.keys(reportData.dailyExpenses).sort();
    
    return {
      labels: sortedDates.map(date => format(new Date(date), 'dd MMM')),
      datasets: [
        {
          label: 'Daily Expenses',
          data: sortedDates.map(date => reportData.dailyExpenses[date]),
          borderColor: theme.palette.primary.main,
          backgroundColor: theme.palette.primary.light + '80', // with opacity
          fill: true,
          tension: 0.4,
        },
      ],
    };
  };
  
  // Prepare chart data for category distribution
  const getCategoryDistributionChartData = () => {
    if (!reportData || !reportData.categoryBreakdown) return null;
    
    const categories = Object.keys(reportData.categoryBreakdown);
    const backgroundColors = categories.map((_, index) => {
      const hue = (index * 137) % 360; // Golden angle approximation for good color distribution
      return `hsl(${hue}, 70%, 60%)`;
    });
    
    return {
      labels: categories,
      datasets: [
        {
          data: categories.map(category => reportData.categoryBreakdown[category]),
          backgroundColor: backgroundColors,
          borderColor: backgroundColors.map(color => color.replace('60%', '50%')),
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Prepare chart data for budget vs actual
  const getBudgetVsActualChartData = () => {
    if (!reportData || !reportData.budgetStatus) return null;
    
    return {
      labels: ['Budget vs Actual'],
      datasets: [
        {
          label: 'Budget',
          data: [reportData.budgetStatus.monthlyBudget || 0],
          backgroundColor: theme.palette.success.light,
          borderColor: theme.palette.success.main,
          borderWidth: 1,
        },
        {
          label: 'Actual Spending',
          data: [reportData.totalExpenses],
          backgroundColor: theme.palette.primary.light,
          borderColor: theme.palette.primary.main,
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Prepare chart options
  const getChartOptions = (title) => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 16,
          },
        },
      },
    };
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box className="page-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Financial Reports
        </Typography>
        
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={handleDownloadReport}
          disabled={!reportData}
        >
          Download Report
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Month Selection */}
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button 
            onClick={handlePreviousMonth}
            variant="outlined"
          >
            Previous Month
          </Button>
          
          <Typography variant="h6">
            {format(selectedDate, 'MMMM yyyy')}
          </Typography>
          
          <Button 
            onClick={handleNextMonth}
            variant="outlined"
            disabled={addMonths(selectedDate, 1) > new Date()}
          >
            Next Month
          </Button>
        </Box>
      </Paper>
      
      {/* Report Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" icon={<InsightsIcon />} iconPosition="start" />
          <Tab label="Expenses" icon={<TimelineIcon />} iconPosition="start" />
          <Tab label="Categories" icon={<PieChartIcon />} iconPosition="start" />
          <Tab label="Insights" icon={<LightbulbIcon />} iconPosition="start" />
        </Tabs>
      </Box>
      
      {/* Tab Content */}
      {tabValue === 0 && reportData && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Monthly Summary
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Total Expenses" 
                    secondary={`${user?.currency}${reportData.totalExpenses.toFixed(2)}`} 
                    primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    secondaryTypographyProps={{ variant: 'h6', color: 'textPrimary' }}
                  />
                </ListItem>
                
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText 
                    primary="Number of Transactions" 
                    secondary={reportData.transactionCount} 
                    primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    secondaryTypographyProps={{ variant: 'h6', color: 'textPrimary' }}
                  />
                </ListItem>
                
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText 
                    primary="Average Daily Spending" 
                    secondary={`${user?.currency}${reportData.averageDailyExpense.toFixed(2)}`} 
                    primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    secondaryTypographyProps={{ variant: 'h6', color: 'textPrimary' }}
                  />
                </ListItem>
                
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText 
                    primary="Highest Spending Day" 
                    secondary={
                      reportData.highestSpendingDay ? 
                      `${format(new Date(reportData.highestSpendingDay.date), 'dd MMM')} - ${user?.currency}${reportData.highestSpendingDay.amount.toFixed(2)}` : 
                      'No data'
                    } 
                    primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    secondaryTypographyProps={{ variant: 'h6', color: 'textPrimary' }}
                  />
                </ListItem>
                
                <Divider component="li" />
                
                <ListItem>
                  <ListItemText 
                    primary="Month-over-Month Change" 
                    secondary={
                      reportData.previousMonthComparison ? 
                      `${reportData.previousMonthComparison.percentageChange >= 0 ? '+' : ''}${reportData.previousMonthComparison.percentageChange.toFixed(2)}%` : 
                      'No previous data'
                    } 
                    primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    secondaryTypographyProps={{
                      variant: 'h6',
                      color: reportData.previousMonthComparison && reportData.previousMonthComparison.percentageChange < 0 ? 'success.main' : 'error.main',
                    }}
                  />
                  {reportData.previousMonthComparison && (
                    <ListItemIcon sx={{ minWidth: 'auto', ml: 1 }}>
                      {reportData.previousMonthComparison.percentageChange < 0 ? 
                        <TrendingDownIcon color="success" /> : 
                        <TrendingUpIcon color="error" />}
                    </ListItemIcon>
                  )}
                </ListItem>
              </List>
            </Paper>
          </Grid>
          
          {/* Budget Status */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Budget Status
              </Typography>
              
              {reportData.budgetStatus.monthlyBudget ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Monthly Budget:
                    </Typography>
                    <Typography variant="body1">
                      {user?.currency}{reportData.budgetStatus.monthlyBudget.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Spent So Far:
                    </Typography>
                    <Typography variant="body1">
                      {user?.currency}{reportData.totalExpenses.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Remaining:
                    </Typography>
                    <Typography 
                      variant="body1"
                      color={reportData.budgetStatus.remaining >= 0 ? 'success.main' : 'error.main'}
                    >
                      {user?.currency}{reportData.budgetStatus.remaining.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="body2" color="textSecondary">
                      Budget Utilization:
                    </Typography>
                    <Typography 
                      variant="body1"
                      color={reportData.budgetStatus.percentageUsed <= 100 ? 'success.main' : 'error.main'}
                    >
                      {reportData.budgetStatus.percentageUsed.toFixed(2)}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ height: 250 }}>
                    <Bar 
                      data={getBudgetVsActualChartData()} 
                      options={getChartOptions('Budget vs Actual Spending')} 
                    />
                  </Box>
                </>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You haven't set a monthly budget. Set a budget in your profile to track your spending against your budget.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          {/* Top Expenses */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Top Expenses
              </Typography>
              
              {reportData.topExpenses && reportData.topExpenses.length > 0 ? (
                <List>
                  {reportData.topExpenses.map((expense, index) => (
                    <React.Fragment key={expense._id || index}>
                      <ListItem>
                        <ListItemText 
                          primary={expense.description} 
                          secondary={format(new Date(expense.date), 'dd MMM yyyy')} 
                          primaryTypographyProps={{ variant: 'body1' }}
                          secondaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 'bold', ml: 2 }}>
                          {user?.currency}{expense.amount.toFixed(2)}
                        </Typography>
                      </ListItem>
                      {index < reportData.topExpenses.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No expenses recorded for this month.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          {/* Daily Expenses Chart */}
          <Grid item xs={12} md={8}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ height: 300 }}>
                {getDailyExpensesChartData() ? (
                  <Line 
                    data={getDailyExpensesChartData()} 
                    options={getChartOptions('Daily Expenses Trend')} 
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="textSecondary">
                      No daily expense data available for this month.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Category Distribution */}
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Box sx={{ height: 300 }}>
                {getCategoryDistributionChartData() ? (
                  <Doughnut 
                    data={getCategoryDistributionChartData()} 
                    options={getChartOptions('Expense Categories')} 
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="textSecondary">
                      No category data available for this month.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {tabValue === 1 && reportData && (
        <Grid container spacing={3}>
          {/* Daily Expenses Chart */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Daily Expenses Trend
              </Typography>
              
              <Box sx={{ height: 400 }}>
                {getDailyExpensesChartData() ? (
                  <Line 
                    data={getDailyExpensesChartData()} 
                    options={{
                      ...getChartOptions(''),
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: `Amount (${user?.currency})`,
                          },
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Date',
                          },
                        },
                      },
                    }} 
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="textSecondary">
                      No daily expense data available for this month.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Month Comparison */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Month-over-Month Comparison
              </Typography>
              
              {reportData.previousMonthComparison ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Current Month:
                    </Typography>
                    <Typography variant="body1">
                      {user?.currency}{reportData.totalExpenses.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Previous Month:
                    </Typography>
                    <Typography variant="body1">
                      {user?.currency}{reportData.previousMonthComparison.previousMonthTotal.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Difference:
                    </Typography>
                    <Typography 
                      variant="body1"
                      color={reportData.previousMonthComparison.difference < 0 ? 'success.main' : 'error.main'}
                    >
                      {reportData.previousMonthComparison.difference >= 0 ? '+' : ''}
                      {user?.currency}{reportData.previousMonthComparison.difference.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                    <Typography variant="body2" color="textSecondary">
                      Percentage Change:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="body1"
                        color={reportData.previousMonthComparison.percentageChange < 0 ? 'success.main' : 'error.main'}
                      >
                        {reportData.previousMonthComparison.percentageChange >= 0 ? '+' : ''}
                        {reportData.previousMonthComparison.percentageChange.toFixed(2)}%
                      </Typography>
                      {reportData.previousMonthComparison.percentageChange < 0 ? 
                        <TrendingDownIcon color="success" sx={{ ml: 1 }} /> : 
                        <TrendingUpIcon color="error" sx={{ ml: 1 }} />}
                    </Box>
                  </Box>
                  
                  <Alert 
                    severity={reportData.previousMonthComparison.percentageChange < 0 ? "success" : "info"}
                    icon={reportData.previousMonthComparison.percentageChange < 0 ? <CheckCircleIcon /> : <InfoIcon />}
                  >
                    {reportData.previousMonthComparison.percentageChange < 0 ? 
                      `You've reduced your spending by ${Math.abs(reportData.previousMonthComparison.percentageChange).toFixed(2)}% compared to last month. Great job!` : 
                      `Your spending has increased by ${reportData.previousMonthComparison.percentageChange.toFixed(2)}% compared to last month.`}
                  </Alert>
                </>
              ) : (
                <Alert severity="info">
                  No data available for the previous month to make a comparison.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          {/* Top Expenses */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Top Expenses This Month
              </Typography>
              
              {reportData.topExpenses && reportData.topExpenses.length > 0 ? (
                <List>
                  {reportData.topExpenses.map((expense, index) => (
                    <React.Fragment key={expense._id || index}>
                      <ListItem>
                        <ListItemText 
                          primary={expense.description} 
                          secondary={
                            <>
                              {format(new Date(expense.date), 'dd MMM yyyy')}
                              {expense.category && ` • ${expense.category.name}`}
                              {expense.paymentMethod && ` • ${expense.paymentMethod}`}
                            </>
                          } 
                          primaryTypographyProps={{ variant: 'body1' }}
                          secondaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        />
                        <Typography variant="body1" sx={{ fontWeight: 'bold', ml: 2 }}>
                          {user?.currency}{expense.amount.toFixed(2)}
                        </Typography>
                      </ListItem>
                      {index < reportData.topExpenses.length - 1 && <Divider component="li" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No expenses recorded for this month.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {tabValue === 2 && reportData && (
        <Grid container spacing={3}>
          {/* Category Distribution Chart */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Category Distribution
              </Typography>
              
              <Box sx={{ height: 400 }}>
                {getCategoryDistributionChartData() ? (
                  <Pie 
                    data={getCategoryDistributionChartData()} 
                    options={getChartOptions('')} 
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body1" color="textSecondary">
                      No category data available for this month.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
          
          {/* Category Breakdown */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Category Breakdown
              </Typography>
              
              {reportData.categoryBreakdown && Object.keys(reportData.categoryBreakdown).length > 0 ? (
                <List>
                  {Object.entries(reportData.categoryBreakdown)
                    .sort(([, a], [, b]) => b - a) // Sort by amount (descending)
                    .map(([category, amount], index) => (
                      <React.Fragment key={category}>
                        <ListItem>
                          <ListItemText 
                            primary={category} 
                            secondary={
                              `${((amount / reportData.totalExpenses) * 100).toFixed(2)}% of total`
                            } 
                            primaryTypographyProps={{ variant: 'body1' }}
                            secondaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          />
                          <Typography variant="body1" sx={{ fontWeight: 'bold', ml: 2 }}>
                            {user?.currency}{amount.toFixed(2)}
                          </Typography>
                        </ListItem>
                        {index < Object.keys(reportData.categoryBreakdown).length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                </List>
              ) : (
                <Alert severity="info">
                  No category data available for this month.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          {/* Category Month-over-Month */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Category Month-over-Month Changes
              </Typography>
              
              {reportData.categoryComparison && Object.keys(reportData.categoryComparison).length > 0 ? (
                <List>
                  {Object.entries(reportData.categoryComparison)
                    .sort(([, a], [, b]) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange)) // Sort by absolute percentage change
                    .map(([category, data], index) => (
                      <React.Fragment key={category}>
                        <ListItem>
                          <ListItemText 
                            primary={category} 
                            secondary={
                              `Current: ${user?.currency}${data.currentMonth.toFixed(2)} | Previous: ${user?.currency}${data.previousMonth.toFixed(2)}`
                            } 
                            primaryTypographyProps={{ variant: 'body1' }}
                            secondaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                          />
                          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                            <Typography 
                              variant="body1"
                              color={data.percentageChange < 0 ? 'success.main' : 'error.main'}
                              sx={{ fontWeight: 'bold' }}
                            >
                              {data.percentageChange >= 0 ? '+' : ''}
                              {data.percentageChange.toFixed(2)}%
                            </Typography>
                            {data.percentageChange < 0 ? 
                              <TrendingDownIcon color="success" sx={{ ml: 0.5 }} /> : 
                              <TrendingUpIcon color="error" sx={{ ml: 0.5 }} />}
                          </Box>
                        </ListItem>
                        {index < Object.keys(reportData.categoryComparison).length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                </List>
              ) : (
                <Alert severity="info">
                  No category comparison data available.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {tabValue === 3 && reportData && (
        <Grid container spacing={3}>
          {/* Insights and Recommendations */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Financial Insights
              </Typography>
              
              {reportData.insights && reportData.insights.length > 0 ? (
                <List>
                  {reportData.insights.map((insight, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <InsightsIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={insight.title} 
                          secondary={insight.description} 
                          primaryTypographyProps={{ variant: 'subtitle1', fontWeight: 'medium' }}
                          secondaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        />
                      </ListItem>
                      {index < reportData.insights.length - 1 && <Divider component="li" variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No insights available for this month.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          {/* Recommendations */}
          <Grid item xs={12}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recommendations
              </Typography>
              
              {reportData.recommendations && reportData.recommendations.length > 0 ? (
                <List>
                  {reportData.recommendations.map((recommendation, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <LightbulbIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={recommendation.title} 
                          secondary={recommendation.description} 
                          primaryTypographyProps={{ variant: 'subtitle1', fontWeight: 'medium' }}
                          secondaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        />
                      </ListItem>
                      {index < reportData.recommendations.length - 1 && <Divider component="li" variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="info">
                  No recommendations available for this month.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          {/* Savings Potential */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Savings Potential
              </Typography>
              
              {reportData.savingsRate ? (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Monthly Income:
                    </Typography>
                    <Typography variant="body1">
                      {user?.currency}{reportData.savingsRate.monthlyIncome?.toFixed(2) || 'Not set'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Total Expenses:
                    </Typography>
                    <Typography variant="body1">
                      {user?.currency}{reportData.totalExpenses.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      Potential Savings:
                    </Typography>
                    <Typography 
                      variant="body1"
                      color={reportData.savingsRate.potentialSavings > 0 ? 'success.main' : 'error.main'}
                    >
                      {user?.currency}{reportData.savingsRate.potentialSavings.toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                    <Typography variant="body2" color="textSecondary">
                      Savings Rate:
                    </Typography>
                    <Typography 
                      variant="body1"
                      color={reportData.savingsRate.savingsPercentage > 20 ? 'success.main' : 
                             reportData.savingsRate.savingsPercentage > 0 ? 'warning.main' : 'error.main'}
                    >
                      {reportData.savingsRate.savingsPercentage.toFixed(2)}%
                    </Typography>
                  </Box>
                  
                  <Alert 
                    severity={reportData.savingsRate.savingsPercentage > 20 ? "success" : 
                             reportData.savingsRate.savingsPercentage > 0 ? "warning" : "error"}
                    icon={reportData.savingsRate.savingsPercentage > 20 ? <CheckCircleIcon /> : 
                          reportData.savingsRate.savingsPercentage > 0 ? <WarningIcon /> : <ErrorIcon />}
                  >
                    {reportData.savingsRate.savingsPercentage > 20 ? 
                      `Great job! You're saving ${reportData.savingsRate.savingsPercentage.toFixed(2)}% of your income.` : 
                      reportData.savingsRate.savingsPercentage > 0 ?
                      `You're saving ${reportData.savingsRate.savingsPercentage.toFixed(2)}% of your income. Consider increasing your savings rate to at least 20%.` :
                      `Your expenses exceed your income. Consider reducing expenses or increasing income to achieve a positive savings rate.`}
                  </Alert>
                </>
              ) : (
                <Alert severity="info">
                  To see your savings potential, please set your monthly income in your profile settings.
                </Alert>
              )}
            </Paper>
          </Grid>
          
          {/* Spending Anomalies */}
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Spending Anomalies
              </Typography>
              
              {reportData.anomalies && reportData.anomalies.length > 0 ? (
                <List>
                  {reportData.anomalies.map((anomaly, index) => (
                    <React.Fragment key={index}>
                      <ListItem alignItems="flex-start">
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={anomaly.title} 
                          secondary={anomaly.description} 
                          primaryTypographyProps={{ variant: 'subtitle1', fontWeight: 'medium' }}
                          secondaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                        />
                      </ListItem>
                      {index < reportData.anomalies.length - 1 && <Divider component="li" variant="inset" />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Alert severity="success" icon={<CheckCircleIcon />}>
                  No spending anomalies detected this month.
                </Alert>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Reports;
