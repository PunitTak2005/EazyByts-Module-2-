import mongoose from 'mongoose';

// Disable command buffering globally so queries fail fast if DB is unavailable
mongoose.set('bufferCommands', false);

const parseUriDiagnostics = (rawInput = '') => {
  try {
    const trimmed = rawInput.trim().replace(/^['"]|['"]$/g, ''); // Strip quotes or whitespace
    const hasProtocol = trimmed.startsWith('mongodb+srv://') || trimmed.startsWith('mongodb://');
    
    if (!hasProtocol) {
      return {
        host: 'Invalid Protocol',
        dbName: '(EMPTY)',
        rawDbName: '',
        authSource: 'default',
        hasUser: false,
        hasPass: false,
        isMalformed: true,
        protocolValid: false,
        trimmedUri: trimmed,
        reason: 'URI must start with mongodb:// or mongodb+srv://'
      };
    }

    const protocol = trimmed.startsWith('mongodb+srv://') ? 'mongodb+srv://' : 'mongodb://';
    const rest = trimmed.slice(protocol.length);

    // Separate host/creds from path/query string
    const matchSlashOrQuery = rest.search(/[\/?]/);
    const hostAndCredsEnd = matchSlashOrQuery === -1 ? rest.length : matchSlashOrQuery;
    const hostAndCreds = rest.slice(0, hostAndCredsEnd);
    const pathAndQuery = rest.slice(hostAndCredsEnd);

    const lastAtIndex = hostAndCreds.lastIndexOf('@');
    let user = '';
    let pass = '';
    let host = '';

    if (lastAtIndex !== -1) {
      const creds = hostAndCreds.slice(0, lastAtIndex);
      host = hostAndCreds.slice(lastAtIndex + 1);
      const firstColonIndex = creds.indexOf(':');
      if (firstColonIndex !== -1) {
        user = creds.slice(0, firstColonIndex);
        pass = creds.slice(firstColonIndex + 1);
      } else {
        user = creds;
      }
    } else {
      host = hostAndCreds;
    }

    let rawDbName = '';
    let queryStr = '';

    if (pathAndQuery.startsWith('/')) {
      const qIndex = pathAndQuery.indexOf('?');
      if (qIndex !== -1) {
        rawDbName = pathAndQuery.slice(1, qIndex);
        queryStr = pathAndQuery.slice(qIndex + 1);
      } else {
        rawDbName = pathAndQuery.slice(1);
      }
    } else if (pathAndQuery.startsWith('?')) {
      queryStr = pathAndQuery.slice(1);
    }

    const searchParams = new URLSearchParams(queryStr);
    const authSource = searchParams.get('authSource') || 'admin';

    return {
      host: host ? host.trim() : 'Missing Host',
      dbName: rawDbName.trim() || '(EMPTY)',
      rawDbName: rawDbName.trim(),
      authSource,
      hasUser: Boolean(user && user.trim()),
      hasPass: Boolean(pass && pass.trim()),
      isMalformed: !host || !user || !pass,
      protocolValid: true,
      trimmedUri: trimmed
    };
  } catch (err) {
    return {
      host: 'Unparseable',
      dbName: '(EMPTY)',
      rawDbName: '',
      authSource: 'default',
      hasUser: false,
      hasPass: false,
      isMalformed: true,
      protocolValid: false,
      reason: err.message
    };
  }
};

const connectDB = async () => {
  const uriStr = process.env.MONGODB_URI;

  console.log('[MongoDB Diagnostic] MONGODB_URI exists:', Boolean(uriStr));
  if (uriStr) {
    console.log(`[MongoDB Diagnostic] MONGODB_URI length: ${uriStr.length} chars`);
  }

  if (!uriStr) {
    console.error('❌ ERROR: process.env.MONGODB_URI environment variable is missing.');
    console.error('❌ Please set MONGODB_URI in Render Environment Variables.');
    console.warn('[MongoDB Diagnostic] Initial readyState:', mongoose.connection.readyState);
    return false;
  }

  const nodeEnv = process.env.NODE_ENV || 'development';
  const diag = parseUriDiagnostics(uriStr);

  console.log(`[MongoDB Diagnostic] Protocol valid: ${diag.protocolValid}`);
  console.log(`[MongoDB Diagnostic] Host extracted: ${diag.host}`);
  console.log(`[MongoDB Diagnostic] Database extracted: ${diag.dbName}`);
  console.log(`[MongoDB Diagnostic] Username detected: ${diag.hasUser}`);
  console.log(`[MongoDB Diagnostic] Password detected: ${diag.hasPass}`);
  console.log(`[MongoDB Diagnostic] AuthSource: ${diag.authSource}`);
  console.log(`[MongoDB Diagnostic] NODE_ENV: ${nodeEnv}`);
  console.log(`[MongoDB Diagnostic] Initial readyState: ${mongoose.connection.readyState}`);

  if (!diag.protocolValid) {
    console.error(`❌ ERROR: MONGODB_URI protocol is invalid (${diag.reason}).`);
    return false;
  }

  if (!diag.hasUser) {
    console.error('❌ ERROR: Username is missing from MONGODB_URI.');
    return false;
  }

  if (!diag.hasPass) {
    console.error('❌ ERROR: Password is missing from MONGODB_URI.');
    return false;
  }

  if (diag.host === 'Missing Host' || !diag.host) {
    console.error('❌ ERROR: Hostname is missing from MONGODB_URI.');
    return false;
  }

  if (!diag.rawDbName) {
    console.error('❌ ERROR: Database name missing from MONGODB_URI.');
    console.error('❌ Example valid connection URI: mongodb+srv://username:password@cluster0.f62wrct.mongodb.net/stock-simulator?retryWrites=true&w=majority&appName=Cluster0');
    console.error('❌ Please update MONGODB_URI in Render Environment Variables to include the target database name (e.g. /stock-simulator).');
    return false;
  }

  try {
    const conn = await mongoose.connect(diag.trimmedUri, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });
    console.log(`✓ MongoDB Connected Successfully to Host: ${conn.connection.host} [Database: ${conn.connection.name}]`);
    console.log(`✓ MongoDB ReadyState: ${mongoose.connection.readyState}`);
    return true;
  } catch (error) {
    console.error(`❌ [MongoDB Diagnostic Error] Connection failed: ${error.message}`);
    console.error(`❌ [MongoDB Diagnostic Status] readyState: ${mongoose.connection.readyState}`);
    if (error.message.includes('bad auth')) {
      console.error('❌ [MongoDB Diagnostic Hint] Atlas authentication failed. Ensure username & password in MONGODB_URI are correct, database name is included, and special characters (@, #, %) are URL-encoded.');
    }
    return false;
  }
};

export default connectDB;
