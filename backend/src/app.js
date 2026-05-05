const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// CORS — restrict to known frontend origins only
const allowedOrigins = [
  `http://172.16.28.96:5173`,
  `http://localhost:5173`,
  `http://127.0.0.1:5173`,
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., Postman, curl, mobile apps)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin ${origin} is not allowed.`));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));
app.use('/api', routes);

// Global Error Handler
app.use(errorHandler);

module.exports = app;
