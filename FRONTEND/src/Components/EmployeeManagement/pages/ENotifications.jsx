import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Filter, 
  Search, 
  Check, 
  Trash2, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  Settings,
  RefreshCw
} from 'lucide-react';
import { useENotification } from '../Econtexts/ENotificationContext.jsx';
import { useETheme } from '../Econtexts/EThemeContext.jsx';

export const ENotifications = () => {
  const { theme } = useETheme();
  const darkMode = theme === 'dark';
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    generateSampleNotifications
  } = useENotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-500 bg-red-100';
      case 'high': return 'text-orange-500 bg-orange-100';
      case 'medium': return 'text-yellow-500 bg-yellow-100';
      case 'low': return 'text-green-500 bg-green-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getPriorityColorDark = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-400 bg-red-900';
      case 'high': return 'text-orange-400 bg-orange-900';
      case 'medium': return 'text-yellow-400 bg-yellow-900';
      case 'low': return 'text-green-400 bg-green-900';
      default: return 'text-gray-400 bg-gray-700';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
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

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMinutes = Math.floor((now - notificationDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const filteredAndSortedNotifications = notifications
    .filter(notification => {
      // Search filter
      if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !notification.message.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Status filter
      if (filter === 'unread' && notification.isRead) return false;
      if (filter === 'read' && !notification.isRead) return false;

      // Priority filter
      if (priorityFilter !== 'all' && notification.priority !== priorityFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && notification.category !== categoryFilter) return false;

      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.scheduledTime) - new Date(a.scheduledTime);
      if (sortBy === 'oldest') return new Date(a.scheduledTime) - new Date(b.scheduledTime);
      if (sortBy === 'priority') {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
  };

  const handleRefresh = async () => {
    await fetchNotifications();
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gray-900' : 'bg-light-beige'}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-dark-green'}`}>
              Notifications
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {unreadCount} unread notifications
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition-colors ${
                darkMode ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-500 hover:bg-gray-600'
              } ${unreadCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Check size={18} />
              <span>Mark All Read</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  darkMode 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Status</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="all">All Categories</option>
            <option value="daily_operations">Daily Operations</option>
            <option value="leave_management">Leave Management</option>
            <option value="attendance">Attendance</option>
            <option value="overtime">Overtime</option>
            <option value="employee_status">Employee Status</option>
            <option value="system">System</option>
            <option value="compliance">Compliance</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="priority">By Priority</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            Loading notifications...
          </div>
        ) : filteredAndSortedNotifications.length === 0 ? (
          <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No notifications found</h3>
            <p>Try adjusting your filters or generate sample notifications.</p>
          </div>
        ) : (
          filteredAndSortedNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-6 rounded-lg border transition-all hover:shadow-lg ${
                darkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' : 'bg-white border-gray-200 hover:bg-gray-50'
              } ${!notification.isRead ? darkMode ? 'ring-2 ring-blue-500' : 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    {getCategoryIcon(notification.category)}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {notification.title}
                      </h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notification.type)}
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        darkMode ? getPriorityColorDark(notification.priority) : getPriorityColor(notification.priority)
                      }`}>
                        {notification.priority}
                      </span>
                      <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatTimeAgo(notification.scheduledTime)}
                      </span>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {notification.category.replace('_', ' ')}
                      </span>
                      
                      {notification.metadata?.actionRequired && (
                        <span className={`text-xs px-2 py-1 rounded ${
                          darkMode ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-800'
                        }`}>
                          Action Required
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!notification.isRead && (
                        <button
                          onClick={() => markAsRead(notification._id)}
                          className={`px-3 py-1 text-xs rounded transition-colors ${
                            darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          Mark as Read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification._id)}
                        className={`p-2 rounded transition-colors ${
                          darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
