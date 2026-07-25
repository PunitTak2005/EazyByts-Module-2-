/**
 * Vercel Serverless Entry Point for the backend service.
 *
 * The `services` format in vercel.json deploys this as a serverless
 * function. It lazily connects to MongoDB on first invocation and
 * reuses the connection on subsequent warm starts.
 *
 * NOTE: Socket.io real-time and cron jobs are not available in
 * Vercel's serverless runtime. All REST API routes work normally.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './src/config/db.js';
import app from './src/app.js';

let isConnected = false;

export default async function handler(req, res) {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    await connectDB();
    isConnected = true;
  }
  return app(req, res);
}
