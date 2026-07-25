import axios from 'axios';
import toast from 'react-hot-toast';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5009/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  withCredentials: true,
});

// Map to store active requests for deduplication/cancellation
const activeRequests = new Map();

// Helper to generate a unique request key
const getRequestKey = (config) => {
  return `${config.method}_${config.url}_${JSON.stringify(config.params || {})}_${JSON.stringify(config.data || {})}`;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // 1. Attach authorization token if present
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // 2. Preserve any AbortController signal provided by the caller.
    //    Previously this was silently overwritten — callers had no way to cancel
    //    their own requests (e.g. AuthContext cleanup, ThemeContext rapid toggle).
    //    We now chain: if the caller's signal aborts, our deduplication controller
    //    aborts too, which actually cancels the in-flight axios request.
    const callerSignal = config.signal ?? null;

    // 3. Cancel duplicate pending requests for the same endpoint
    const requestKey = getRequestKey(config);
    if (activeRequests.has(requestKey)) {
      const existingController = activeRequests.get(requestKey);
      existingController.abort(); // Cancel the stale duplicate
      activeRequests.delete(requestKey);
    }

    // 4. Create our deduplication controller for this request
    const controller = new AbortController();

    // Chain caller signal → deduplication controller.
    // This makes passing `signal` to api.get/put/etc. actually work.
    if (callerSignal) {
      if (callerSignal.aborted) {
        // Caller already cancelled before the request started — abort immediately
        controller.abort();
      } else {
        callerSignal.addEventListener('abort', () => controller.abort(), { once: true });
      }
    }

    config.signal = controller.signal;
    activeRequests.set(requestKey, controller);

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Remove completed request from tracking map
    const requestKey = getRequestKey(response.config);
    activeRequests.delete(requestKey);

    // Normalize response: return actual data wrapper
    return response.data;
  },
  async (error) => {
    const config = error.config;

    // Remove request from map
    if (config) {
      const requestKey = getRequestKey(config);
      activeRequests.delete(requestKey);
    }

    // Handle aborted/cancelled requests — do NOT retry, do NOT show alerts.
    // Cancellation is an expected lifecycle event (StrictMode cleanup, navigation,
    // rapid duplicate prevention). The caller decides how to react.
    if (axios.isCancel(error) || error?.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    // Retry Strategy: Auto-retry on network errors or 5xx server errors
    config._retryCount = config._retryCount || 0;
    const maxRetries = 3;

    const isNetworkOrServerError = !error.response || (error.response.status >= 500 && error.response.status <= 599);

    if (isNetworkOrServerError && config._retryCount < maxRetries) {
      config._retryCount += 1;
      const delay = Math.pow(2, config._retryCount) * 1000; // Exponential backoff

      if (import.meta.env.DEV) {
        console.warn(`[API] Request failed. Retrying attempt ${config._retryCount}/${maxRetries} in ${delay}ms...`);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(config); // Re-run request
    }

    // Centralized Error Handling & Token Refresh Interceptor
    const status = error.response ? error.response.status : null;

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
          if (localStorage.getItem('token')) {
            localStorage.setItem('token', newToken);
          } else if (sessionStorage.getItem('token')) {
            sessionStorage.setItem('token', newToken);
          } else {
            localStorage.setItem('token', newToken);
          }
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
        console.warn(`[API] Resource not found (404): ${config?.url}`);
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
