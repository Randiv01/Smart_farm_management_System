// PTopNavbar.jsx
import React, { useState, useEffect } from "react";
import { Menu, Bell, Sun, Moon, User, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PTopNavbar({ sidebarOpen, onMenuClick }) {
  const [darkMode, setDarkMode] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3); // example
  const navigate = useNavigate();

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

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
          <button
            onClick={onMenuClick}
            className={`p-2 rounded-md mr-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-600"}`}
          >
            <Menu size={24} />
          </button>
          <h2 className={`text-lg font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
            Plant Management Dashboard
          </h2>
        </div>

        {/* Right */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode */}
          <button onClick={toggleTheme} className="p-2 rounded-md">
            {darkMode ? <Sun size={20} className="text-yellow-300" /> : <Moon size={20} className="text-gray-600" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-full relative"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-md"
            >
              <div className="rounded-full w-8 h-8 flex items-center justify-center bg-gray-200">
                <User size={18} />
              </div>
              <div className="hidden sm:block text-right">
                <span className="block text-sm font-medium">Plant Manager</span>
              </div>
              <ChevronDown size={16} />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 bg-white border border-gray-200">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
