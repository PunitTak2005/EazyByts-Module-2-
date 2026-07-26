import 'dotenv/config';
import http from 'http';
import connectDB from './config/db.js';
import app from './app.js';
import StockService from './services/StockService.js';
import SocketService from './services/SocketService.js';
import CronService from './services/cronService.js';

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
  // 1. Establish MongoDB Connection BEFORE listening to eliminate startup race conditions
  console.log('[Server Startup] Attempting MongoDB connection...');
  const dbConnected = await connectDB();

  // 2. Strict Requirement: Exit immediately if MONGODB_URI is missing or connection fails
  if (!dbConnected) {
    console.error('❌ [Fatal Startup Error] MongoDB connection failed or process.env.MONGODB_URI is missing.');
    console.error('❌ Stopping server startup. Do NOT start Express server, Socket.io, or Cron jobs.');
    console.error('❌ Please configure MONGODB_URI in Render Environment Variables.');
    process.exit(1);
  }

  // 3. Create HTTP Server & Bind WebSockets only after DB connects
  const server = http.createServer(app);
  SocketService.init(server);

  // 4. Start Listening on PORT after connection completes
  server.listen(PORT, async () => {
    console.log(`✓ Stock desk simulation backend running in ${NODE_ENV} mode on Port ${PORT}`);

    try {
      await StockService.seedInitialStocks();
    } catch (err) {
      console.warn('[Server Startup Warning] Stock seeding skipped or failed:', err.message);
    }

    console.log('✓ Starting database-dependent background services (Stock ticks & Cron jobs)...');
    StockService.startSimulationTicks();
    CronService.start();
  });
};

startServer().catch((err) => {
  console.error('[Fatal Error] Server startup failed:', err);
  process.exit(1);
});
