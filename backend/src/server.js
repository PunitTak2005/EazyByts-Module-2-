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

  if (!dbConnected && NODE_ENV === 'production') {
    console.error('❌ [Fatal Startup Error] MongoDB failed to connect in production mode.');
    console.error('❌ Stopping server startup. Please fix MONGODB_URI in Render Environment Variables.');
    process.exit(1);
  }

  // 2. Create HTTP Server & Bind WebSockets
  const server = http.createServer(app);
  SocketService.init(server);

  // 3. Start Listening on PORT after connection attempt completes
  server.listen(PORT, async () => {
    console.log(`✓ Stock desk simulation backend running in ${NODE_ENV} mode on Port ${PORT}`);

    if (dbConnected) {
      try {
        await StockService.seedInitialStocks();
      } catch (err) {
        console.warn('[Server Startup Warning] Stock seeding skipped or failed:', err.message);
      }

      console.log('✓ Starting database-dependent background services (Stock ticks & Cron jobs)...');
      StockService.startSimulationTicks();
      CronService.start();
    } else {
      console.warn('⚠️ [Server Startup Warning] Running in degraded mode (Database disconnected). REST routes requiring database access will return HTTP 503.');
    }
  });
};

startServer().catch((err) => {
  console.error('[Fatal Error] Server startup failed:', err);
  process.exit(1);
});
