/**
 * Vercel Serverless Function entry point
 * 
 * Wraps the Express app for Vercel's serverless runtime.
 * - REST API routes: fully supported
 * - Socket.io real-time: not supported in serverless (stateless)
 * - Cron / stock simulation ticks: not supported (no persistent process)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../backend/src/config/db.js';
import app from '../backend/src/app.js';

// Re-use DB connection across warm invocations (connection pooling)
let isConnected = false;

const handler = async (req, res) => {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
};

export default handler;
