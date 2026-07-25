import 'dotenv/config';
import http from 'http';
import connectDB from './config/db.js';
import app from './app.js';
import StockService from './services/StockService.js';
import SocketService from './services/SocketService.js';
import CronService from './services/cronService.js';
import emailService from './services/emailService.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Establish Database Connection
  await connectDB();

  // 2. Seed Mock Securities if empty
  await StockService.seedInitialStocks();

  // 3. Boot Brownian Price Updates Interval
  StockService.startSimulationTicks();

  // 4. Create HTTP Server to attach WebSockets
  const server = http.createServer(app);

  // 5. Initialize Socket.io listener
  SocketService.init(server);

  // 6. Start scheduled cron jobs
  CronService.start();

  // 7. Start listening
  server.listen(PORT, () => {
    console.log(`Stock desk simulation backend running in ${process.env.NODE_ENV || 'development'} mode on Port ${PORT}`);
    console.log('✓ Learning routes registered on /api/learning');
    console.log('✓ Course lookup by slug enabled');
  });
};

startServer();
