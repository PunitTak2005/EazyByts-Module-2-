import http from 'http';

// Load dotenv conditionally for local development only so it never interferes with production container environment variables
if (process.env.NODE_ENV !== 'production') {
  const dotenv = await import('dotenv');
  dotenv.config();
}

import connectDB from './config/db.js';
import app from './app.js';
import StockService from './services/StockService.js';
import SocketService from './services/SocketService.js';
import CronService from './services/cronService.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  console.log('[Server Startup] Starting initialization sequence...');

  // 1. Establish & Validate MongoDB Connection BEFORE creating Express server, Socket.io, or Cron jobs
  console.log('[Server Startup] 1. Connecting to MongoDB...');
  await connectDB();

  // 2. Create HTTP Server for Express app only after successful DB connection
  console.log('[Server Startup] 2. Creating HTTP Server...');
  const server = http.createServer(app);
  server.timeout = 30000;
  server.keepAliveTimeout = 35000;

  // 3. Initialize Socket.io WebSockets
  console.log('[Server Startup] 3. Initializing Socket.io...');
  SocketService.init(server);

  // 4. Seed initial stock data and start background services
  console.log('[Server Startup] 4. Seeding initial stock data...');
  try {
    await StockService.seedInitialStocks();
  } catch (err) {
    console.warn('[Server Startup Warning] Stock seeding skipped or failed:', err.message);
  }

  console.log('[Server Startup] 5. Starting background simulation ticks & cron jobs...');
  StockService.startSimulationTicks();
  CronService.start();

  // 5. Start listening on process.env.PORT
  server.listen(PORT, () => {
    console.log(`✓ Stock desk simulation backend running in ${NODE_ENV} mode on Port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('❌ [Fatal Startup Error] Backend startup failed:', err.message);
  process.exit(1);
});
