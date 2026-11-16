import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { db } from './db/store.js';

export const app = express();

// Security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      const allowed = [config.webOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'];
      if (allowed.includes(origin) || origin.endsWith('.viberhub.local')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in development
    },
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Liveness and readiness endpoints
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'viberhub-api', timestamp: new Date().toISOString() });
});

app.get('/readyz', (req, res) => {
  const isHealthy = db && db.data && db.data.users.size > 0;
  if (isHealthy) {
    return res.status(200).json({ status: 'ready', database: 'connected', timestamp: new Date().toISOString() });
  }
  return res.status(503).json({ status: 'not_ready', error: 'Database uninitialized' });
});

// REST API Base route
app.use('/api/v1', apiRouter);

// 404 Handler for unmatched API routes
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The endpoint ${req.method} ${req.path} does not exist.`
    }
  });
});

// Centralized error handler
app.use(errorHandler);
