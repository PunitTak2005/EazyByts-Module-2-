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

// Static Files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

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

// API routes definition
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/stocks/ticker', stockTickerRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/widgets', widgetRoutes);
app.use('/api/charts', chartRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/insights', marketInsightsRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/watchlists', watchlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/news', newsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Fallbacks
app.use(notFound);
app.use(errorHandler);

export default app;
