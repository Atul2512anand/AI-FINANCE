# AI-FINANCE — Expense Tracker Dashboard

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?logo=mongodb&logoColor=white)
![TensorFlow.js](https://img.shields.io/badge/ML-TensorFlow.js-FF6F00?logo=tensorflow&logoColor=white)

A full-stack MERN expense tracker with JWT authentication, category and expense management, monthly reports, spending advice, and a machine-learning service that suggests a category when one is not supplied.

> The repository is named **AI-FINANCE**; the application inside it is an **Expense Tracker Dashboard**.

## Overview

The project is split into a React single-page client and an Express/MongoDB API. Users can record income and expenses, organise them with colour-coded categories, review charts on a dashboard, and generate monthly or yearly reports. The server includes a TensorFlow.js model that learns from a user's past expenses, with a lightweight text-similarity fallback for new users.

## Features

- Email/password registration and login with JWT authentication
- Profile updates, password changes, currency preference, and monthly budget
- Expense CRUD with amount, description, date, payment method, location, and category
- Filtering, pagination, and aggregate expense statistics
- Category CRUD with custom colours and icons
- Automatic **Uncategorized** category when no category can be predicted
- Monthly reports with category breakdowns, previous-month comparison, top expenses, daily trend, insights, and recommendations
- Yearly summaries and rule-based spending advice
- Dashboard charts and responsive Material UI layout
- Protected client routes and light/dark theme support
- Per-user ML categorisation using TensorFlow.js and `natural`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Create React App, Material UI 5, Chart.js, React Router 6, Axios, Formik, Yup |
| Backend | Node.js, Express 4, Mongoose 6, JWT, bcryptjs, express-validator, Morgan |
| Database | MongoDB |
| Machine learning | `@tensorflow/tfjs-node`, `natural` (tokenisation and stemming) |
| Tooling | nodemon, concurrently, Jest/Supertest (configured; no test files are committed) |

## How It Works

```text
React client (port 3000)
        │  Axios + JWT
        ▼
Express API (port 5000)
        │
        ├── MongoDB: users, categories, expenses, reports
        └── ML service: per-user category prediction
```

When an expense is created without a category, the API calls `mlService.predictCategory()`:

1. If a saved TensorFlow.js model exists for the user, it is loaded and used.
2. Otherwise, the service compares the new description with the user's last 100 expenses using Jaccard text similarity plus an amount-similarity bonus.
3. If no match exceeds the confidence threshold, the expense is assigned to an automatically created `Uncategorized` category.

The training code requires at least 20 categorised expenses and writes model files under `server/ml/models/user_<id>/`. Training is exposed through `trainModel()` and `scheduleTraining()` in the service, but **no route or cron job currently invokes it**, so the similarity fallback is what runs in a fresh deployment until a model is trained manually.

## Project Structure

```text
AI-FINANCE/
├── client/                     # React frontend
│   ├── public/
│   └── src/
│       ├── components/         # Dashboard, expense, layout, skeleton components
│       ├── context/            # Auth and theme providers
│       ├── layouts/
│       └── pages/              # Dashboard, Expenses, Reports, Profile, auth pages
├── server/                     # Express API
│   ├── controllers/            # auth, users, expenses, categories, reports
│   ├── middleware/             # JWT protection and request validators
│   ├── ml/                     # model storage location
│   ├── models/                 # User, Category, Expense, Report
│   ├── routes/
│   ├── services/               # mlService, reportService
│   ├── utils/
│   └── index.js
├── package.json                # Root scripts and dev orchestration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js **18 or 20 LTS** (the native TensorFlow.js package may not have prebuilt binaries for every newer Node release)
- npm 9+
- MongoDB 6+ locally, or a MongoDB Atlas connection string

### Installation

```bash
git clone https://github.com/Atul2512anand/AI-FINANCE.git
cd AI-FINANCE
npm run install-all
```

`install-all` installs the root, server, and client dependencies.

### Environment Variables

Create a `.env` file in the project root (the directory from which `npm run dev` starts the server):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/expense-tracker
JWT_SECRET=replace-with-a-long-random-string
JWT_EXPIRE=30d

# Optional: override the directory used for saved ML models
# ML_MODEL_PATH=./server/ml/models
```

`JWT_SECRET` is required for signing and verifying tokens. Do not commit the real `.env` file.

### Run Locally

```bash
npm run dev
```

- Client: http://localhost:3000
- API: http://localhost:5000

The client uses a Create React App proxy to `http://localhost:5000`, so `/api/...` requests are forwarded automatically.

### Production Build

```bash
npm run build
# Linux/macOS
NODE_ENV=production npm start
# Windows PowerShell
$env:NODE_ENV="production"; npm start
```

In production mode Express serves the compiled client from `client/build`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Run the API and React client together |
| `npm run server` | Run only the API with nodemon |
| `npm run client` | Run only the React client |
| `npm run build` | Build the React client |
| `npm start` | Start the API (`node server/index.js`) |
| `npm run install-all` | Install root, server, and client dependencies |

## API Reference

All protected routes require:

```http
Authorization: Bearer <jwt-token>
```

### Authentication — `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create a user and return a JWT |
| POST | `/login` | Public | Authenticate and return a JWT |
| GET | `/me` | Private | Get the current user |
| PUT | `/updateprofile` | Private | Update name, email, currency, or monthly budget |
| PUT | `/updatepassword` | Private | Change the password |

### Expenses — `/api/expenses`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Aggregate expense statistics |
| GET | `/` | List the user's expenses (supports filtering and pagination) |
| POST | `/` | Create an expense; predicts a category if none is supplied |
| GET | `/:id` | Get one expense |
| PUT | `/:id` | Update an expense |
| DELETE | `/:id` | Delete an expense |

### Categories — `/api/categories`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/stats` | Category-level statistics |
| GET | `/` | List categories |
| POST | `/` | Create a category |
| GET | `/:id` | Get one category |
| PUT | `/:id` | Update a category |
| DELETE | `/:id` | Delete a category |

### Reports — `/api/reports`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/advice` | Rule-based spending advice |
| GET | `/yearly/:year` | Yearly summary |
| GET | `/monthly/:month/:year` | Monthly report |
| POST | `/generate/:month/:year` | Generate or regenerate a monthly report |
| GET | `/` | List saved reports |
| GET | `/:id` | Get one report |

### Users — `/api/users`

`GET /api/users/admin` is a protected placeholder that demonstrates role-based access for `admin` users.

## Machine-Learning Notes

- The model is a small dense neural network trained on tokenised expense descriptions plus a normalised amount.
- Models are stored per user under `server/ml/models/user_<id>/` by default.
- The similarity fallback uses Jaccard similarity (70%) and amount similarity (30%), with a minimum score of `0.3`.
- The returned `confidence` is a model probability or similarity score, not a calibrated accuracy figure.
- ML state is held in module-level variables. Loading a model for one user can replace the in-memory model used by another request; this is acceptable for a single-user demo but should be isolated per request or per user in production.

## Known Limitations

- No automated tests are committed even though Jest and Supertest are listed.
- Model training is not connected to an API endpoint or scheduled job.
- No email verification, password-reset flow, or refresh-token rotation.
- Spending advice and report insights are rule-based, not generative AI.
- CORS is open and JWT configuration is development-oriented; harden both before production deployment.
- Reports are calculated from MongoDB data but have no PDF/CSV export.
- The app depends on a separately running MongoDB instance.

## License

The package metadata declares **MIT**. A standalone `LICENSE` file is not currently included; add one before redistributing the project.

## Author

**Atul Anand**  
B.Tech–M.Tech (Cyber Security), National Forensic Sciences University  
GitHub: [@Atul2512anand](https://github.com/Atul2512anand)
