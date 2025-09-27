import React, { useState, useEffect } from "react";
import { useLoader } from "../contexts/LoaderContext.js";
import { useTheme } from "../contexts/ThemeContext.js";
import { useNotifications } from "../contexts/NotificationContext.js";
import { 
  Bell, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Filter,
  Search,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff
} from "lucide-react";

export default function Alerts() {
  const { theme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading } = useLoader();
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    getNotificationsByType,
    getCriticalNotifications
  } = useNotifications();

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showRead, setShowRead] = useState(true);

  useEffect(() => {
    document.title = "Animal Alerts - Animal Manager";
    fetchNotifications();
  }, []);

  const getFilteredNotifications = () => {
    let filtered = notifications;

    // Filter by type
    if (filter !== "all") {
      filtered = filtered.filter(n => n.type === filter);
    }

    // Filter by read status
    if (!showRead) {
      filtered = filtered.filter(n => !n.read);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="text-red-500" size={20} />;
      case 'high':
        return <AlertCircle className="text-orange-500" size={20} />;
      case 'medium':
        return <Info className="text-yellow-500" size={20} />;
      default:
        return <CheckCircle className="text-blue-500" size={20} />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'border-red-500 bg-red-50 dark:bg-red-900/30';
      case 'high':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/30';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30';
      default:
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/30';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      feed_stock: 'Feed Stock',
      health: 'Health',
      expiry: 'Expiry',
      productivity: 'Productivity',
      feeding: 'Feeding',
      zone: 'Zone',
      meat: 'Meat',
      system: 'System'
    };
    return labels[type] || type;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className={`p-6 h-full ${darkMode ? "bg-gray-900" : "light-beige"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="text-blue-600 dark:text-blue-400" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Notifications</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount} unread notifications
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            } transition-all`}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
                darkMode ? "bg-blue-700 hover:bg-blue-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              } transition-all`}
            >
              <CheckCircle size={16} />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-800" : "bg-white"} shadow-sm mb-6`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search size={16} className={darkMode ? "text-gray-400" : "text-gray-500"} />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`px-3 py-2 rounded-lg border ${
                darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
          
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`px-3 py-2 rounded-lg border ${
              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
            } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="all">All Types</option>
            <option value="feed_stock">Feed Stock</option>
            <option value="health">Health</option>
            <option value="expiry">Expiry</option>
            <option value="productivity">Productivity</option>
            <option value="feeding">Feeding</option>
            <option value="zone">Zone</option>
            <option value="meat">Meat</option>
            <option value="system">System</option>
          </select>

          <button
            onClick={() => setShowRead(!showRead)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              showRead 
                ? (darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-200 text-gray-800")
                : (darkMode ? "bg-blue-700 text-white" : "bg-blue-600 text-white")
            } transition-all`}
          >
            {showRead ? <EyeOff size={16} /> : <Eye size={16} />}
            {showRead ? "Hide Read" : "Show Read"}
          </button>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500 dark:text-gray-400">Loading notifications...</div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Bell className="text-gray-400 dark:text-gray-500" size={48} />
          <p className="text-gray-600 dark:text-gray-300 mt-4">
            {notifications.length === 0 ? "No notifications yet" : "No notifications match your filters"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <div
              key={notification._id}
              className={`p-4 rounded-lg shadow border-l-4 transition-all cursor-pointer ${
                getPriorityColor(notification.priority)
              } ${!notification.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''}`}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification._id);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getPriorityIcon(notification.priority)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-semibold ${darkMode ? "text-white" : "text-gray-800"}`}>
                        {notification.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
                      }`}>
                        {getTypeLabel(notification.type)}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"} mb-2`}>
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>{notification.timeAgo || notification.formattedTime || 'Unknown time'}</span>
                      <span className="capitalize">{notification.priority} priority</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
