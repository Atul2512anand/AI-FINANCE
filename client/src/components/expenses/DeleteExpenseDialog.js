import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const DeleteExpenseDialog = ({ open, expense, onConfirm, onCancel }) => {
  const { user } = useAuth();
  
  if (!expense) {
    return null;
  }
  
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="delete-expense-dialog-title"
      aria-describedby="delete-expense-dialog-description"
    >
      <DialogTitle id="delete-expense-dialog-title">
        Delete Expense
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-expense-dialog-description">
          Are you sure you want to delete this expense? This action cannot be undone.
        </DialogContentText>
        
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Expense Details:
          </Typography>
          <Typography variant="body2">
            <strong>Description:</strong> {expense.description}
          </Typography>
          <Typography variant="body2">
            <strong>Amount:</strong> {user?.currency} {expense.amount.toFixed(2)}
          </Typography>
          <Typography variant="body2">
            <strong>Date:</strong> {format(new Date(expense.date), 'MMMM d, yyyy')}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteExpenseDialog;