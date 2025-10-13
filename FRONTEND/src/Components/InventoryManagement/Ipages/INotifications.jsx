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

  // Load persisted read status from localStorage
  const getPersistedReadStatus = () => {
    try {
      const persisted = localStorage.getItem('inventory_notifications_read');
      return persisted ? JSON.parse(persisted) : [];
    } catch (error) {
      console.error('Error loading persisted read status:', error);
      return [];
    }
  };

  // Save read status to localStorage
  const persistReadStatus = (readIds) => {
    try {
      localStorage.setItem('inventory_notifications_read', JSON.stringify(readIds));
    } catch (error) {
      console.error('Error persisting read status:', error);
    }
  };

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
      
      // Fetch refill request notifications, general notifications, and productivity notifications
      const [refillResponse, generalResponse, productivityResponse] = await Promise.all([
        axios.get("http://localhost:5000/api/refill-requests/notifications", {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 50 }
        }).catch(() => ({ data: [] })),
        axios.get("http://localhost:5000/api/notifications/Inventory Management").catch(() => ({ data: { data: { notifications: [] } } })),
        axios.get("http://localhost:5000/api/notifications/productivity", {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { notifications: [] } }))
      ]);
      
      // Combine all notification sources
      const refillNotifications = refillResponse.data || [];
      const generalNotifications = generalResponse.data?.data?.notifications || [];
      const productivityNotifications = productivityResponse.data?.notifications || [];
      
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
      
      // Convert productivity notifications to match the expected format
      const convertedProductivityNotifications = productivityNotifications.map(notification => ({
        id: notification.id,
        title: notification.data?.harvestType === 'meat' ? 'Meat Harvest Notification' : 'Productivity Harvest Notification',
        message: `${notification.data?.senderName} reported ${notification.data?.quantity} ${notification.data?.unit} of ${notification.data?.productType} (${notification.data?.quality} quality)`,
        type: 'productivity',
        priority: notification.data?.quality === 'excellent' ? 'high' : notification.data?.quality === 'poor' ? 'low' : 'medium',
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
      const allNotifications = [...processedRefillNotifications, ...convertedGeneralNotifications, ...convertedProductivityNotifications];
      
      // Apply persisted read status
      const persistedReadIds = getPersistedReadStatus();
      const notificationsWithPersistence = allNotifications.map(notification => ({
        ...notification,
        read: notification.read || persistedReadIds.includes(notification.id)
      }));
      
      setNotifications(notificationsWithPersistence);
      setUnreadCount(notificationsWithPersistence.filter(n => !n.read).length);
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
      
      // Optimistic UI update
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Emit custom event to notify other components
      window.dispatchEvent(new CustomEvent('notificationRead', { 
        detail: { 
          notificationId, 
          unreadCount: Math.max(0, unreadCount - 1),
          type: 'single'
        } 
      }));
      
      // Persist to localStorage immediately
      const persistedReadIds = getPersistedReadStatus();
      if (!persistedReadIds.includes(notificationId)) {
        const updatedReadIds = [...persistedReadIds, notificationId];
        persistReadStatus(updatedReadIds);
      }
      
      // Find the notification to determine its type
      const notification = notifications.find(n => n.id === notificationId);
      
      if (notification) {
        // Mark as read in the appropriate system
        if (notification.type === 'harvest') {
          // Mark general notification as read
          await axios.patch(`http://localhost:5000/api/notifications/${notificationId}/read`);
        } else if (notification.type === 'productivity') {
          // Mark productivity notification as read
          await axios.patch(`http://localhost:5000/api/notifications/productivity/${notificationId}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (token) {
          // Mark refill request notification as read
          await axios.patch(`http://localhost:5000/api/refill-requests/notifications/${notificationId}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      // Revert optimistic update on error
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: false } : n)
      );
      setUnreadCount(prev => prev + 1);

      // Emit custom event to revert the change
      window.dispatchEvent(new CustomEvent('notificationRead', { 
        detail: { 
          notificationId, 
          unreadCount: unreadCount + 1,
          type: 'revert'
        } 
      }));
      
      // Remove from persisted read status on error
      const persistedReadIds = getPersistedReadStatus();
      const updatedReadIds = persistedReadIds.filter(id => id !== notificationId);
      persistReadStatus(updatedReadIds);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem("token");
      
      // Mark all notifications as read in both systems
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Persist all unread IDs to localStorage
      const persistedReadIds = getPersistedReadStatus();
      const unreadIds = unreadNotifications.map(n => n.id);
      const updatedReadIds = [...new Set([...persistedReadIds, ...unreadIds])];
      persistReadStatus(updatedReadIds);
      
      // Optimistic UI update
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);

      // Emit custom event to notify other components
      window.dispatchEvent(new CustomEvent('allNotificationsRead', { 
        detail: { 
          unreadCount: 0,
          type: 'markAllRead'
        } 
      }));
      
      // Backend updates
      for (const notification of unreadNotifications) {
        if (notification.type === 'harvest') {
          await axios.patch(`http://localhost:5000/api/notifications/${notification.id}/read`);
        } else if (notification.type === 'productivity') {
          await axios.patch(`http://localhost:5000/api/notifications/productivity/${notification.id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        } else if (token) {
          await axios.patch(`http://localhost:5000/api/refill-requests/notifications/${notification.id}/read`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId, event) => {
    event?.stopPropagation(); // Prevent triggering click to mark as read
    
    if (!window.confirm('Are you sure you want to delete this notification?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const notification = notifications.find(n => n.id === notificationId);
      
      // Optimistic UI update
      const wasUnread = !notification?.read;
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Emit custom event to notify other components
        window.dispatchEvent(new CustomEvent('notificationDeleted', { 
          detail: { 
            notificationId,
            wasUnread: true,
            unreadCount: Math.max(0, unreadCount - 1)
          } 
        }));
      }
      
      // Remove from persisted read status
      const persistedReadIds = getPersistedReadStatus();
      const updatedReadIds = persistedReadIds.filter(id => id !== notificationId);
      persistReadStatus(updatedReadIds);
      
      // Backend deletion
      if (notification?.type === 'harvest') {
        await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (notification?.type === 'productivity') {
        await axios.delete(`http://localhost:5000/api/notifications/productivity/${notificationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else if (token) {
        // For refill requests, use the appropriate endpoint
        await axios.delete(`http://localhost:5000/api/refill-requests/notifications/${notificationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
      // Revert optimistic update on error
      fetchNotifications();
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
      case 'productivity':
        return <Package className="text-orange-500" size={20} />;
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
      productivity: 'Productivity',
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
                notification.read 
                  ? (darkMode ? 'bg-gray-600/30 border-gray-400 opacity-75' : 'bg-gray-50 border-gray-300 opacity-75')
                  : getPriorityColor(notification.priority)
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
                      {notification.read && (
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          <CheckCircle className="h-3 w-3" />
                          Read
                        </span>
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => deleteNotification(notification.id, e)}
                    className={`p-2 rounded-lg transition-colors ${
                      darkMode 
                        ? 'hover:bg-gray-600 text-gray-400 hover:text-red-400' 
                        : 'hover:bg-gray-200 text-gray-600 hover:text-red-600'
                    }`}
                    title="Delete notification"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
