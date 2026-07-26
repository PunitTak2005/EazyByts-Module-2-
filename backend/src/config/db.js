import mongoose from 'mongoose';

// Disable command buffering globally so queries fail fast if DB is unavailable
mongoose.set('bufferCommands', false);

const parseUriDiagnostics = (uriStr) => {
  try {
    const sanitized = uriStr.replace('mongodb+srv://', 'http://').replace('mongodb://', 'http://');
    const parsed = new URL(sanitized);
    const host = parsed.host || 'Unknown Host';
    const rawDbName = parsed.pathname ? parsed.pathname.replace(/^\//, '') : '';
    const dbName = rawDbName || '(EMPTY)';
    const authSource = parsed.searchParams.get('authSource') || 'admin/default';
    const hasUser = Boolean(parsed.username);
    const hasPass = Boolean(parsed.password);

    return { host, dbName, rawDbName, authSource, hasUser, hasPass, isMalformed: false };
  } catch (err) {
    return { host: 'Unparseable', dbName: 'Unknown', rawDbName: '', authSource: 'Unknown', hasUser: false, hasPass: false, isMalformed: true };
  }
};

const connectDB = async () => {
  let uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.warn('[MongoDB Diagnostic] Neither MONGODB_URI nor MONGO_URI environment variable is defined. Database connection skipped.');
    return false;
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  let diag = parseUriDiagnostics(uri);

  console.log(`[MongoDB Diagnostic] Host: ${diag.host} | Database: ${diag.dbName} | User Provided: ${diag.hasUser} | Pass Provided: ${diag.hasPass} | AuthSource: ${diag.authSource} | NODE_ENV: ${nodeEnv}`);

  // Detect missing database name in connection URI (e.g. cluster.mongodb.net/?appName=Cluster0)
  if (!diag.rawDbName) {
    console.error('❌ ERROR: Database name missing from MONGODB_URI. (e.g. cluster.mongodb.net/stock_simulator)');
    console.warn('[MongoDB Auto-Fix] Appending default database path /stock_simulator to connection string...');

    if (uri.includes('?')) {
      uri = uri.replace('?', '/stock_simulator?');
    } else {
      uri = uri.replace(/\/$/, '') + '/stock_simulator';
    }
    diag = parseUriDiagnostics(uri);
    console.log(`[MongoDB Diagnostic Updated] Host: ${diag.host} | Database: ${diag.dbName}`);
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log(`✓ MongoDB Connected Successfully: ${conn.connection.host} [DB: ${conn.connection.name}]`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB Diagnostic Error] Connection failed: ${error.message}`);
    if (error.message.includes('bad auth')) {
      console.error('❌ [MongoDB Diagnostic Hint] Atlas authentication failed. Ensure username & password in MONGODB_URI are correct, database name is included, and special characters (@, #, %) are URL-encoded.');
    }
    return false;
  }
};

export default connectDB;
