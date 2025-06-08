import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Button,
  Divider,
  CircularProgress,
  useTheme,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tooltip,
} from '@mui/material';
import { format } from 'date-fns';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptIcon from '@mui/icons-material/Receipt';
import BarChartIcon from '@mui/icons-material/BarChart';

import { useAuth } from '../context/AuthContext';
import ExpenseChart from '../components/dashboard/ExpenseChart';
import CategoryDistribution from '../components/dashboard/CategoryDistribution';
import RecentExpenses from '../components/dashboard/RecentExpenses';
import MonthlyComparison from '../components/dashboard/MonthlyComparison';
import DashboardSkeleton from '../components/skeletons/DashboardSkeleton';
import axios from 'axios';

const Dashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [recentExpenses, setRecentExpenses] = useState([]);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get current month's expenses statistics
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        const [expenseStats, recentExpensesRes, monthlyReport] = await Promise.all([
          axios.get(`/api/expenses/stats?month=${month}&year=${year}`),
          axios.get('/api/expenses?limit=5&sort=-date'),
          axios.get(`/api/reports/month/${year}/${month}`)
        ]);
        
        setDashboardData({
          stats: expenseStats.data.data,
          report: monthlyReport.data.data
        });
        
        setRecentExpenses(recentExpensesRes.data.data.expenses);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) {
    return <DashboardSkeleton />;
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6" gutterBottom>
          {error}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </Box>
    );
  }
  
  const {
    stats = {},
    report = {}
  } = dashboardData || {};
  
  const {
    totalExpenses = 0,
    categoryBreakdown = [],
    dailyExpenses = []
  } = stats;
  
  const {
    comparisonWithPreviousMonth = {},
    budgetStatus = {},
    insights = []
  } = report;
  
  const currentDate = new Date();
  const formattedMonth = format(currentDate, 'MMMM yyyy');
  
  return (
    <Box className="page-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/expenses/add"
        >
          Add Expense
        </Button>
      </Box>
      
      <Typography variant="h6" color="textSecondary" gutterBottom>
        {formattedMonth} Overview
      </Typography>
      
      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Expenses Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: theme.palette.primary.main,
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Total Expenses
              </Typography>
              <AccountBalanceWalletIcon />
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
              {user?.currency} {totalExpenses.toFixed(2)}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 'auto' }}>
              {comparisonWithPreviousMonth.percentageChange > 0 ? (
                <>
                  <TrendingUpIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.error.light }} />
                  <Typography variant="body2">
                    {Math.abs(comparisonWithPreviousMonth.percentageChange).toFixed(1)}% from last month
                  </Typography>
                </>
              ) : (
                <>
                  <TrendingDownIcon fontSize="small" sx={{ mr: 0.5, color: theme.palette.success.light }} />
                  <Typography variant="body2">
                    {Math.abs(comparisonWithPreviousMonth.percentageChange).toFixed(1)}% from last month
                  </Typography>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
        
        {/* Budget Status Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: budgetStatus.status === 'over' 
                ? theme.palette.error.main 
                : theme.palette.success.main,
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Budget Status
              </Typography>
              <BarChartIcon />
            </Box>
            <Typography variant="h4" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
              {budgetStatus.percentUsed ? `${budgetStatus.percentUsed}%` : 'No Budget'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 'auto' }}>
              {budgetStatus.status === 'over' 
                ? `${user?.currency} ${budgetStatus.overBy} over budget` 
                : budgetStatus.status === 'under'
                  ? `${user?.currency} ${budgetStatus.remainingBudget} remaining`
                  : 'Set a monthly budget in profile'}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Categories Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: theme.palette.secondary.main,
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Top Category
              </Typography>
              <CategoryIcon />
            </Box>
            <Typography variant="h5" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
              {categoryBreakdown[0]?.name || 'No Data'}
            </Typography>
            <Typography variant="body2" sx={{ mt: 'auto' }}>
              {categoryBreakdown[0] 
                ? `${user?.currency} ${categoryBreakdown[0].total.toFixed(2)} (${categoryBreakdown[0].percentage}%)` 
                : 'Add expenses to see categories'}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Recent Activity Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              bgcolor: theme.palette.info.main,
              color: 'white',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                Recent Activity
              </Typography>
              <ReceiptIcon />
            </Box>
            <Typography variant="h5" component="div" sx={{ mt: 2, fontWeight: 'bold' }}>
              {recentExpenses.length} Expenses
            </Typography>
            <Typography variant="body2" sx={{ mt: 'auto' }}>
              {recentExpenses.length > 0 
                ? `Last added: ${format(new Date(recentExpenses[0].date), 'MMM d, yyyy')}` 
                : 'No recent expenses'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Charts and Lists */}
      <Grid container spacing={3}>
        {/* Monthly Expense Trend */}
        <Grid item xs={12} md={8}>
          <Card elevation={0}>
            <CardHeader 
              title="Monthly Expense Trend" 
              action={
                <Button 
                  component={RouterLink} 
                  to="/reports"
                  size="small"
                >
                  View Reports
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <ExpenseChart dailyExpenses={dailyExpenses} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Category Distribution */}
        <Grid item xs={12} md={4}>
          <Card elevation={0}>
            <CardHeader 
              title="Category Distribution" 
              action={
                <Button 
                  component={RouterLink} 
                  to="/categories"
                  size="small"
                >
                  Manage
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <CategoryDistribution categories={categoryBreakdown} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Expenses */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}>
            <CardHeader 
              title="Recent Expenses" 
              action={
                <Button 
                  component={RouterLink} 
                  to="/expenses"
                  size="small"
                >
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent sx={{ p: 0 }}>
              <RecentExpenses expenses={recentExpenses} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Insights */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}>
            <CardHeader title="Insights & Tips" />
            <Divider />
            <CardContent>
              <List>
                {insights.length > 0 ? (
                  insights.slice(0, 4).map((insight, index) => (
                    <ListItem key={index} alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                          {index + 1}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={insight.title}
                        secondary={insight.description}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem>
                    <ListItemText
                      primary="No insights available yet"
                      secondary="Add more expenses to get personalized insights"
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;