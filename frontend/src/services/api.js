import axios from 'axios';
import toast from 'react-hot-toast';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  withCredentials: true,
});

// Map to store active requests for deduplication/cancellation
const activeRequests = new Map();

// Helper to generate a unique request key
const getRequestKey = (config) => {
  return `${config.method}_${config.url}_${JSON.stringify(config.params || {})}_${JSON.stringify(config.data || {})}`;
};

// Helper to check if request URL is an authentication endpoint
const isAuthEndpoint = (url = '') => {
  return url.includes('/auth/login') || 
         url.includes('/auth/register') || 
         url.includes('/auth/forgot-password') || 
         url.includes('/auth/reset-password') || 
         url.includes('/auth/refresh') || 
         url.includes('/auth/logout');
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // 1. Attach authorization token if present
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    const callerSignal = config.signal ?? null;
    const isAuth = isAuthEndpoint(config.url);

    // 2. Attach caller AbortSignal if provided for cancellation on unmount
    if (!isAuth && callerSignal) {
      const controller = new AbortController();
      if (callerSignal.aborted) {
        controller.abort();
      } else {
        callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
      config.signal = controller.signal;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Remove completed request from tracking map
    if (response.config) {
      const requestKey = getRequestKey(response.config);
      activeRequests.delete(requestKey);
    }
    return response.data;
  },
  async (error) => {
    const config = error.config || {};
    const url = config.url || '';
    const isAuth = isAuthEndpoint(url);

    if (config.url) {
      const requestKey = getRequestKey(config);
      activeRequests.delete(requestKey);
    }

    // Handle aborted/cancelled requests — do NOT retry
    if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    const status = error.response ? error.response.status : null;
    const backendMessage = error.response?.data?.message || error.message;

    // Log diagnostic error details safely (without password or secrets)
    console.error(`[API Diagnostic] ${config.method?.toUpperCase()} ${url} -> Status: ${status || 'Network Error'} | Message: ${backendMessage}`);

    // Auth Endpoints Rules: NEVER auto-retry, NEVER attempt token refresh on login 401
    if (isAuth) {
      return Promise.reject(error);
    }

    // Retry Strategy for NON-AUTH requests: Auto-retry on network errors or 5xx server errors
    config._retryCount = config._retryCount || 0;
    const maxRetries = 3;
    const isNetworkOrServerError = !error.response || (status >= 500 && status <= 599);

    if (isNetworkOrServerError && config._retryCount < maxRetries) {
      config._retryCount += 1;
      const delay = Math.pow(2, config._retryCount) * 1000; // Exponential backoff

      if (import.meta.env.DEV) {
        console.warn(`[API] Request failed (${url}). Retrying attempt ${config._retryCount}/${maxRetries} in ${delay}ms...`);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config); // Re-run request
    }

    // Centralized Error Handling & Token Refresh Interceptor for Non-Auth endpoints
    if (status === 401 && !config._isRetry) {
      config._isRetry = true;
      try {
        if (import.meta.env.DEV) {
          console.log('[API] Unauthorized (401). Attempting token refresh...');
        }
        const response = await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });
        const newToken = response.data?.data?.token;
        if (newToken) {
          if (import.meta.env.DEV) {
            console.log('[API] Token refresh succeeded. Retrying original request.');
          }
          localStorage.setItem('token', newToken);
          config.headers['Authorization'] = `Bearer ${newToken}`;
          return api(config);
        }
      } catch (refreshError) {
        if (import.meta.env.DEV) {
          console.error('[API] Token refresh failed. Clearing session.', refreshError.message);
        }
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        window.location.href = '/landing';
      }
    } else if (status === 401) {
      if (import.meta.env.DEV) {
        console.error('[API] Unauthorized (401) on retried request. Clearing session token.');
      }
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    } else if (status === 403) {
      toast.error('Forbidden: Access denied.');
    } else if (status === 404) {
      if (import.meta.env.DEV) {
        console.warn(`[API] Resource not found (404): ${url}`);
      }
    } else if (status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (!error.response && !axios.isCancel(error)) {
      toast.error('Network connection issues detected.');
    }

    return Promise.reject(error);
  }
);

export default api;
