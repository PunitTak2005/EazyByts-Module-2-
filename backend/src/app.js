import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoose from 'mongoose';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Routes imports
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import stockTickerRoutes from './routes/stockTickerRoutes.js';
import stockRoutes from './routes/stockRoutes.js';
import marketRoutes from './routes/marketRoutes.js';
import widgetRoutes from './routes/widgetRoutes.js';
import chartRoutes from './routes/chartRoutes.js';
import portfolioRoutes from './routes/portfolioRoutes.js';
import watchlistRoutes from './routes/watchlistRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import marketInsightsRoutes from './routes/marketInsightsRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import newsRoutes from './routes/newsRoutes.js';

import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();

// Logging requests
app.use(morgan('dev'));

// Standard Security headers (allow cross-origin for static images)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

import { corsOptions } from './config/cors.js';

app.use(cors(corsOptions));

import path from 'path';
import { fileURLToPath } from 'url';

// Body Parsers & Cookie processing
app.use(express.json());
app.use(cookieParser());



// Anti-parameter pollution & injection checks
app.use(hpp());
app.use(mongoSanitize());
app.use(xss());

// Compress response bodies
app.use(compression());

// General rate limiter per window
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 300, // Limit each IP to 300 requests
  message: {
    success: false,
    message: 'Too many requests from this address. Try again later.',
  },
});
app.use('/api', generalLimiter);

// API routes definition - mounted on both /api/* and /* to handle all Vercel service rewrite paths
const apiRoutes = [
  ['/auth', authRoutes],
  ['/users', userRoutes],
  ['/user', userRoutes],
  ['/stocks/ticker', stockTickerRoutes],
  ['/stocks', stockRoutes],
  ['/market', marketRoutes],
  ['/widgets', widgetRoutes],
  ['/charts', chartRoutes],
  ['/portfolio', portfolioRoutes],
  ['/trades', tradeRoutes],
  ['/insights', marketInsightsRoutes],
  ['/alerts', alertRoutes],
  ['/watchlists', watchlistRoutes],
  ['/analytics', analyticsRoutes],
  ['/dashboard', dashboardRoutes],
  ['/notifications', notificationRoutes],
  ['/admin', adminRoutes],
  ['/learning', learningRoutes],
  ['/news', newsRoutes],
];

apiRoutes.forEach(([path, router]) => {
  app.use(`/api${path}`, router);
  app.use(path, router);
});

// Root landing endpoint
app.get('/', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    success: true,
    message: 'EazyByts Backend API is running successfully.',
    version: '1.0.0',
    status: 'healthy',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get(['/api/health', '/health'], (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const dbConnected = mongoose.connection.readyState === 1;
  res.json({
    success: true,
    status: dbConnected ? 'healthy' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    socket: process.env.VERCEL ? false : true,
    uptime: `${Math.floor(process.uptime())}s`,
    timestamp: new Date().toISOString()
  });
});


// Fallbacks
app.use(notFound);
app.use(errorHandler);

export default app;
