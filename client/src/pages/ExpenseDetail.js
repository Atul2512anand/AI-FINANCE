import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CategoryIcon from '@mui/icons-material/Category';
import PaymentIcon from '@mui/icons-material/Payment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LabelIcon from '@mui/icons-material/Label';
import NotesIcon from '@mui/icons-material/Notes';

import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import DeleteExpenseDialog from '../components/expenses/DeleteExpenseDialog';

const ExpenseDetail = () => {
  const { expenseId } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchExpense = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/expenses/${expenseId}`);
        setExpense(response.data.data);
      } catch (err) {
        console.error('Error fetching expense:', err);
        setError(err.response?.data?.message || 'Failed to load expense details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExpense();
  }, [expenseId]);
  
  const handleEdit = () => {
    navigate(`/expenses/${expenseId}/edit`);
  };
  
  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`/api/expenses/${expenseId}`);
      navigate('/expenses');
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError(err.response?.data?.message || 'Failed to delete expense. Please try again.');
      setDeleteDialogOpen(false);
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !expense) {
    return (
      <Box className="page-container">
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Expense not found or you don\'t have permission to view it.'}
        </Alert>
        <Button 
          variant="contained" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/expenses')} 
        >
          Back to Expenses
        </Button>
      </Box>
    );
  }
  
  return (
    <Box className="page-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/expenses')}
        >
          Back to Expenses
        </Button>
        
        <Box>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEdit}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
          >
            Delete
          </Button>
        </Box>
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Typography variant="h4" component="h1">
                {expense.description}
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
                {user?.currency}{expense.amount.toFixed(2)}
              </Typography>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <DateRangeIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                  <Typography variant="body1">
                    {format(new Date(expense.date), 'MMMM dd, yyyy')}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CategoryIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                  <Typography variant="body1">
                    {expense.category?.name || 'Uncategorized'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <PaymentIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                  <Typography variant="body1">
                    {expense.paymentMethod || 'Not specified'}
                  </Typography>
                </Box>
              </Grid>
              
              {expense.location && (
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LocationOnIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                    <Typography variant="body1">
                      {expense.location}
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
            
            {expense.tags && expense.tags.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <LabelIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" color="textSecondary">
                    Tags:
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {expense.tags.map((tag, index) => (
                    <Chip 
                      key={index} 
                      label={tag} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  ))}
                </Box>
              </Box>
            )}
            
            {expense.notes && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <NotesIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                  <Typography variant="body2" color="textSecondary">
                    Notes:
                  </Typography>
                </Box>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    p: 2, 
                    backgroundColor: theme.palette.background.default,
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body1">
                    {expense.notes}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Expense Details
            </Typography>
            
            <List>
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Created At" 
                  secondary={format(new Date(expense.createdAt), 'MMM dd, yyyy HH:mm')} 
                  primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
              
              {expense.updatedAt && expense.updatedAt !== expense.createdAt && (
                <ListItem sx={{ px: 0 }}>
                  <ListItemText 
                    primary="Last Updated" 
                    secondary={format(new Date(expense.updatedAt), 'MMM dd, yyyy HH:mm')} 
                    primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              )}
              
              <ListItem sx={{ px: 0 }}>
                <ListItemText 
                  primary="Expense ID" 
                  secondary={expense._id} 
                  primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                  secondaryTypographyProps={{ variant: 'body1' }}
                />
              </ListItem>
            </List>
          </Paper>
          
          {/* Additional information or related expenses could be added here */}
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <DeleteExpenseDialog 
        open={deleteDialogOpen}
        expense={expense}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </Box>
  );
};

export default ExpenseDetail;