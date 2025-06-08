import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  useTheme,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SaveIcon from '@mui/icons-material/Save';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { useAuth } from '../context/AuthContext';

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' },
];

const Profile = () => {
  const theme = useTheme();
  const { user, updateProfile, changePassword } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Profile form
  const profileFormik = useFormik({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      currency: user?.currency || '$',
      monthlyBudget: user?.monthlyBudget || '',
      monthlyIncome: user?.monthlyIncome || '',
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('Name is required')
        .max(100, 'Name must be 100 characters or less'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      currency: Yup.string()
        .required('Currency is required'),
      monthlyBudget: Yup.number()
        .positive('Monthly budget must be positive')
        .nullable()
        .typeError('Monthly budget must be a number'),
      monthlyIncome: Yup.number()
        .positive('Monthly income must be positive')
        .nullable()
        .typeError('Monthly income must be a number'),
    }),
    onSubmit: async (values, { setSubmitting }) => {
      try {
        setLoading(true);
        setProfileError(null);
        setProfileSuccess(false);
        
        await updateProfile(values);
        
        setProfileSuccess(true);
      } catch (err) {
        console.error('Error updating profile:', err);
        setProfileError(err.message || 'Failed to update profile. Please try again.');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
    enableReinitialize: true,
  });
  
  // Password form
  const passwordFormik = useFormik({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validationSchema: Yup.object({
      currentPassword: Yup.string()
        .required('Current password is required'),
      newPassword: Yup.string()
        .required('New password is required')
        .min(8, 'Password must be at least 8 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\w\W]{8,}$/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
        .required('Confirm password is required'),
    }),
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        setLoading(true);
        setPasswordError(null);
        setPasswordSuccess(false);
        
        await changePassword(values.currentPassword, values.newPassword);
        
        setPasswordSuccess(true);
        resetForm();
      } catch (err) {
        console.error('Error changing password:', err);
        setPasswordError(err.message || 'Failed to change password. Please try again.');
      } finally {
        setLoading(false);
        setSubmitting(false);
      }
    },
  });
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setProfileSuccess(false);
    setProfileError(null);
    setPasswordSuccess(false);
    setPasswordError(null);
  };
  
  return (
    <Box className="page-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Profile Settings
      </Typography>
      
      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<PersonIcon />} label="Account" />
          <Tab icon={<LockIcon />} label="Password" />
          <Tab icon={<AccountBalanceWalletIcon />} label="Financial" />
        </Tabs>
        
        {/* Account Tab */}
        {tabValue === 0 && (
          <Box sx={{ p: 3 }}>
            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Profile updated successfully!
              </Alert>
            )}
            
            {profileError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {profileError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={profileFormik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="name"
                    name="name"
                    label="Name"
                    value={profileFormik.values.name}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.name && Boolean(profileFormik.errors.name)}
                    helperText={profileFormik.touched.name && profileFormik.errors.name}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email"
                    type="email"
                    value={profileFormik.values.email}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.email && Boolean(profileFormik.errors.email)}
                    helperText={profileFormik.touched.email && profileFormik.errors.email}
                    disabled // Email cannot be changed
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading || profileFormik.isSubmitting}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Password Tab */}
        {tabValue === 1 && (
          <Box sx={{ p: 3 }}>
            {passwordSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Password changed successfully!
              </Alert>
            )}
            
            {passwordError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {passwordError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={passwordFormik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="currentPassword"
                    name="currentPassword"
                    label="Current Password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordFormik.values.currentPassword}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.currentPassword && Boolean(passwordFormik.errors.currentPassword)}
                    helperText={passwordFormik.touched.currentPassword && passwordFormik.errors.currentPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="newPassword"
                    name="newPassword"
                    label="New Password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordFormik.values.newPassword}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.newPassword && Boolean(passwordFormik.errors.newPassword)}
                    helperText={passwordFormik.touched.newPassword && passwordFormik.errors.newPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                          >
                            {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm New Password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordFormik.values.confirmPassword}
                    onChange={passwordFormik.handleChange}
                    onBlur={passwordFormik.handleBlur}
                    error={passwordFormik.touched.confirmPassword && Boolean(passwordFormik.errors.confirmPassword)}
                    helperText={passwordFormik.touched.confirmPassword && passwordFormik.errors.confirmPassword}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading || passwordFormik.isSubmitting}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
        
        {/* Financial Tab */}
        {tabValue === 2 && (
          <Box sx={{ p: 3 }}>
            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 3 }}>
                Financial settings updated successfully!
              </Alert>
            )}
            
            {profileError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {profileError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={profileFormik.handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl 
                    fullWidth
                    error={profileFormik.touched.currency && Boolean(profileFormik.errors.currency)}
                  >
                    <InputLabel id="currency-label">Currency</InputLabel>
                    <Select
                      labelId="currency-label"
                      id="currency"
                      name="currency"
                      value={profileFormik.values.currency}
                      onChange={profileFormik.handleChange}
                      onBlur={profileFormik.handleBlur}
                      label="Currency"
                    >
                      {currencies.map((currency) => (
                        <MenuItem key={currency.code} value={currency.symbol}>
                          {currency.symbol} - {currency.name} ({currency.code})
                        </MenuItem>
                      ))}
                    </Select>
                    {profileFormik.touched.currency && profileFormik.errors.currency && (
                      <FormHelperText>{profileFormik.errors.currency}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="monthlyBudget"
                    name="monthlyBudget"
                    label="Monthly Budget (Optional)"
                    type="number"
                    value={profileFormik.values.monthlyBudget}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.monthlyBudget && Boolean(profileFormik.errors.monthlyBudget)}
                    helperText={
                      (profileFormik.touched.monthlyBudget && profileFormik.errors.monthlyBudget) ||
                      'Set your monthly spending budget to track your expenses against it'
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{profileFormik.values.currency}</InputAdornment>,
                    }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="monthlyIncome"
                    name="monthlyIncome"
                    label="Monthly Income (Optional)"
                    type="number"
                    value={profileFormik.values.monthlyIncome}
                    onChange={profileFormik.handleChange}
                    onBlur={profileFormik.handleBlur}
                    error={profileFormik.touched.monthlyIncome && Boolean(profileFormik.errors.monthlyIncome)}
                    helperText={
                      (profileFormik.touched.monthlyIncome && profileFormik.errors.monthlyIncome) ||
                      'Set your monthly income to calculate savings rate and get better financial insights'
                    }
                    InputProps={{
                      startAdornment: <InputAdornment position="start">{profileFormik.values.currency}</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  disabled={loading || profileFormik.isSubmitting}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Profile;