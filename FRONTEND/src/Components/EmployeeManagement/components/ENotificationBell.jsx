import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, Trash2, Settings, Filter } from 'lucide-react';
import { useENotification } from '../Econtexts/ENotificationContext.jsx';
import { useETheme } from '../Econtexts/EThemeContext.jsx';

export const ENotificationBell = () => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  const {
    notifications,
    unreadCount,
    isLoading,
    isNotificationOpen,
    setIsNotificationOpen,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    generateSampleNotifications
  } = useENotification();

  const [filter, setFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-500';
      case 'high': return 'text-orange-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'urgent': return '🔴';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'daily_operations': return '📊';
      case 'leave_management': return '🏖️';
      case 'attendance': return '⏰';
      case 'overtime': return '⏱️';
      case 'employee_status': return '👤';
      case 'system': return '⚙️';
      case 'compliance': return '📋';
      default: return '📢';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.isRead;
    if (filter === 'urgent') return notification.priority === 'urgent';
    if (filter === 'leave') return notification.category === 'leave_management';
    if (filter === 'attendance') return notification.category === 'attendance';
    return true;
  });

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    
    // Handle action if required
    if (notification.metadata?.actionRequired) {
      // You can add navigation logic here
      console.log('Action required:', notification.metadata.actionType);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsNotificationOpen(!isNotificationOpen)}
        className={`relative p-2 rounded-lg transition-colors ${
          darkMode 
            ? 'hover:bg-gray-700 text-gray-300' 
            : 'hover:bg-gray-100 text-gray-600'
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ${
            unreadCount > 9 ? 'text-xs' : 'text-sm'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isNotificationOpen && (
        <div className={`absolute right-0 top-12 w-96 max-h-96 overflow-hidden rounded-lg shadow-xl border z-50 ${
          darkMode 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          {/* Header */}
          <div className={`p-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <Filter size={16} />
                </button>
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className={`p-1 rounded ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} ${
                    unreadCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={generateSampleNotifications}
                  className={`px-2 py-1 text-xs rounded ${
                    darkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Generate Sample
                </button>
              </div>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {['all', 'unread', 'urgent', 'leave', 'attendance'].map((filterType) => (
                  <button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    className={`px-2 py-1 text-xs rounded ${
                      filter === filterType
                        ? darkMode
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-500 text-white'
                        : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Loading notifications...
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-4 text-center">
                <Bell size={32} className={`mx-auto mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No notifications found
                </div>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b cursor-pointer transition-colors ${
                    darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                  } ${!notification.isRead ? darkMode ? 'bg-gray-750' : 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <span className="text-lg">
                        {getCategoryIcon(notification.category)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium truncate ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${getPriorityColor(notification.priority)}`}>
                            {getTypeIcon(notification.type)}
                          </span>
                          <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {formatTimeAgo(notification.scheduledTime)}
                          </span>
                        </div>
                      </div>
                      
                      <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                        {notification.message}
                      </p>
                      
                      {notification.metadata?.actionRequired && (
                        <div className={`text-xs px-2 py-1 rounded ${
                          darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
                        }`}>
                          Action Required
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-shrink-0 flex flex-col gap-1">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification._id);
                        }}
                        className={`p-1 rounded ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className={`p-3 border-t text-center ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <button
                onClick={() => setIsNotificationOpen(false)}
                className={`text-sm ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
              >
                View All Notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
