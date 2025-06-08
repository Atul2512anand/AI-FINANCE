import React from 'react';
import { Box, useTheme } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const ExpenseChart = ({ dailyExpenses = [] }) => {
  const theme = useTheme();
  
  // Sort expenses by date
  const sortedExpenses = [...dailyExpenses].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
  
  const labels = sortedExpenses.map(expense => {
    const date = new Date(expense.date);
    return date.getDate();
  });
  
  const data = {
    labels,
    datasets: [
      {
        label: 'Daily Expenses',
        data: sortedExpenses.map(expense => expense.total),
        borderColor: theme.palette.primary.main,
        backgroundColor: `${theme.palette.primary.main}20`, // 20 is hex for 12% opacity
        tension: 0.4,
        fill: true,
        pointBackgroundColor: theme.palette.primary.main,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
          title: (context) => {
            const index = context[0].dataIndex;
            const date = new Date(sortedExpenses[index].date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          },
          label: (context) => {
            const value = context.raw;
            return `Total: $${value.toFixed(2)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        title: {
          display: true,
          text: 'Day of Month',
          color: theme.palette.text.secondary,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: theme.palette.divider,
        },
        title: {
          display: true,
          text: 'Amount',
          color: theme.palette.text.secondary,
        },
        ticks: {
          callback: (value) => `$${value}`,
        },
      },
    },
  };
  
  return (
    <Box sx={{ height: 300, position: 'relative' }}>
      {dailyExpenses.length > 0 ? (
        <Line data={data} options={options} />
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
          No expense data available for this month
        </Box>
      )}
    </Box>
  );
};

export default ExpenseChart;