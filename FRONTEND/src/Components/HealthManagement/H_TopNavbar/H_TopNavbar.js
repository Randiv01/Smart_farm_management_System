import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Bell, Sun, Moon, User, LogOut, ChevronDown, Calendar, Pill
} from 'lucide-react';
import { ThemeContext } from '../H_contexts/H_ThemeContext.js';

export default function H_TopNavbar({ darkMode, toggleTheme, onMenuClick, sidebarOpen }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const ADMIN_BASE = "/admin";

  useEffect(() => {
    // Load user data from localStorage
    const user = {
      name: localStorage.getItem("name") || "Health Admin",
      firstName: localStorage.getItem("firstName"),
      lastName: localStorage.getItem("lastName"),
      role: localStorage.getItem("role") || "health",
      profileImage: localStorage.getItem("profileImage") || null
    };
    setUserData(user);
    
    // Fetch notifications if user is logged in
    if (localStorage.getItem("token")) {
      fetchNotifications();
      
      // Set up interval to check for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      // Mock health-related notifications
      const mockNotifications = [
        {
          id: 1,
          type: "appointment",
          title: "Upcoming Appointment",
          message: "Appointment with John Doe at 10:30 AM",
          timestamp: new Date(Date.now() + 2 * 60 * 60 * 1000),
          read: false,
          priority: 'medium'
        },
        {
          id: 2,
          type: "medication",
          title: "Medication Alert",
          message: "Amoxicillin is running low (12 doses remaining)",
          timestamp: new Date(),
          read: false,
          priority: 'medium'
        }
      ];
      setNotifications(mockNotifications);
      setUnreadCount(mockNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = (id) => {
    const updatedNotifications = notifications.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    );
    setNotifications(updatedNotifications);
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true
    }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === "appointment") {
      navigate(`${ADMIN_BASE}/appointments`);
    } else if (notification.type === "medication") {
      navigate(`${ADMIN_BASE}/medistore`);
    }
    
    setNotificationsOpen(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const formatRole = (role) => {
    const roles = {
      "animal": "Animal Manager",
      "plant": "Plant Manager",
      "inv": "Inventory Manager",
      "emp": "Employee Manager",
      "health": "Health Manager",
      "owner": "Farm Owner",
      "admin": "Administrator"
    };
    return roles[role] || role;
  };

  const getProfileImageUrl = (path) => {
    if (!path) return null;
    if (path.includes('http')) return path;
    return `http://localhost:5000/api/users/profile-image/${path}`;
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "appointment": return <Calendar size={16} className="text-blue-500" />;
      case "medication": return <Pill size={16} className="text-red-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  if (!userData) return null;

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 h-16 flex items-center z-30 transition-all duration-300
        ${darkMode ? "bg-gray-900 border-b border-gray-700 shadow-md" : "bg-white border-b border-gray-200 shadow-sm"}
        ${sidebarOpen ? "lg:pl-64" : "lg:pl-20"} pl-4 pr-4
      `}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left */}
        <div className="flex items-center">
          {/* Menu Button - This is the toggle button for the sidebar */}
          <button
            onClick={onMenuClick}  // This should call the toggleSidebar function
            className={`p-2 rounded-md mr-2 ${darkMode ? "hover:bg-gray-800 text-gray-200" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <Menu size={24} />
          </button>
          <h2 className={`text-lg font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
            {`${formatRole(userData.role)} Dashboard`}
          </h2>
        </div>

        {/* Right */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-md ${darkMode ? "hover:bg-gray-800 text-gray-200" : "hover:bg-gray-100 text-gray-600"}`}
          >
            {darkMode ? <Sun size={20} className="text-yellow-300" /> : <Moon size={20} className="text-gray-600" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              className={`p-2 rounded-full relative ${darkMode ? "hover:bg-gray-800 text-gray-200" : "hover:bg-gray-100 text-gray-600"}`}
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                if (!notificationsOpen) {
                  fetchNotifications();
                }
              }}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            
            {notificationsOpen && (
              <div className={`absolute right-0 mt-2 w-80 rounded-md shadow-lg py-2 z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className={`font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`text-xs ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
                          notification.read 
                            ? darkMode ? "bg-gray-800" : "bg-white" 
                            : darkMode ? "bg-gray-700" : "bg-blue-50"
                        } hover:${darkMode ? "bg-gray-700" : "bg-gray-50"}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                              {notification.title}
                            </p>
                            <p className={`text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                              {notification.message}
                            </p>
                            <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
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
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        No notifications
                      </p>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => navigate(`${ADMIN_BASE}/notifications`)}
                      className={`w-full text-center text-sm ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-800"}`}
                    >
                      View all notifications
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              className={`flex items-center space-x-2 p-2 rounded-md ${darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"}`}
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <div className={`rounded-full overflow-hidden w-8 h-8 flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                {userData.profileImage ? (
                  <img src={getProfileImageUrl(userData.profileImage)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User size={18} className={darkMode ? "text-gray-200" : "text-gray-600"} />
                )}
              </div>
              <div className="hidden sm:block text-right">
                <span className={`block text-sm font-medium truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                  {userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.name}
                </span>
                <span className={`block text-xs truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {formatRole(userData.role)}
                </span>
              </div>
              <ChevronDown size={16} className={darkMode ? "text-white" : "text-gray-600"} />
            </button>
            {userMenuOpen && (
              <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center">
                  <div className={`rounded-full overflow-hidden w-10 h-10 flex items-center justify-center mr-3 ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                    {userData.profileImage ? (
                      <img src={getProfileImageUrl(userData.profileImage)} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className={darkMode ? "text-gray-200" : "text-gray-600"} />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>
                      {userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : userData.name}
                    </p>
                    <p className={`text-xs ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                      {formatRole(userData.role)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${darkMode ? "text-gray-200 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"}`}
                >
                  <LogOut size={16} className="mr-2" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}