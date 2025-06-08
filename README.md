# Expense Tracker Dashboard

A web dashboard that tracks expenses, categorizes them using machine learning, and provides monthly reports and spending advice.

## Features

- User authentication and profile management
- Expense tracking and management
- ML-based expense categorization
- Monthly financial reports
- Personalized spending advice
- Responsive web interface

## Tech Stack

- **Frontend**: React.js, Chart.js, Material-UI
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **ML**: TensorFlow.js for expense categorization
- **Authentication**: JWT (JSON Web Tokens)

## Project Structure

```
├── client/                 # Frontend React application
├── server/                 # Backend Node.js/Express application
│   ├── controllers/        # Request handlers
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── ml/                 # Machine learning models
├── .env                    # Environment variables
├── .gitignore              # Git ignore file
└── README.md               # Project documentation
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies for both client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create a `.env` file in the server directory with the following variables:

```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Start the development servers:

```bash
# Start the backend server
cd server
npm run dev

# In another terminal, start the frontend client
cd client
npm start
```

5. Open your browser and navigate to `http://localhost:3000`

## License

MIT