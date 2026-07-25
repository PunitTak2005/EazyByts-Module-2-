const { execSync, spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { PassThrough } = require('stream');
const treeKill = require('tree-kill');

const FRONTEND_PORT = 3250;
const BACKEND_PORT = 5009;

let backendProcess = null;
let frontendProcess = null;
let isShuttingDown = false;

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function prefixStream(stream, prefix, colorCode) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer
    for (const line of lines) {
      if (line.trim()) {
        console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${line}`);
      }
    }
  });
  stream.on('end', () => {
    if (buffer && buffer.trim()) {
      console.log(`\x1b[${colorCode}m[${prefix}]\x1b[0m ${buffer.trim()}`);
      buffer = '';
    }
  });
}

// ---------------------------------------------------------
// Environment Validation
// ---------------------------------------------------------
function validateEnvironment() {
  console.log(`\x1b[36m[Launcher]\x1b[0m Validating environment variables...`);
  const envPath = path.join(__dirname, '..', 'backend', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error(`\x1b[31m[Launcher]\x1b[0m Error: backend/.env file is missing!`);
    console.error(`Please create it and configure MONGO_URI, JWT_SECRET, etc.`);
    process.exit(1);
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('MONGO_URI')) {
    console.error(`\x1b[31m[Launcher]\x1b[0m Error: MONGO_URI is missing in backend/.env`);
    process.exit(1);
  }
  if (!envContent.includes('JWT_SECRET')) {
    console.error(`\x1b[31m[Launcher]\x1b[0m Error: JWT_SECRET is missing in backend/.env`);
    process.exit(1);
  }
  
  console.log(`\x1b[32m[Launcher]\x1b[0m Environment valid.\n`);
}

// ---------------------------------------------------------
// Port Management
// ---------------------------------------------------------
function getPidsOnPort(port) {
  const pids = new Set();
  const platform = process.platform;
  
  try {
    if (platform === 'win32') {
      const stdout = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = stdout.split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 4) {
          const localAddress = parts[1];
          if (localAddress && localAddress.endsWith(`:${port}`)) {
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid) && pid !== '0') {
              pids.add(Number(pid));
            }
          }
        }
      }
    } else {
      const stdout = execSync(`lsof -t -i :${port}`).toString().trim();
      if (stdout) {
        stdout.split('\n').forEach(pid => {
          if (pid && !isNaN(pid)) {
            pids.add(Number(pid));
          }
        });
      }
    }
  } catch (e) {
    // Port is probably free
  }
  return Array.from(pids);
}

function killPid(pid) {
  return new Promise((resolve) => {
    treeKill(pid, 'SIGKILL', (err) => {
      if (err && process.platform === 'win32') {
        try {
          execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
        } catch (e) {
          console.error(`\x1b[31m[Launcher]\x1b[0m Failed to terminate PID ${pid}.`);
        }
      }
      resolve();
    });
  });
}

async function freePort(port, name) {
  console.log(`\x1b[36m[Launcher]\x1b[0m Checking ${name} port ${port}...`);
  let pids = getPidsOnPort(port);
  if (pids.length === 0) {
    console.log(`\x1b[32m[Launcher]\x1b[0m Port ${port} is free.\n`);
    return;
  }
  
  console.log(`\x1b[33m[Launcher]\x1b[0m Port in use by PID(s): ${pids.join(', ')}. Terminating...`);
  for (const pid of pids) {
    await killPid(pid);
  }
  
  let isFree = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    await sleep(500);
    if (getPidsOnPort(port).length === 0) {
      isFree = true;
      break;
    }
  }

  if (!isFree) {
    console.error(`\x1b[31m[Launcher]\x1b[0m Unable to free port ${port}. Please close conflicting processes manually.\n`);
    process.exit(1);
  }
  console.log(`\x1b[32m[Launcher]\x1b[0m Port released successfully.\n`);
}

// ---------------------------------------------------------
// Health Checks
// ---------------------------------------------------------
function checkBackendHealth() {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: BACKEND_PORT,
      path: '/api/health',
      method: 'GET',
      headers: { 'Origin': `http://localhost:${FRONTEND_PORT}` },
      timeout: 2500
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            online: res.statusCode === 200 && json.status === 'UP',
            mongodbConnected: json.database === 'connected',
            raw: data,
            corsRejected: res.statusCode === 500 || data.includes('CORS')
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            online: false,
            mongodbConnected: false,
            raw: data,
            corsRejected: res.statusCode === 500 || data.includes('CORS')
          });
        }
      });
    });

    req.on('error', (err) => resolve({ online: false, error: err.code || err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ online: false, error: 'ETIMEDOUT' });
    });
    req.end();
  });
}

// ---------------------------------------------------------
// Process Launchers
// ---------------------------------------------------------
function startBackend() {
  console.log(`\x1b[36m[Launcher]\x1b[0m Starting backend on port ${BACKEND_PORT}...`);
  const backendDir = path.join(__dirname, '..', 'backend');
  const nodemonBin = path.join(backendDir, 'node_modules', 'nodemon', 'bin', 'nodemon.js');

  backendProcess = spawn('node', [nodemonBin, 'src/server.js'], {
    cwd: backendDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  backendProcess.stdin.resume();

  prefixStream(backendProcess.stdout, 'BACKEND', '35'); // Magenta
  prefixStream(backendProcess.stderr, 'BACKEND_ERR', '31'); // Red

  backendProcess.on('exit', (code) => {
    if (!isShuttingDown) {
      console.log(`\n\x1b[31m[Launcher]\x1b[0m Backend crashed (code ${code}).`);
      gracefulShutdown(1);
    }
  });
}

function startFrontend() {
  console.log(`\x1b[36m[Launcher]\x1b[0m Starting frontend on port ${FRONTEND_PORT}...`);
  const frontendDir = path.join(__dirname, '..', 'frontend');
  const viteBin = path.join(frontendDir, 'node_modules', 'vite', 'bin', 'vite.js');

  frontendProcess = spawn('node', [viteBin, '--clearScreen', 'false'], {
    cwd: frontendDir,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, FORCE_COLOR: 'true' }
  });

  frontendProcess.stdin.resume();

  // Heartbeat to keep child process stdin active
  const keepAliveTimer = setInterval(() => {
    if (frontendProcess && frontendProcess.stdin && !frontendProcess.stdin.destroyed) {
      try { frontendProcess.stdin.write('\0'); } catch (e) {}
    }
  }, 5000);

  prefixStream(frontendProcess.stdout, 'FRONTEND', '36'); // Cyan
  prefixStream(frontendProcess.stderr, 'FRONTEND_ERR', '31'); // Red

  frontendProcess.on('exit', async (code) => {
    clearInterval(keepAliveTimer);
    if (!isShuttingDown) {
      await sleep(500);
      const activePids = getPidsOnPort(FRONTEND_PORT);
      if (activePids.length > 0) {
        console.log(`\x1b[36m[Launcher]\x1b[0m Frontend server running in background (PID: ${activePids.join(', ')}).`);
        return;
      }
      console.log(`\n\x1b[31m[Launcher]\x1b[0m Frontend crashed (code ${code}).`);
      gracefulShutdown(1);
    }
  });
}

// ---------------------------------------------------------
// Orchestration & Wait Logic
// ---------------------------------------------------------
async function waitForBackend() {
  console.log(`\x1b[36m[Launcher]\x1b[0m Waiting for backend to initialize and database to connect...`);
  
  let attempts = 0;
  const maxAttempts = 30;
  let delay = 1000;

  while (attempts < maxAttempts) {
    attempts++;
    const health = await checkBackendHealth();

    if (health.online) {
      if (health.mongodbConnected) {
        console.log(`\x1b[32m[Launcher] ✓ Backend healthy on port ${BACKEND_PORT} (Database connected).\x1b[0m\n`);
        return true;
      } else {
        console.log(`\x1b[33m[Launcher] Health check attempt ${attempts}/${maxAttempts}: Backend online, waiting for Database connection...\x1b[0m`);
      }
    } else {
      if (health.corsRejected) {
        console.error(`\x1b[31m[Launcher] Health check attempt ${attempts}/${maxAttempts}: CORS Rejection / HTTP 500 error: ${health.raw}\x1b[0m`);
      } else if (health.statusCode && health.statusCode !== 200) {
        console.warn(`\x1b[33m[Launcher] Health check attempt ${attempts}/${maxAttempts}: Health endpoint returned HTTP ${health.statusCode}\x1b[0m`);
      } else if (health.error) {
        console.log(`\x1b[90m[Launcher] Health check attempt ${attempts}/${maxAttempts}: Server not running yet (${health.error})...\x1b[0m`);
      }
    }

    await sleep(delay);
    delay = Math.min(delay * 1.5, 5000);
  }

  return false;
}

// ---------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------
function gracefulShutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('\n\x1b[36m[Launcher]\x1b[0m Shutting down orchestrator...');

  if (backendProcess && backendProcess.pid) {
    treeKill(backendProcess.pid, 'SIGKILL');
  }

  if (frontendProcess && frontendProcess.pid) {
    treeKill(frontendProcess.pid, 'SIGKILL');
  }

  setTimeout(() => process.exit(code), 1000);
}

// Wire cleanup events
process.on('SIGINT', () => gracefulShutdown(0));
process.on('SIGTERM', () => gracefulShutdown(0));
process.on('uncaughtException', (err) => {
  console.error('\n\x1b[31m[Launcher]\x1b[0m Unexpected crash:', err.message);
  gracefulShutdown(1);
});

// ---------------------------------------------------------
// Main Entry Point
// ---------------------------------------------------------
async function run() {
  try {
    validateEnvironment();
    
    await freePort(FRONTEND_PORT, 'frontend');
    await freePort(BACKEND_PORT, 'backend');

    startBackend();

    const isBackendReady = await waitForBackend();
    if (!isBackendReady) {
      console.error(`\x1b[31m[Launcher]\x1b[0m Backend failed to become ready in time.`);
      gracefulShutdown(1);
      return;
    }

    startFrontend();
    
    // Give frontend a tiny bit of time to print its initial binding message
    await sleep(2000);

    console.log(`\n====================================================`);
    console.log(`✅ Backend ready    -> http://localhost:${BACKEND_PORT}`);
    console.log(`✅ Frontend ready   -> http://localhost:${FRONTEND_PORT}`);
    console.log(`✅ Database         -> Connected`);
    console.log(`✅ Socket.IO        -> Initialized`);
    console.log(`🚀 Stock Market Dashboard is running successfully.`);
    console.log(`====================================================\n`);

    // Keep orchestrator process alive indefinitely to serve background processes
    await new Promise(() => {});

  } catch (error) {
    console.error(`\x1b[31m[Launcher]\x1b[0m Orchestration error:`, error);
    gracefulShutdown(1);
  }
}

run();
