import NotificationService from '../services/NotificationService.js';
import { sendSuccess } from './authController.js';

export const listNotifications = async (req, res, next) => {
  try {
    const list = await NotificationService.list(req.user._id);
    return sendSuccess(res, 'Notifications log retrieved', list);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notif = await NotificationService.markRead(req.user._id, req.params.id);
    return sendSuccess(res, 'Notification marked as read', notif);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await NotificationService.markAllRead(req.user._id);
    return sendSuccess(res, 'All notifications marked as read', { updatedCount: result.updatedCount });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const result = await NotificationService.delete(req.user._id, req.params.id);
    return sendSuccess(res, result.message, { id: result.id });
  } catch (error) {
    next(error);
  }
};
