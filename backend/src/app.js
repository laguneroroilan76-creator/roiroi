const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// CORS — restrict to known frontend origins only
const allowedOrigins = [
  `http://${process.env.FRONTEND_HOST || 'localhost'}:5173`,
  `http://${process.env.FRONTEND_HOST || 'localhost'}:5174`,
  `http://localhost:5173`,
  `http://localhost:5174`,
  `http://127.0.0.1:5173`,
  `http://127.0.0.1:5174`,
  `http://localhost`,
  `http://127.0.0.1`,
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin or from common dev origins
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || origin.startsWith('http://172.') || origin.startsWith('http://192.')) {
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
