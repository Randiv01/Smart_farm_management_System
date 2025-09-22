// PTopNavbar.jsx
import React, { useState, useEffect } from "react";
import { Menu, Bell, Sun, Moon, User, LogOut, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "./context/ThemeContext";



export default function PTopNavbar({ sidebarOpen, onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  const [fullName, setFullName] = useState("Plant Manager");
  const [role, setRole] = useState("plant");
  const [profileImage, setProfileImage] = useState("");
  const navigate = useNavigate();

  // Theme-based colors using CSS variables
  const bgColor = theme === 'dark' ? 'var(--card-bg)' : 'var(--card-bg)';
  const textColor = theme === 'dark' ? 'var(--text)' : 'var(--text)';
  const borderColor = theme === 'dark' ? 'var(--border)' : 'var(--border)';
  const hoverBg = theme === 'dark' ? 'hover:bg-[#3a3a3b]' : 'hover:bg-gray-100';

  const getRoleDisplayName = (role) => {
    const roleMap = {
      animal: "Animal Manager",
      plant: "Plant Manager",
      inv: "Inventory Manager",
      emp: "Employee Manager",
      health: "Health Manager",
      owner: "Owner",
      admin: "Administrator",
      normal: "Normal User"
    };
    return roleMap[role] || role;
  };

  useEffect(() => {
    // Get user data from localStorage first for immediate display
    const name = localStorage.getItem("userFullName") || "Plant Manager";
    const userRole = localStorage.getItem("userRole") || "plant";
    const image = localStorage.getItem("profileImage") || "";
    
    setFullName(name);
    setRole(userRole);
    setProfileImage(image);

    // Then try to fetch from API for the most current data
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get("/api/users/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          const user = response.data;
          const updatedName = `${user.firstName} ${user.lastName}`;
          const updatedRole = user.role;
          const updatedImage = user.profileImage ? `/api${user.profileImage}` : "";
          
          setFullName(updatedName);
          setRole(updatedRole);
          setProfileImage(updatedImage);
          
          // Store in localStorage for persistence
          localStorage.setItem("userFullName", updatedName);
          localStorage.setItem("userRole", updatedRole);
          localStorage.setItem("userEmail", user.email);
          if (updatedImage) {
            localStorage.setItem("profileImage", updatedImage);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        // Keep the localStorage values if API fails
      }
    };

    fetchUserData();
    
  // Listen for profile updates - FIX: Handle all update scenarios
  const handleProfileUpdate = (event) => {
    console.log('Profile update event received:', event.detail);
    
    if (event.detail) {
      setFullName(event.detail.fullName || fullName);
      setProfileImage(event.detail.profileImage || profileImage);
      // Also update role if provided
      if (event.detail.role) {
        setRole(event.detail.role);
        localStorage.setItem("userRole", event.detail.role);
      }
    }
    
    // Always refresh from localStorage as fallback
    setTimeout(() => {
      setFullName(localStorage.getItem("userFullName") || "Plant Manager");
      setRole(localStorage.getItem("userRole") || "plant");
      setProfileImage(localStorage.getItem("profileImage") || "");
    }, 100);
  };
  
  window.addEventListener('userProfileUpdated', handleProfileUpdate);
  return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
}, []);

  const handleLogout = () => {
    // Clear all localStorage items
    localStorage.clear();
    
    // Clear any session storage if used
    sessionStorage.clear();
    
    // Force a full page reload to ensure complete logout
    window.location.href = "/login";
  };

  return (
    <header
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: borderColor
      }}
      className={`
        fixed top-0 left-0 right-0 h-16 flex items-center z-30 transition-all duration-300 border-b shadow-sm
        ${sidebarOpen ? "lg:pl-64" : "lg:pl-20"} pl-4 pr-4
      `}
    >
      <div className="flex items-center justify-between w-full">
        {/* Left */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className={`p-2 rounded-md mr-2 ${hoverBg} transition-colors`}
          >
            <Menu size={24} />
          </button>
          <h2 className={`text-lg font-semibold truncate`}>
            Plant Management Dashboard
          </h2>
        </div>

        {/* Right */}
        <div className="flex items-center space-x-2">
          {/* Dark Mode */}
          <button 
            onClick={toggleTheme} 
            className={`p-2 rounded-md ${hoverBg} transition-colors`}
          >
            {theme === 'dark' ? <Sun size={20} style={{color: 'var(--status-active)'}} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className={`p-2 rounded-full relative ${hoverBg} transition-colors`}
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
              className={`flex items-center space-x-2 p-2 rounded-md ${hoverBg} transition-colors`}
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <div style={{backgroundColor: theme === 'dark' ? 'var(--border)' : 'var(--background)'}} className="rounded-full w-8 h-8 flex items-center justify-center">
                  <User size={18} />
                </div>
              )}
              <div className="hidden sm:block text-right">
                <span className="block text-sm font-medium">{fullName}</span>
                <span style={{color: theme === 'dark' ? 'var(--text-light)' : 'var(--text-light)'}} className="block text-xs">
                  {getRoleDisplayName(role)}
                </span>
              </div>
              <ChevronDown size={16} />
            </button>

            {userMenuOpen && (
              <div 
                style={{
                  backgroundColor: bgColor,
                  borderColor: borderColor
                }}
                className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 z-50 border`}
              >
                <button
                  onClick={handleLogout}
                  className={`flex items-center w-full text-left px-4 py-2 text-sm ${theme === 'dark' ? "hover:bg-[#3a3a3b]" : "hover:bg-gray-100"} transition-colors`}
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