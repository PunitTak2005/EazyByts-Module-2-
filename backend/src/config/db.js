import mongoose from 'mongoose';

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.warn('[MongoDB Diagnostic] Neither MONGODB_URI nor MONGO_URI environment variable is defined. Database connection skipped.');
    return false;
  }

  console.log('✓ MongoDB connection string detected');

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✓ MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB Diagnostic Error] Database connection failed: ${error.message}`);
    if (error.message.includes('bad auth')) {
      console.error('[MongoDB Diagnostic Hint] Atlas authentication failed. Ensure username & password in MONGODB_URI are correct and special characters (@, #, %) are URL-encoded.');
    }
    return false;
  }
};

export default connectDB;
