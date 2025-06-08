import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const CategoryDistribution = ({ categories = [] }) => {
  const theme = useTheme();
  
  // Take top 5 categories, group the rest as "Other"
  const processedCategories = [...categories];
  let otherTotal = 0;
  let otherPercentage = 0;
  
  if (processedCategories.length > 5) {
    const topCategories = processedCategories.slice(0, 5);
    const otherCategories = processedCategories.slice(5);
    
    otherTotal = otherCategories.reduce((sum, category) => sum + category.total, 0);
    otherPercentage = otherCategories.reduce((sum, category) => sum + category.percentage, 0);
    
    processedCategories.length = 0;
    processedCategories.push(...topCategories, {
      name: 'Other',
      total: otherTotal,
      percentage: otherPercentage,
      color: theme.palette.grey[500],
    });
  }
  
  const data = {
    labels: processedCategories.map(category => category.name),
    datasets: [
      {
        data: processedCategories.map(category => category.total),
        backgroundColor: processedCategories.map(category => category.color || theme.palette.primary.main),
        borderColor: theme.palette.background.paper,
        borderWidth: 2,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 15,
          padding: 15,
          font: {
            size: 12,
          },
          color: theme.palette.text.primary,
        },
      },
      tooltip: {
        backgroundColor: theme.palette.background.paper,
        titleColor: theme.palette.text.primary,
        bodyColor: theme.palette.text.secondary,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const category = processedCategories[context.dataIndex];
            return [
              `${category.name}: $${category.total.toFixed(2)}`,
              `${category.percentage.toFixed(1)}% of total`,
            ];
          },
        },
      },
    },
  };
  
  return (
    <Box sx={{ height: 300, position: 'relative' }}>
      {categories.length > 0 ? (
        <Pie data={data} options={options} />
      ) : (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: theme.palette.text.secondary,
          }}
        >
          No category data available
        </Box>
      )}
    </Box>
  );
};

export default CategoryDistribution;