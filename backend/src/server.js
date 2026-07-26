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
  // 1. Create HTTP Server & Bind WebSockets
  const server = http.createServer(app);
  SocketService.init(server);

  // 2. Start Listening on PORT first so Render port detection succeeds
  server.listen(PORT, async () => {
    console.log(`✓ Stock desk simulation backend running in ${NODE_ENV} mode on Port ${PORT}`);
    console.log('✓ Learning routes registered on /api/learning');

    // 3. Connect to MongoDB gracefully
    console.log('[Server Startup] Attempting MongoDB connection...');
    const dbConnected = await connectDB();

    if (dbConnected) {
      try {
        await StockService.seedInitialStocks();
      } catch (err) {
        console.warn('[Server Startup Warning] Stock seeding skipped or failed:', err.message);
      }

      console.log('✓ Starting database-dependent services (Stock ticks & Cron jobs)...');
      StockService.startSimulationTicks();
      CronService.start();
    } else {
      console.warn('⚠️ [Server Startup Warning] Running in degraded mode (Database disconnected). Background jobs & stock simulation ticks disabled. REST health endpoints operational.');
    }
  });
};

startServer().catch((err) => {
  console.error('[Fatal Error] Server startup failed:', err);
  process.exit(1);
});
