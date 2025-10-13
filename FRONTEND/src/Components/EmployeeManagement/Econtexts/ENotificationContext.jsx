import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const useENotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useENotification must be used within an ENotificationProvider');
  }
  return context;
};

export const ENotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [realtimeReady, setRealtimeReady] = useState(false);

  const buildSampleNotifications = () => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const iso = (d) => new Date(d).toISOString();
    const samples = [
      {
        _id: 'seed-1',
        title: 'New leave request',
        message: 'New leave request from John Doe for 2025-10-20 to 2025-10-22',
        category: 'leave_management',
        priority: 'high',
        type: 'warning',
        isRead: false,
        scheduledTime: iso(now),
        metadata: { actionRequired: true, actionType: 'review_leave' }
      },
      {
        _id: 'seed-2',
        title: 'Missed check-in detected',
        message: 'Missed check-in detected for Jane at 09:15',
        category: 'attendance',
        priority: 'medium',
        type: 'warning',
        isRead: false,
        scheduledTime: iso(now),
        metadata: { actionRequired: true, actionType: 'review_attendance' }
      },
      {
        _id: 'seed-3',
        title: 'Overtime submitted',
        message: 'Overtime submitted: Rajitha 2h 30m for 2025-10-11',
        category: 'overtime',
        priority: 'medium',
        type: 'info',
        isRead: false,
        scheduledTime: iso(now),
        metadata: { actionRequired: false }
      },
      {
        _id: 'seed-4',
        title: 'Employee transfer',
        message: 'Rathana transferred to Inventory Management',
        category: 'employee_status',
        priority: 'low',
        type: 'info',
        isRead: false,
        scheduledTime: iso(now),
        metadata: { actionRequired: false }
      },
      {
        _id: 'seed-5',
        title: 'Analytics refresh',
        message: 'Overtime analytics refresh completed successfully',
        category: 'system',
        priority: 'low',
        type: 'success',
        isRead: false,
        scheduledTime: iso(now),
        metadata: { actionRequired: false }
      },
      {
        _id: 'seed-6',
        title: 'Export job failed',
        message: 'Export job failed',
        category: 'system',
        priority: 'high',
        type: 'error',
        isRead: false,
        scheduledTime: iso(now),
        metadata: { actionRequired: true, actionType: 'retry_export' }
      },
      {
        _id: 'seed-7',
        title: 'Compliance reminder',
        message: 'Safety training certificate expires in 7 days',
        category: 'compliance',
        priority: 'urgent',
        type: 'urgent',
        isRead: false,
        scheduledTime: iso(now),
        metadata: { actionRequired: true, actionType: 'renew_certificate' }
      }
    ];
    return samples;
  };

  // Fetch notifications from API
  const fetchNotifications = async (options = {}) => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      
      if (options.category) params.append('category', options.category);
      if (options.priority) params.append('priority', options.priority);
      if (options.unreadOnly) params.append('unreadOnly', 'true');
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const response = await axios.get(`http://localhost:5000/api/employee-notifications?${params}`);
      if (response.data.success) {
        const list = response.data.data.notifications || [];
        if (Array.isArray(list) && list.length > 0) {
          setNotifications(list);
          setUnreadCount(response.data.data.unreadCount || list.filter(n => !n.isRead).length);
        } else {
          const seeded = buildSampleNotifications();
          setNotifications(seeded);
          setUnreadCount(seeded.filter(n => !n.isRead).length);
        }
      } else {
        const seeded = buildSampleNotifications();
        setNotifications(seeded);
        setUnreadCount(seeded.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      const seeded = buildSampleNotifications();
      setNotifications(seeded);
      setUnreadCount(seeded.filter(n => !n.isRead).length);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/employee-notifications/${notificationId}/read`
      );
      
      if (response.data.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, isRead: true, readAt: new Date() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const response = await axios.patch(
        'http://localhost:5000/api/employee-notifications/mark-all-read'
      );
      
      if (response.data.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/employee-notifications/${notificationId}`
      );
      
      if (response.data.success) {
        const deletedNotification = notifications.find(n => n._id === notificationId);
        setNotifications(prev => prev.filter(notification => notification._id !== notificationId));
        
        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.isRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Generate sample notifications for testing
  const generateSampleNotifications = async () => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/employee-notifications/generate-all'
      );
      if (response.data.success) {
        await fetchNotifications();
      } else {
        const seeded = buildSampleNotifications();
        setNotifications(seeded);
        setUnreadCount(seeded.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error generating sample notifications:', error);
      const seeded = buildSampleNotifications();
      setNotifications(seeded);
      setUnreadCount(seeded.filter(n => !n.isRead).length);
    }
  };

  // Auto-refresh notifications every 30 seconds
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      // If realtime is connected, skip redundant polling
      if (!realtimeReady) fetchNotifications();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Optional Server-Sent Events real-time stream
  useEffect(() => {
    let es;
    let reconnectTimer;

    const start = () => {
      try {
        es = new EventSource('http://localhost:5000/api/employee-notifications/stream');

        es.onopen = () => {
          setRealtimeReady(true);
        };

        es.onerror = () => {
          setRealtimeReady(false);
          if (es && es.readyState !== 2 /* CLOSED */) {
            es.close();
          }
          // attempt reconnect with backoff
          reconnectTimer = setTimeout(() => start(), 5000);
        };

        es.onmessage = (evt) => {
          try {
            const payload = JSON.parse(evt.data);
            // Payload can be a single notification or { type, data }
            if (Array.isArray(payload)) {
              // Full refresh
              setNotifications(payload);
              setUnreadCount(payload.filter(n => !n.isRead).length);
              return;
            }

            const type = payload.type || 'created';
            const data = payload.data || payload;

            if (type === 'created') {
              setNotifications(prev => {
                const exists = prev.some(n => n._id === data._id);
                const next = exists ? prev.map(n => (n._id === data._id ? data : n)) : [data, ...prev];
                return next;
              });
              setUnreadCount(prev => (!data.isRead ? prev + 1 : prev));
            } else if (type === 'updated' || type === 'read') {
              setNotifications(prev => prev.map(n => (n._id === data._id ? { ...n, ...data } : n)));
              if (type === 'read' || data.isRead) {
                setUnreadCount(prev => Math.max(0, prev - 1));
              }
            } else if (type === 'deleted') {
              setNotifications(prev => prev.filter(n => n._id !== data._id));
              setUnreadCount(prev => (data.isRead ? prev : Math.max(0, prev - 1)));
            } else if (type === 'snapshot') {
              const list = Array.isArray(data) ? data : [];
              setNotifications(list);
              setUnreadCount(list.filter(n => !n.isRead).length);
            }
          } catch (e) {
            // ignore malformed events
          }
        };
      } catch (e) {
        // SSE not supported or blocked; stay on polling
        setRealtimeReady(false);
      }
    };

    start();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (es) es.close();
    };
  }, []);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    isNotificationOpen,
    setIsNotificationOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    generateSampleNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
