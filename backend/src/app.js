const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();

// Trust reverse proxy for rate limiting (e.g. Render, Vercel, Heroku)
app.set('trust proxy', 1);

// CORS — restrict to known frontend origins only
const allowedOrigins = [
  process.env.FRONTEND_URL,
  `http://${process.env.FRONTEND_HOST || 'localhost'}:5173`,
  `http://${process.env.FRONTEND_HOST || 'localhost'}:5174`,
  `http://localhost:5173`,
  `http://localhost:5174`,
  `http://127.0.0.1:5173`,
  `http://127.0.0.1:5174`,
  `http://localhost`,
  `http://127.0.0.1`,
].filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin or from allowed origins
    if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:') || origin.startsWith('http://172.') || origin.startsWith('http://192.') || (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL)) {
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
