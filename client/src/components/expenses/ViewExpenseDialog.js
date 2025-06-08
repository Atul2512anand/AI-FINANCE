import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  Grid,
  useTheme,
  IconButton,
} from '@mui/material';
import { format } from 'date-fns';
import CloseIcon from '@mui/icons-material/Close';
import DateRangeIcon from '@mui/icons-material/DateRange';
import CategoryIcon from '@mui/icons-material/Category';
import PaymentIcon from '@mui/icons-material/Payment';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LabelIcon from '@mui/icons-material/Label';
import NotesIcon from '@mui/icons-material/Notes';
import { useAuth } from '../../context/AuthContext';

const ViewExpenseDialog = ({ open, expense, onClose, onEdit }) => {
  const theme = useTheme();
  const { user } = useAuth();

  if (!expense) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" component="div">
          Expense Details
        </Typography>
        <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h5" component="h2">
              {expense.description}
            </Typography>
            <Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}>
              {user?.currency}{expense.amount.toFixed(2)}
            </Typography>
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
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
            <Box sx={{ mt: 2 }}>
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
              <Box 
                sx={{ 
                  p: 2, 
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body1">
                  {expense.notes}
                </Typography>
              </Box>
            </Box>
          )}
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="textSecondary">
              Created: {format(new Date(expense.createdAt), 'MMM dd, yyyy HH:mm')}
            </Typography>
            {expense.updatedAt && expense.updatedAt !== expense.createdAt && (
              <Typography variant="body2" color="textSecondary">
                Updated: {format(new Date(expense.updatedAt), 'MMM dd, yyyy HH:mm')}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary" onClick={() => onEdit(expense._id)}>
          Edit
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ViewExpenseDialog;