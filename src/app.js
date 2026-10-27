// app.js builds the Express app but does NOT start listening.
// Keeping app and server separate lets tests import the app directly.
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');
const mongoose = require('mongoose');

const env = require('./config/env');
const logger = require('./config/logger');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middlewares/error.middleware');

const app = express();

// Behind a load balancer / reverse proxy (Render, Heroku, Nginx), this makes
// req.ip and secure cookies work correctly.
if (env.isProduction) app.set('trust proxy', 1);

// ---- Middleware pipeline: runs top to bottom for every request ----
app.use(helmet()); // secure HTTP headers
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(','), // which frontends may call this API
    credentials: true, // allow cookies to be sent cross-origin
  }),
);
app.use(express.json({ limit: '10kb' })); // parse JSON bodies, reject huge payloads
app.use(cookieParser());
// Log every request: method, url, status code and response time.
app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({ id: req.id, method: req.method, url: req.url }),
      res: (res) => ({ statusCode: res.statusCode }),
    },
  }),
);

// ---- Routes ----
// Health check for load balancers, Docker and uptime monitors.
app.get('/health', (_req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({ status: dbUp ? 'ok' : 'degraded', uptime: process.uptime() });
});

app.use('/api/v1', routes); // versioned API: /api/v2 can live alongside later

// ---- Errors: must be registered LAST ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;
