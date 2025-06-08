import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Divider,
  Button,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FastfoodIcon from '@mui/icons-material/Fastfood';
import HomeIcon from '@mui/icons-material/Home';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import SchoolIcon from '@mui/icons-material/School';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';
import FlightIcon from '@mui/icons-material/Flight';

import { useAuth } from '../../context/AuthContext';

// Map of category icons
const categoryIcons = {
  'Groceries': <ShoppingBagIcon />,
  'Food & Dining': <FastfoodIcon />,
  'Housing': <HomeIcon />,
  'Transportation': <DirectionsCarIcon />,
  'Healthcare': <LocalHospitalIcon />,
  'Education': <SchoolIcon />,
  'Entertainment': <SportsEsportsIcon />,
  'Travel': <FlightIcon />,
  'default': <ReceiptIcon />,
};

const RecentExpenses = ({ expenses = [] }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  if (expenses.length === 0) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          No recent expenses found
        </Typography>
        <Button 
          component={RouterLink} 
          to="/expenses/add"
          variant="contained"
          size="small"
          sx={{ mt: 1 }}
        >
          Add Expense
        </Button>
      </Box>
    );
  }
  
  return (
    <List disablePadding>
      {expenses.map((expense, index) => {
        // Get icon based on category name or default
        const categoryName = expense.category?.name || '';
        const icon = categoryIcons[categoryName] || categoryIcons.default;
        const color = expense.category?.color || theme.palette.primary.main;
        
        return (
          <React.Fragment key={expense._id}>
            <ListItem 
              button 
              component={RouterLink} 
              to={`/expenses/${expense._id}`}
              sx={{ py: 1.5 }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: color }}>
                  {icon}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={expense.description}
                secondary={format(new Date(expense.date), 'MMM d, yyyy')}
                primaryTypographyProps={{ variant: 'body1' }}
                secondaryTypographyProps={{ variant: 'body2' }}
              />
              <ListItemSecondaryAction>
                <Typography 
                  variant="body2" 
                  sx={{ fontWeight: 'bold', color: theme.palette.error.main }}
                >
                  {user?.currency} {expense.amount.toFixed(2)}
                </Typography>
              </ListItemSecondaryAction>
            </ListItem>
            {index < expenses.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        );
      })}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Button 
          component={RouterLink} 
          to="/expenses"
          variant="outlined"
          size="small"
        >
          View All Expenses
        </Button>
      </Box>
    </List>
  );
};

export default RecentExpenses;