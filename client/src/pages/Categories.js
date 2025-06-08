import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Divider,
  Chip,
  Alert,
  CircularProgress,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';

const Categories = () => {
  const theme = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  
  // Fetch categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/categories');
      setCategories(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Form for adding/editing categories
  const formik = useFormik({
    initialValues: {
      name: '',
      description: '',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      icon: '',
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .required('Category name is required')
        .max(50, 'Category name must be 50 characters or less'),
      description: Yup.string()
        .max(200, 'Description must be 200 characters or less'),
      color: Yup.string()
        .matches(/^#[0-9A-F]{6}$/i, 'Invalid color format (use #RRGGBB)'),
      icon: Yup.string()
        .max(50, 'Icon name must be 50 characters or less'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        setError(null);
        setSuccess(null);
        
        if (editingCategory) {
          // Update existing category
          await axios.put(`/api/categories/${editingCategory._id}`, values);
          setSuccess(`Category "${values.name}" updated successfully`);
          setEditingCategory(null);
        } else {
          // Create new category
          await axios.post('/api/categories', values);
          setSuccess(`Category "${values.name}" created successfully`);
        }
        
        resetForm();
        fetchCategories();
      } catch (err) {
        console.error('Error saving category:', err);
        setError(err.response?.data?.message || 'Failed to save category. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
  });
  
  // Set form values when editing a category
  useEffect(() => {
    if (editingCategory) {
      formik.setValues({
        name: editingCategory.name,
        description: editingCategory.description || '',
        color: editingCategory.color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
        icon: editingCategory.icon || '',
      });
    }
  }, [editingCategory]);
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCategory(null);
    formik.resetForm();
  };
  
  // Open delete confirmation dialog
  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };
  
  // Delete category
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    
    try {
      setLoading(true);
      await axios.delete(`/api/categories/${categoryToDelete._id}`);
      setSuccess(`Category "${categoryToDelete.name}" deleted successfully`);
      fetchCategories();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err.response?.data?.message || 'Failed to delete category. Please try again.');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };
  
  // Generate a random color
  const generateRandomColor = () => {
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    formik.setFieldValue('color', randomColor);
  };
  
  return (
    <Box className="page-container">
      <Typography variant="h4" component="h1" gutterBottom>
        Categories
      </Typography>
      
      <Grid container spacing={3}>
        {/* Category Form */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              {editingCategory ? 'Edit Category' : 'Add New Category'}
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}
            
            <Box component="form" onSubmit={formik.handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                id="name"
                name="name"
                label="Category Name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
              />
              
              <TextField
                fullWidth
                margin="normal"
                id="description"
                name="description"
                label="Description (Optional)"
                value={formik.values.description}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.description && Boolean(formik.errors.description)}
                helperText={formik.touched.description && formik.errors.description}
              />
              
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                <TextField
                  fullWidth
                  margin="normal"
                  id="color"
                  name="color"
                  label="Color"
                  value={formik.values.color}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.color && Boolean(formik.errors.color)}
                  helperText={formik.touched.color && formik.errors.color}
                  sx={{ mr: 2 }}
                />
                <Box 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: formik.values.color,
                    border: `1px solid ${theme.palette.divider}`,
                    mr: 1,
                  }} 
                />
                <Button 
                  size="small" 
                  onClick={generateRandomColor}
                  variant="outlined"
                >
                  Random
                </Button>
              </Box>
              
              <TextField
                fullWidth
                margin="normal"
                id="icon"
                name="icon"
                label="Icon Name (Optional)"
                value={formik.values.icon}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.icon && Boolean(formik.errors.icon)}
                helperText={
                  (formik.touched.icon && formik.errors.icon) ||
                  'Material icon name, e.g., "shopping", "food", "home"'
                }
              />
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                {editingCategory && (
                  <Button
                    variant="outlined"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : <AddIcon />}
                  disabled={formik.isSubmitting}
                >
                  {editingCategory ? 'Update' : 'Add'} Category
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Categories List */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Your Categories
            </Typography>
            
            {loading && !categories.length ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : categories.length === 0 ? (
              <Alert severity="info">
                You don't have any categories yet. Create your first category to get started.
              </Alert>
            ) : (
              <List>
                {categories.map((category) => (
                  <React.Fragment key={category._id}>
                    <ListItem>
                      <Box 
                        sx={{ 
                          width: 24, 
                          height: 24, 
                          borderRadius: '50%', 
                          bgcolor: category.color || '#ccc',
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }} 
                      >
                        <CategoryIcon sx={{ fontSize: 16, color: '#fff' }} />
                      </Box>
                      <ListItemText 
                        primary={category.name}
                        secondary={category.description || 'No description'}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="edit"
                          onClick={() => setEditingCategory(category)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => handleDeleteClick(category)}
                          sx={{ ml: 1 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the category "{categoryToDelete?.name}"?
            This action cannot be undone, and any expenses associated with this category
            will need to be reassigned.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Categories;