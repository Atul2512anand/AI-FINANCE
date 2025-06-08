import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
  FormHelperText,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import SaveIcon from '@mui/icons-material/Save';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const paymentMethods = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Bank Transfer',
  'Mobile Payment',
  'Check',
  'Other',
];

const EditExpense = () => {
  const { expenseId } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [expense, setExpense] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch expense and categories in parallel
        const [expenseResponse, categoriesResponse] = await Promise.all([
          axios.get(`/api/expenses/${expenseId}`),
          axios.get('/api/categories')
        ]);
        
        setExpense(expenseResponse.data.data);
        setCategories(categoriesResponse.data.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load expense data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [expenseId]);
  
  const formik = useFormik({
    initialValues: {
      amount: '',
      description: '',
      date: new Date(),
      category: '',
      paymentMethod: 'Credit Card',
      location: '',
      notes: '',
      tags: '',
    },
    validationSchema: Yup.object({
      amount: Yup.number()
        .positive('Amount must be positive')
        .required('Amount is required')
        .typeError('Amount must be a number'),
      description: Yup.string()
        .required('Description is required')
        .max(100, 'Description must be 100 characters or less'),
      date: Yup.date()
        .required('Date is required')
        .max(new Date(), 'Date cannot be in the future'),
      category: Yup.string()
        .required('Category is required'),
      paymentMethod: Yup.string()
        .required('Payment method is required'),
      location: Yup.string()
        .max(100, 'Location must be 100 characters or less'),
      notes: Yup.string()
        .max(500, 'Notes must be 500 characters or less'),
      tags: Yup.string()
        .max(100, 'Tags must be 100 characters or less'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setSubmitting(true);
        setError(null);
        
        // Process tags if provided
        const processedValues = { ...values };
        if (values.tags) {
          processedValues.tags = values.tags.split(',').map(tag => tag.trim());
        }
        
        await axios.put(`/api/expenses/${expenseId}`, processedValues);
        
        setSuccess(true);
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/expenses');
        }, 1500);
      } catch (err) {
        console.error('Error updating expense:', err);
        setError(err.response?.data?.message || 'Failed to update expense. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    enableReinitialize: true,
  });
  
  // Set form values when expense data is loaded
  useEffect(() => {
    if (expense) {
      formik.setValues({
        amount: expense.amount,
        description: expense.description,
        date: new Date(expense.date),
        category: expense.category._id,
        paymentMethod: expense.paymentMethod,
        location: expense.location || '',
        notes: expense.notes || '',
        tags: expense.tags ? expense.tags.join(', ') : '',
      });
    }
  }, [expense]);
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      try {
        setSubmitting(true);
        await axios.delete(`/api/expenses/${expenseId}`);
        navigate('/expenses');
      } catch (err) {
        console.error('Error deleting expense:', err);
        setError(err.response?.data?.message || 'Failed to delete expense. Please try again.');
        setSubmitting(false);
      }
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!expense && !loading) {
    return (
      <Box className="page-container">
        <Alert severity="error">
          Expense not found or you don't have permission to view it.
        </Alert>
        <Button 
          variant="contained" 
          onClick={() => navigate('/expenses')} 
          sx={{ mt: 2 }}
        >
          Back to Expenses
        </Button>
      </Box>
    );
  }
  
  return (
    <Box className="page-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Edit Expense
      </Typography>
      
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Expense updated successfully!
          </Alert>
        )}
        
        <Box component="form" onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                id="amount"
                name="amount"
                label="Amount"
                type="number"
                value={formik.values.amount}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.amount && Boolean(formik.errors.amount)}
                helperText={formik.touched.amount && formik.errors.amount}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{user?.currency}</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Date"
                  value={formik.values.date}
                  onChange={(date) => formik.setFieldValue('date', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={formik.touched.date && Boolean(formik.errors.date)}
                      helperText={formik.touched.date && formik.errors.date}
                    />
                  )}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="description"
                name="description"
                label="Description"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl 
                fullWidth 
                error={formik.touched.category && Boolean(formik.errors.category)}
              >
                <InputLabel id="category-label">Category</InputLabel>
                <Select
                  labelId="category-label"
                  id="category"
                  name="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  label="Category"
                >
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        {category.name}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No categories available</MenuItem>
                  )}
                </Select>
                {formik.touched.category && formik.errors.category && (
                  <FormHelperText>{formik.errors.category}</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="payment-method-label">Payment Method</InputLabel>
                <Select
                  labelId="payment-method-label"
                  id="paymentMethod"
                  name="paymentMethod"
                  value={formik.values.paymentMethod}
                  onChange={formik.handleChange}
                  label="Payment Method"
                >
                  {paymentMethods.map((method) => (
                    <MenuItem key={method} value={method}>
                      {method}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="location"
                name="location"
                label="Location (Optional)"
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.location && Boolean(formik.errors.location)}
                helperText={formik.touched.location && formik.errors.location}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="tags"
                name="tags"
                label="Tags (Optional, comma separated)"
                value={formik.values.tags}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.tags && Boolean(formik.errors.tags)}
                helperText={
                  (formik.touched.tags && formik.errors.tags) ||
                  'Enter tags separated by commas (e.g., groceries, food, essentials)'
                }
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                id="notes"
                name="notes"
                label="Notes (Optional)"
                multiline
                rows={4}
                value={formik.values.notes}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.notes && Boolean(formik.errors.notes)}
                helperText={formik.touched.notes && formik.errors.notes}
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              disabled={submitting}
            >
              Delete
            </Button>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/expenses')}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={submitting ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={submitting || formik.isSubmitting}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default EditExpense;