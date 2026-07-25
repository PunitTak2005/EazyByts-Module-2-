import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notificationService';

export const useNotifications = (user) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Notifications] Fetching notifications...');
      }
      const list = await notificationService.getNotifications();
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (error) {
      console.error('[Notifications] Error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[Notifications] Marking all as read...');
      }
      
      const response = await notificationService.markAllAsRead();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Notifications] Updated ${response?.data?.updatedCount || 0} notifications.`);
      }

      // Optimistic local update
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Notifications] Local state synchronized.');
      }
    } catch (err) {
      console.error('[Notifications] Failed to mark notifications read:', err);
      // Optional: re-fetch if optimistic update fails
      fetchNotifications();
    }
  };

  return {
    notifications,
    unreadCount,
    markAllAsRead,
    fetchNotifications
  };
};
