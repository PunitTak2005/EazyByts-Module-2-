import api from '@/services/api.js';
import { normalizeArray } from '@/services/apiNormalizer.js';
import { handleApiError } from '@/services/errorHandler.js';

export const notificationService = {
  getNotifications: async () => {
    try {
      const response = await api.get('/notifications');
      return normalizeArray(response);
    } catch (error) {
      handleApiError(error, 'Unable to load notifications.');
      return [];
    }
  },
  
  markAsRead: async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response;
    } catch (error) {
      handleApiError(error, 'Unable to update notification.');
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/read-all');
      return response;
    } catch (error) {
      handleApiError(error, 'Unable to mark all notifications as read.');
      throw error;
    }
  },

  deleteNotification: async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response;
    } catch (error) {
      handleApiError(error, 'Unable to delete notification.');
      throw error;
    }
  }
};
