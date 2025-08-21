import React, { useState, useEffect } from "react";
import { Menu, Bell, Sun, Moon, User, LogOut, ChevronDown } from "lucide-react";
import { useITheme } from '../Icontexts/IThemeContext.jsx';
import { useNavigate } from "react-router-dom";

export default function TopNavbar({ onMenuClick, sidebarOpen }) {
  const { theme, toggleTheme } = useITheme();
  const darkMode = theme === "dark";
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load user data from localStorage
    const user = {
      name: localStorage.getItem("name") || "Admin",
      firstName: localStorage.getItem("firstName"),
      lastName: localStorage.getItem("lastName"),
      role: localStorage.getItem("role") || "admin",
      profileImage: localStorage.getItem("profileImage") || null
    };
    setUserData(user);
  }, []);

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
    const cleanPath = path.replace(/\\/g, "/");
    const parts = cleanPath.split("/");
    const filename = parts[parts.length - 1];
    return `http://localhost:5000/api/users/profile-image/${filename}`;
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
          <button
            onClick={onMenuClick}
            className={`p-2 rounded-md mr-2 ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-600"}`}
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
            className={`p-2 rounded-md ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            {darkMode ? <Sun size={20} className="text-yellow-300" /> : <Moon size={20} className="text-gray-600" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              className={`p-2 rounded-full relative ${darkMode ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-100 text-gray-600"}`}
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell size={20} />
              <span className="absolute top-1 right-1 bg-red-500 rounded-full w-2 h-2"></span>
            </button>
            {notificationsOpen && (
              <div className={`absolute right-0 mt-2 w-64 rounded-md shadow-lg py-2 z-50 ${darkMode ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"}`}>
                <p className="px-4 text-sm">No new notifications</p>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              className={`flex items-center space-x-2 p-2 rounded-md ${darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}
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
