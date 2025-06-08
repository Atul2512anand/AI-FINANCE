import React from 'react';
import {
  Box,
  Grid,
  Paper,
  Skeleton,
  Card,
  CardHeader,
  CardContent,
  Divider,
} from '@mui/material';

const DashboardSkeleton = () => {
  return (
    <Box className="page-container">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" width={150} height={40} />
      </Box>
      
      <Skeleton variant="text" width={180} height={30} sx={{ mb: 2 }} />
      
      {/* Summary Cards Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array.from(new Array(4)).map((_, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                height: 140,
                borderRadius: 2,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton variant="text" width={100} />
                <Skeleton variant="circular" width={24} height={24} />
              </Box>
              <Skeleton variant="text" width="60%" height={40} sx={{ mt: 2 }} />
              <Box sx={{ mt: 'auto' }}>
                <Skeleton variant="text" width="80%" />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      {/* Charts and Lists Skeleton */}
      <Grid container spacing={3}>
        {/* Monthly Expense Trend Skeleton */}
        <Grid item xs={12} md={8}>
          <Card elevation={0}>
            <CardHeader 
              title={<Skeleton variant="text" width={180} />} 
              action={<Skeleton variant="rounded" width={100} height={36} />}
            />
            <Divider />
            <CardContent>
              <Skeleton variant="rectangular" height={300} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Category Distribution Skeleton */}
        <Grid item xs={12} md={4}>
          <Card elevation={0}>
            <CardHeader 
              title={<Skeleton variant="text" width={180} />} 
              action={<Skeleton variant="rounded" width={100} height={36} />}
            />
            <Divider />
            <CardContent>
              <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Expenses Skeleton */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}>
            <CardHeader 
              title={<Skeleton variant="text" width={150} />} 
              action={<Skeleton variant="rounded" width={100} height={36} />}
            />
            <Divider />
            <CardContent>
              {Array.from(new Array(5)).map((_, index) => (
                <Box key={index} sx={{ display: 'flex', py: 1.5, alignItems: 'center' }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="40%" />
                  </Box>
                  <Skeleton variant="text" width={80} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Insights Skeleton */}
        <Grid item xs={12} md={6}>
          <Card elevation={0}>
            <CardHeader title={<Skeleton variant="text" width={150} />} />
            <Divider />
            <CardContent>
              {Array.from(new Array(4)).map((_, index) => (
                <Box key={index} sx={{ display: 'flex', py: 1.5, alignItems: 'flex-start' }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="80%" />
                    <Skeleton variant="text" width="90%" />
                    <Skeleton variant="text" width="60%" />
                  </Box>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardSkeleton;