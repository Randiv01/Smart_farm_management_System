import React, { useState, useEffect } from "react";
import { Bell, RefreshCw, AlertCircle, AlertTriangle, CheckCircle, Info, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "./context/ThemeContext";

export default function NotificationDropdown({ isOpen, onClose }) {
  const { theme } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const response = await axios.get('http://localhost:5000/api/animal-management/notifications');
      if (response.data.success) {
        const list = Array.isArray(response.data.data) ? response.data.data : (response.data.data?.notifications || []);
        setNotifications(list);
        const unreadNotifications = list.filter(n => !n.read);
        setUnreadCount(unreadNotifications.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.patch(`http://localhost:5000/api/animal-management/notifications/${notificationId}/read`);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await axios.patch('http://localhost:5000/api/animal-management/notifications/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type or data
    if (notification.type === 'pest_alert' || notification.type === 'disease_alert') {
      navigate('/PlantManagement/pest-disease-management');
    } else if (notification.type === 'harvest_reminder') {
      navigate('/PlantManagement/productivity');
    } else if (notification.type === 'inspection_due') {
      navigate('/PlantManagement/inspections');
    } else if (notification.type === 'consultation_request') {
      navigate('/PlantManagement/consultations');
    }
    
    onClose();
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'pest_alert':
      case 'disease_alert':
        return <AlertTriangle size={16} className="text-red-500" />;
      case 'harvest_reminder':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'inspection_due':
        return <AlertCircle size={16} className="text-yellow-500" />;
      case 'consultation_request':
        return <Info size={16} className="text-blue-500" />;
      default:
        return <Bell size={16} className="text-gray-500" />;
    }
  };

  // Get notification priority class
  const getNotificationPriorityClass = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-50';
      case 'high':
        return 'bg-orange-50';
      case 'medium':
        return 'bg-yellow-50';
      case 'low':
        return 'bg-blue-50';
      default:
        return 'bg-white';
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      style={{
        backgroundColor: theme === 'dark' ? 'var(--card-bg)' : 'white',
        borderColor: theme === 'dark' ? 'var(--border)' : '#e5e7eb'
      }}
      className={`absolute right-0 mt-2 w-96 rounded-md shadow-lg py-2 z-50 border`}
    >
      <div 
        style={{
          borderColor: theme === 'dark' ? 'var(--border)' : '#e5e7eb'
        }}
        className="px-4 py-2 border-b flex justify-between items-center"
      >
        <h3 
          style={{ color: theme === 'dark' ? 'var(--text)' : '#111827' }}
          className="font-medium"
        >
          Notifications
        </h3>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{ color: theme === 'dark' ? 'var(--primary)' : '#2563eb' }}
              className="text-xs hover:opacity-80 transition-opacity"
            >
              Mark all as read
            </button>
          )}
          <button
            onClick={fetchNotifications}
            disabled={loadingNotifications}
            className={`p-1 rounded transition-colors ${
              theme === 'dark' ? 'hover:bg-[#3a3a3b]' : 'hover:bg-gray-100'
            }`}
          >
            <RefreshCw 
              size={14} 
              className={`${loadingNotifications ? "animate-spin" : ""} ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
              }`} 
            />
          </button>
        </div>
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`px-4 py-3 cursor-pointer border-b last:border-b-0 transition-colors ${
                theme === 'dark' ? 'border-gray-700 hover:bg-[#3a3a3b]' : 'border-gray-100 hover:bg-gray-50'
              } ${
                notification.read 
                  ? theme === 'dark' ? "bg-[#2a2a2b]" : "bg-white" 
                  : theme === 'dark' ? "bg-[#3a3a3b]" : getNotificationPriorityClass(notification.priority)
              }`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="ml-3 flex-1">
                  <p 
                    style={{ color: theme === 'dark' ? 'var(--text)' : '#111827' }}
                    className="text-sm font-medium"
                  >
                    {notification.title}
                  </p>
                  <p 
                    style={{ color: theme === 'dark' ? 'var(--text-light)' : '#4b5563' }}
                    className="text-sm"
                  >
                    {notification.message}
                  </p>
                  <p 
                    style={{ color: theme === 'dark' ? 'var(--text-light)' : '#6b7280' }}
                    className="text-xs mt-1"
                  >
                    {formatTime(notification.timestamp)}
                  </p>
                </div>
                {!notification.read && (
                  <div className="flex-shrink-0">
                    <span className="bg-blue-500 rounded-full w-2 h-2"></span>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="px-4 py-3 text-center">
            <p 
              style={{ color: theme === 'dark' ? 'var(--text-light)' : '#6b7280' }}
              className="text-sm"
            >
              No notifications
            </p>
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div 
          style={{
            borderColor: theme === 'dark' ? 'var(--border)' : '#e5e7eb'
          }}
          className="px-4 py-2 border-t"
        >
          <button
            onClick={() => {
              navigate('/PlantManagement/notifications');
              onClose();
            }}
            style={{ color: theme === 'dark' ? 'var(--primary)' : '#2563eb' }}
            className="w-full text-center text-sm hover:opacity-80 transition-opacity"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}


