import React, { useState, useEffect } from "react";
import { useITheme } from '../Icontexts/IThemeContext.jsx';
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
  EyeOff,
  Package,
  ShoppingCart,
  Truck,
  Calendar
} from "lucide-react";
import axios from "axios";
import io from 'socket.io-client';

export default function INotifications() {
  const { theme } = useITheme();
  const darkMode = theme === "dark";
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showRead, setShowRead] = useState(true);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    document.title = "Inventory Notifications - Inventory Manager";
    
    // Initialize Socket.io connection
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    // Join user room for personalized notifications
    const userId = localStorage.getItem("userId");
    if (userId) {
      newSocket.emit('join-user-room', userId);
    }
    
    // Listen for real-time notifications
    newSocket.on('refillRequest', (data) => {
      addNotification(data);
    });
    
    newSocket.on('refillRequestUpdate', (data) => {
      addNotification(data);
    });

    // Fetch initial notifications
    fetchNotifications();
    
    return () => {
      newSocket.disconnect();
    };
  }, []);

  const addNotification = (notification) => {
    setNotifications(prev => {
      // Check if notification already exists
      const exists = prev.some(n => n.id === notification.id);
      if (!exists) {
        const newNotification = {
          ...notification,
          read: false,
          timeAgo: getTimeAgo(notification.timestamp),
          formattedTime: new Date(notification.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        };
        return [newNotification, ...prev];
      }
      return prev;
    });
    
    setUnreadCount(prev => prev + 1);
  };

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) return;
      
      // Fetch both refill request notifications and general notifications for Inventory Management
      const [refillResponse, generalResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/refill-requests/notifications", {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 }
        }).catch(() => ({ data: [] })),
        axios.get("http://localhost:5000/api/notifications/Inventory Management").catch(() => ({ data: { data: { notifications: [] } } }))
      ]);
      
      // Combine both notification sources
      const refillNotifications = refillResponse.data || [];
      const generalNotifications = generalResponse.data?.data?.notifications || [];
      
      // Convert general notifications to match the expected format
      const convertedGeneralNotifications = generalNotifications.map(notification => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type === 'success' ? 'harvest' : notification.type,
        priority: notification.type === 'success' ? 'medium' : 'low',
        read: notification.read,
        timestamp: notification.createdAt,
        timeAgo: getTimeAgo(notification.createdAt),
        formattedTime: new Date(notification.createdAt).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        data: notification.data
      }));
      
      // Add timeAgo and formattedTime to refill notifications
      const processedRefillNotifications = refillNotifications.map(notification => ({
        ...notification,
        timeAgo: getTimeAgo(notification.timestamp),
        formattedTime: new Date(notification.timestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        })
      }));
      
      // Merge all notifications, avoiding duplicates
      const allNotifications = [...processedRefillNotifications, ...convertedGeneralNotifications];
      setNotifications(allNotifications);
      setUnreadCount(allNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      
      // Find the notification to determine its type
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        // Mark as read in the appropriate system
        if (notification.type === 'harvest') {
          // Mark general notification as read
          await axios.patch(`http://localhost:5000/api/notifications/${notificationId}/read`);
        } else if (token) {
          // Mark refill request notification as read
          await axios.patch(`http://localhost:5000/api/refill-requests/notifications/${notificationId}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Mark all notifications as read in both systems
      const unreadNotifications = notifications.filter(n => !n.read);
      
      for (const notification of unreadNotifications) {
        if (notification.type === 'harvest') {
          await axios.patch(`http://localhost:5000/api/notifications/${notification.id}/read`);
        } else if (token) {
          await axios.patch(`http://localhost:5000/api/refill-requests/notifications/${notification.id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

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

  const getPriorityIcon = (priority, type) => {
    // Use type-specific icons first
    switch (type) {
      case 'refillRequest':
        return <Package className="text-blue-500" size={20} />;
      case 'refillRequestUpdate':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'lowStock':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'order':
        return <ShoppingCart className="text-purple-500" size={20} />;
      case 'harvest':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'supplier':
        return <Truck className="text-orange-500" size={20} />;
      case 'expiry':
        return <Calendar className="text-red-500" size={20} />;
      default:
        // Fallback to priority-based icons
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
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return darkMode 
          ? 'border-red-500 bg-red-900/20 text-white' 
          : 'border-red-500 bg-red-50 text-gray-800';
      case 'high':
        return darkMode 
          ? 'border-orange-500 bg-orange-900/20 text-white' 
          : 'border-orange-500 bg-orange-50 text-gray-800';
      case 'medium':
        return darkMode 
          ? 'border-yellow-500 bg-yellow-900/20 text-white' 
          : 'border-yellow-500 bg-yellow-50 text-gray-800';
      default:
        return darkMode 
          ? 'border-blue-500 bg-blue-900/20 text-white' 
          : 'border-blue-500 bg-blue-50 text-gray-800';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      refillRequest: 'Refill Request',
      refillRequestUpdate: 'Refill Update',
      lowStock: 'Low Stock',
      order: 'Order',
      harvest: 'Harvest',
      supplier: 'Supplier',
      expiry: 'Expiry',
      stock: 'Stock',
      system: 'System'
    };
    return labels[type] || type;
  };

  const filteredNotifications = getFilteredNotifications();

  return (
    <div className={`p-6 h-full ${darkMode ? "bg-gray-900" : "bg-light-beige"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="text-blue-600 dark:text-blue-400" size={28} />
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Inventory Notifications</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount} unread notifications
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchNotifications}
            disabled={isLoading}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 ${
              darkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-200" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
            } transition-all disabled:opacity-50`}
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
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
            <option value="refillRequest">Refill Request</option>
            <option value="refillRequestUpdate">Refill Update</option>
            <option value="lowStock">Low Stock</option>
            <option value="order">Order</option>
            <option value="harvest">Harvest</option>
            <option value="supplier">Supplier</option>
            <option value="expiry">Expiry</option>
            <option value="stock">Stock</option>
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
              key={notification.id}
              className={`p-4 rounded-lg shadow border-l-4 transition-all cursor-pointer ${
                getPriorityColor(notification.priority)
              } ${!notification.read ? 'ring-2 ring-blue-200 dark:ring-blue-800' : ''} ${
                darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
              }`}
              onClick={() => {
                if (!notification.read) {
                  markAsRead(notification.id);
                }
              }}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getPriorityIcon(notification.priority, notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-inherit">
                        {notification.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        darkMode ? "bg-gray-600 text-gray-200" : "bg-gray-200 text-gray-700"
                      }`}>
                        {getTypeLabel(notification.type)}
                      </span>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      )}
                    </div>
                    <p className={`text-sm mb-2 ${
                      darkMode ? "text-gray-200" : "text-gray-600"
                    }`}>
                      {notification.message}
                    </p>
                    <div className={`flex items-center gap-4 text-xs ${
                      darkMode ? "text-gray-300" : "text-gray-500"
                    }`}>
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
