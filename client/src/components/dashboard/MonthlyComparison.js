import React from 'react';
import { Box, Typography, LinearProgress, useTheme } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

import { useAuth } from '../../context/AuthContext';

const MonthlyComparison = ({ comparison }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  if (!comparison) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body2" color="textSecondary">
          No comparison data available
        </Typography>
      </Box>
    );
  }
  
  const { currentMonth, previousMonth, difference, percentageChange } = comparison;
  
  // Determine color and icon based on the trend
  let trendColor, TrendIcon;
  
  if (percentageChange > 5) {
    trendColor = theme.palette.error.main;
    TrendIcon = TrendingUpIcon;
  } else if (percentageChange < -5) {
    trendColor = theme.palette.success.main;
    TrendIcon = TrendingDownIcon;
  } else {
    trendColor = theme.palette.info.main;
    TrendIcon = TrendingFlatIcon;
  }
  
  // Calculate progress value (capped at 100%)
  const progressValue = Math.min(
    (currentMonth / (previousMonth || 1)) * 100,
    100
  );
  
  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" color="textSecondary">
          This Month
        </Typography>
        <Typography variant="subtitle2" color="textSecondary">
          Last Month
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          {user?.currency} {currentMonth.toFixed(2)}
        </Typography>
        <Typography variant="h6">
          {user?.currency} {previousMonth.toFixed(2)}
        </Typography>
      </Box>
      
      <LinearProgress 
        variant="determinate" 
        value={progressValue} 
        sx={{ 
          height: 8, 
          borderRadius: 4,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
          '& .MuiLinearProgress-bar': {
            bgcolor: trendColor,
          },
        }} 
      />
      
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
        <TrendIcon sx={{ color: trendColor, mr: 1 }} />
        <Typography variant="body2" sx={{ color: trendColor, fontWeight: 'medium' }}>
          {percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%
        </Typography>
        <Typography variant="body2" sx={{ ml: 1 }}>
          ({difference > 0 ? '+' : ''}{user?.currency} {difference.toFixed(2)})
        </Typography>
      </Box>
      
      <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
        {percentageChange > 5 
          ? 'Your spending has increased significantly compared to last month.'
          : percentageChange < -5
            ? 'Great job! Your spending has decreased compared to last month.'
            : 'Your spending is about the same as last month.'}
      </Typography>
    </Box>
  );
};

export default MonthlyComparison;