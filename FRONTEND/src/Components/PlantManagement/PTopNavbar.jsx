// PTopNavbar.jsx
import React, { useState, useEffect } from "react";
import { Menu, Bell, Sun, Moon, User, LogOut, ChevronDown, AlertTriangle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useTheme } from "./context/ThemeContext";
import NotificationDropdown from "./NotificationDropdown";

export default function PTopNavbar({ sidebarOpen, onMenuClick }) {
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fullName, setFullName] = useState("Plant Manager");
  const [role, setRole] = useState("plant");
  const [profileImage, setProfileImage] = useState("");
  const [plantManagementIssues, setPlantManagementIssues] = useState({
    totalIssues: 0,
    criticalIssues: 0,
    highIssues: 0,
    mediumIssues: 0,
    lowIssues: 0,
    issues: []
  });
  const [showIssueAlert, setShowIssueAlert] = useState(false);
  const navigate = useNavigate();

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/animal-management/notifications');
        if (response.data.success) {
          const list = Array.isArray(response.data.data) ? response.data.data : (response.data.data?.notifications || []);
          const unreadNotifications = list.filter(n => !n.read);
          setUnreadCount(unreadNotifications.length);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    fetchUnreadCount();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch Plant Management issues for header alert
  useEffect(() => {
    const fetchPlantManagementIssues = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/plant-management-issues');
        if (response.data.success) {
          setPlantManagementIssues(response.data.data);
          
          // Show alert if there are critical or high priority issues
          if (response.data.data.criticalIssues > 0 || response.data.data.highIssues > 0) {
            setShowIssueAlert(true);
            
            // Auto-hide alert after 10 seconds
            setTimeout(() => setShowIssueAlert(false), 10000);
          }
        }
      } catch (error) {
        console.error('Error fetching Plant Management issues:', error);
      }
    };

    fetchPlantManagementIssues();
    // Poll for updates every 60 seconds
    const interval = setInterval(fetchPlantManagementIssues, 60000);
    return () => clearInterval(interval);
  }, []);

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
          localStorage.setItem("userEmail", user.email || "");
          localStorage.setItem("userPhone", user.phone || "");
          localStorage.setItem("userAddress", user.address || "");
          localStorage.setItem("userCity", user.city || "");
          localStorage.setItem("userCountry", user.country || "");
          localStorage.setItem("userDateOfBirth", user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "");
          localStorage.setItem("userBio", user.bio || "");
          
          if (updatedImage) {
            localStorage.setItem("profileImage", updatedImage);
          }
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
        // Keep the localStorage values if API fails
      }
    };

    // Event listener for profile updates
    const handleProfileUpdate = (event) => {
      console.log('Profile update event received in navbar:', event.detail);
      if (event.detail) {
        if (event.detail.fullName) {
          setFullName(event.detail.fullName);
          localStorage.setItem("userFullName", event.detail.fullName);
        }
        if (event.detail.profileImage !== undefined) {
          const imageUrl = event.detail.profileImage.startsWith('http') 
            ? event.detail.profileImage 
            : `http://localhost:5000/api${event.detail.profileImage}`;
          setProfileImage(imageUrl);
          if (imageUrl) {
            localStorage.setItem("profileImage", imageUrl);
          } else {
            localStorage.removeItem("profileImage");
          }
        }
        if (event.detail.role) {
          setRole(event.detail.role);
          localStorage.setItem("userRole", event.detail.role);
        }
      }
    };

    window.addEventListener('userProfileUpdated', handleProfileUpdate);
    
    fetchUserData();

    return () => {
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []); // Empty dependency array to run only once

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
          
          {/* Issue Alert */}
          {showIssueAlert && (plantManagementIssues.criticalIssues > 0 || plantManagementIssues.highIssues > 0) && (
            <div className="ml-4 px-3 py-1 bg-red-100 border border-red-300 rounded-full flex items-center gap-2">
              {plantManagementIssues.criticalIssues > 0 ? (
                <>
                  <AlertCircle size={16} className="text-red-600" />
                  <span className="text-red-700 text-sm font-medium">
                    {plantManagementIssues.criticalIssues} Critical Issue{plantManagementIssues.criticalIssues > 1 ? 's' : ''}
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={16} className="text-orange-600" />
                  <span className="text-orange-700 text-sm font-medium">
                    {plantManagementIssues.highIssues} High Priority Issue{plantManagementIssues.highIssues > 1 ? 's' : ''}
                  </span>
                </>
              )}
              <button 
                onClick={() => setShowIssueAlert(false)}
                className="text-gray-500 hover:text-gray-700 ml-1 text-xs"
              >
                ×
              </button>
            </div>
          )}
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
            
            {/* Notification Dropdown */}
            <NotificationDropdown 
              isOpen={notificationsOpen} 
              onClose={() => setNotificationsOpen(false)} 
            />
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`flex items-center space-x-2 p-2 rounded-md ${hoverBg} transition-colors`}
            >
              {profileImage ? (
                <img
                    src={profileImage.startsWith('http') ? profileImage : `http://localhost:5000/api${profileImage}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      // Show fallback if image fails to load
                      const fallback = document.querySelector('.profile-fallback');
                      if (fallback) fallback.style.display = 'flex';
                    }}
                />
              ) : null}
              <div className="profile-fallback" style={{display: profileImage ? 'none' : 'flex', backgroundColor: theme === 'dark' ? 'var(--border)' : 'var(--background)'}} className1="rounded-full w-8 h-8 flex items-center justify-center">
                <User size={18} />
              </div>
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