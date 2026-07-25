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
  try {
    if (!isConnected || mongoose.connection.readyState !== 1) {
      await connectDB();
      isConnected = true;
    }
  } catch (err) {
    console.error('Database connection failed in serverless function:', err);
    return res.status(500).json({
      success: false,
      message: 'Serverless Function Error: Database connection failed. Please ensure MONGO_URI environment variable is configured in Vercel.',
      error: err.message
    });
  }
  return app(req, res);
}
