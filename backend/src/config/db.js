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
  const nodeEnv = process.env.NODE_ENV || 'development';
  const uriStr = process.env.MONGODB_URI;
  const mongoKeys = Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('DB'));

  console.log(`[MongoDB Startup Diagnostic] NODE_ENV: ${nodeEnv}`);
  console.log(`[MongoDB Startup Diagnostic] MONGODB_URI exists: ${Boolean(uriStr)}`);
  console.log(`[MongoDB Startup Diagnostic] Environment keys found:`, mongoKeys.length ? mongoKeys : '(None found)');

  if (!uriStr) {
    console.error('❌ FATAL ERROR: process.env.MONGODB_URI environment variable is missing.');
    console.error(`❌ Current NODE_ENV: ${nodeEnv}`);
    console.error(`❌ Current working directory: ${process.cwd()}`);
    console.error(`❌ Mongo-related environment keys in process.env:`, mongoKeys.length ? mongoKeys : '(None found)');
    console.error('❌ Please set MONGODB_URI in Render Environment Variables.');
    throw new Error('Missing MONGODB_URI environment variable.');
  }

  console.log(`[MongoDB Startup Diagnostic] MONGODB_URI length: ${uriStr.length} chars`);

  const diag = parseUriDiagnostics(uriStr);

  console.log(`[MongoDB Startup Diagnostic] Protocol valid: ${diag.protocolValid}`);
  console.log(`[MongoDB Startup Diagnostic] Host extracted: ${diag.host}`);
  console.log(`[MongoDB Startup Diagnostic] Database extracted: ${diag.dbName}`);
  console.log(`[MongoDB Startup Diagnostic] Username detected: ${diag.hasUser}`);
  console.log(`[MongoDB Startup Diagnostic] Password detected: ${diag.hasPass}`);
  console.log(`[MongoDB Startup Diagnostic] AuthSource: ${diag.authSource}`);
  console.log(`[MongoDB Startup Diagnostic] Initial readyState: ${mongoose.connection.readyState}`);

  if (!diag.protocolValid) {
    throw new Error(`Invalid MONGODB_URI protocol: ${diag.reason}`);
  }

  if (!diag.hasUser) {
    throw new Error('Username missing from MONGODB_URI.');
  }

  if (!diag.hasPass) {
    throw new Error('Password missing from MONGODB_URI.');
  }

  if (diag.host === 'Missing Host' || !diag.host) {
    throw new Error('Hostname missing from MONGODB_URI.');
  }

  if (!diag.rawDbName) {
    console.error('❌ Example valid connection URI: mongodb+srv://username:password@cluster0.f62wrct.mongodb.net/stock-simulator?retryWrites=true&w=majority&appName=Cluster0');
    throw new Error('Database name missing from MONGODB_URI (e.g. /stock-simulator).');
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
    console.error(`❌ [MongoDB Connection Failure] ${error.message}`);
    throw new Error(`MongoDB Connection Failed: ${error.message}`);
  }
};

export default connectDB;
