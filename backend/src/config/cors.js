/**
 * Centralized CORS configuration for backend HTTP server and Socket.io.
 */

export const getAllowedOrigins = () => {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((s) => s.trim())
    : [];

  const frontendUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim() : null;
  const clientUrl = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : null;

  const defaults = [
    'http://localhost:3250',
    'http://127.0.0.1:3250',
    'http://localhost:3210',
    'http://127.0.0.1:3210',
    'http://localhost:3209',
    'http://127.0.0.1:3209',
  ];

  return Array.from(new Set([
    ...envOrigins,
    ...(frontendUrl ? [frontendUrl] : []),
    ...(clientUrl ? [clientUrl] : []),
    ...defaults
  ]));
};


export const checkCorsOrigin = (origin, callback) => {
  // Allow requests with no origin (e.g., curl, mobile apps, server-to-server, health check)
  if (!origin) {
    return callback(null, true);
  }

  // Automatically allow all localhost/127.0.0.1 ports during development
  const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
  if (isLocalhost) {
    return callback(null, true);
  }

  // Automatically allow production domains (punitdevops.shop & vercel.app preview URLs)
  const isProductionDomain = origin.includes('punitdevops.shop') || origin.endsWith('.vercel.app');
  if (isProductionDomain) {
    return callback(null, true);
  }

  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }

  console.warn(`[CORS] Blocked request from origin: ${origin}`);
  return callback(null, false);
};

export const corsOptions = {
  origin: checkCorsOrigin,
  credentials: true,
};
