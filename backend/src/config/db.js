import mongoose from 'mongoose';

// Disable command buffering globally so queries fail fast if DB is unavailable
mongoose.set('bufferCommands', false);

const parseUriDiagnostics = (uri) => {
  try {
    const sanitized = uri.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://');
    const parsed = new URL(sanitized);
    const host = parsed.host || 'Unknown Host';
    const dbName = parsed.pathname ? parsed.pathname.replace(/^\//, '') : 'default';
    const authSource = parsed.searchParams.get('authSource') || 'admin/default';
    const hasUser = Boolean(parsed.username);
    const hasPass = Boolean(parsed.password);

    return { host, dbName, authSource, hasUser, hasPass, isMalformed: false };
  } catch (err) {
    return { host: 'Unparseable', dbName: 'Unknown', authSource: 'Unknown', hasUser: false, hasPass: false, isMalformed: true };
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.warn('[MongoDB Diagnostic] Neither MONGODB_URI nor MONGO_URI environment variable is defined. Database connection skipped.');
    return false;
  }

  const diag = parseUriDiagnostics(uri);
  console.log(`[MongoDB Diagnostic] Target Host: ${diag.host} | Database: ${diag.dbName} | AuthSource: ${diag.authSource} | User Provided: ${diag.hasUser} | Pass Provided: ${diag.hasPass}`);

  if (diag.isMalformed) {
    console.error('❌ [MongoDB Diagnostic Error] URI appears malformed. Verify MONGODB_URI formatting.');
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log(`✓ MongoDB Connected Successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB Diagnostic Error] Connection failed: ${error.message}`);
    if (error.message.includes('bad auth')) {
      console.error('❌ [MongoDB Diagnostic Hint] Atlas authentication failed. Ensure username & password in MONGODB_URI are correct and special characters (@, #, %) are URL-encoded.');
    }
    return false;
  }
};

export default connectDB;
