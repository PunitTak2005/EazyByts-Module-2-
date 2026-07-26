import mongoose from 'mongoose';

// Disable command buffering globally so queries fail fast if DB is unavailable
mongoose.set('bufferCommands', false);

const parseUriDiagnostics = (uriStr = '') => {
  try {
    // Regex parsing for mongodb / mongodb+srv URIs to reliably extract host & database name
    const match = uriStr.match(/^mongodb(?:\+srv)?:\/\/(?:([^:]+):([^@]+)@)?([^/]+)(?:\/([^?]*))?(?:\?(.*))?$/);
    if (!match) {
      return { host: 'Malformed URI', dbName: '(EMPTY)', rawDbName: '', authSource: 'default', hasUser: false, hasPass: false, isMalformed: true };
    }

    const [, user, pass, host, rawDbName = '', queryStr = ''] = match;
    const searchParams = new URLSearchParams(queryStr);
    const authSource = searchParams.get('authSource') || 'admin';
    const dbName = rawDbName ? rawDbName.trim() : '(EMPTY)';

    return {
      host,
      dbName,
      rawDbName: rawDbName.trim(),
      authSource,
      hasUser: Boolean(user),
      hasPass: Boolean(pass),
      isMalformed: false
    };
  } catch (err) {
    return { host: 'Unparseable', dbName: '(EMPTY)', rawDbName: '', authSource: 'default', hasUser: false, hasPass: false, isMalformed: true };
  }
};

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ ERROR: MONGODB_URI environment variable is not defined.');
    console.warn('[MongoDB Diagnostic] Please set MONGODB_URI in Render Environment Variables.');
    return false;
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const diag = parseUriDiagnostics(uri);

  console.log(`[MongoDB Diagnostic] Host: ${diag.host}`);
  console.log(`[MongoDB Diagnostic] Database: ${diag.dbName}`);
  console.log(`[MongoDB Diagnostic] User Provided: ${diag.hasUser}`);
  console.log(`[MongoDB Diagnostic] Pass Provided: ${diag.hasPass}`);
  console.log(`[MongoDB Diagnostic] AuthSource: ${diag.authSource}`);
  console.log(`[MongoDB Diagnostic] NODE_ENV: ${nodeEnv}`);

  if (diag.isMalformed) {
    console.error('❌ ERROR: MONGODB_URI connection string is malformed.');
    return false;
  }

  // Strict Validation: Stop startup if database name is missing from URI
  if (!diag.rawDbName) {
    console.error('❌ ERROR: Database name missing from MONGODB_URI.');
    console.error('❌ Example valid connection URI: mongodb+srv://username:password@cluster0.f62wrct.mongodb.net/stock_simulator?retryWrites=true&w=majority');
    console.error('❌ Please update MONGODB_URI in Render Environment Variables to include the target database name (e.g. /stock_simulator).');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log(`✓ MongoDB Connected Successfully to Host: ${conn.connection.host} [Database: ${conn.connection.name}]`);
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
