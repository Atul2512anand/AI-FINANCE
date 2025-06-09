const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// ✅ Explicit CORS config for Vercel frontend
app.use(cors({
  origin: 'https://ai-finance-two-blush.vercel.app', // your Vercel frontend URL
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));

// (Optional) Preflight support
app.options('*', cors());

// Middleware
app.use(express.json());
app.use(morgan('dev'));

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('ERROR: MONGODB_URI not set!');
  process.exit(1); // stop app if no URI
}

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})


// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const expenseRoutes = require('./routes/expenses');
const categoryRoutes = require('./routes/categories');
const reportRoutes = require('./routes/reports');

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports', reportRoutes);

// 🔍 Optional test route to confirm API is live
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working ✅' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: err.message || 'Server Error',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
