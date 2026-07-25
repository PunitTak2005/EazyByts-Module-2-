/**
 * errorHandler.js
 * Centralized API error handling.
 */
import toast from 'react-hot-toast';
import axios from 'axios';

export const handleApiError = (error, defaultMessage = 'An unexpected error occurred.') => {
  if (axios.isCancel(error)) {
    // Gracefully ignore request cancellations/aborts without showing toasts or logs
    return null;
  }
  console.error('[API Error]:', error);
  const message = error.response?.data?.message || error.message || defaultMessage;
  toast.error(message);
  return message;
};
