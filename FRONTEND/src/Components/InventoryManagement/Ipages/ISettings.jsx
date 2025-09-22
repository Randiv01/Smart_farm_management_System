// ISettings.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useITheme } from "../Icontexts/IThemeContext";
import { 
  FiSave, 
  FiBell, 
  FiDatabase, 
  FiUser, 
  FiShield, 
  FiGlobe,
  FiRefreshCw,
  FiTrash2,
  FiDownload,
  FiUpload,
  FiCheck,
  FiX,
  FiAlertCircle,
  FiCamera
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import io from 'socket.io-client';

// MessagePopup Component
const MessagePopup = ({ type, message, show, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
        >
          <div
            className={`rounded-lg shadow-lg p-6 w-full max-w-md text-center ${
              type === "success"
                ? "bg-green-100 border-l-4 border-green-500 text-green-700"
                : "bg-red-100 border-l-4 border-red-500 text-red-700"
            }`}
          >
            <div className="flex justify-center mb-3">
              {type === "success" ? (
                <FiCheck className="h-6 w-6" />
              ) : (
                <FiAlertCircle className="h-6 w-6" />
              )}
            </div>
            <p className="text-base font-medium">{message}</p>
            <button
              onClick={onClose}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-700"
            >
              <FiX className="h-5 w-5 mr-1" /> Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ISettings = () => {
  const { theme, toggleTheme } = useITheme();
  const darkMode = theme === "dark";
  const [socket, setSocket] = useState(null);
  
  // State for all settings
  const [settings, setSettings] = useState({
    general: {
      farmName: "Green Valley Farm",
      currency: "USD",
      language: "English",
      dateFormat: "MM/DD/YYYY",
      timezone: "GMT-5"
    },
    notifications: {
      lowStock: true,
      expiryAlerts: true,
      salesReport: true,
      emailNotifications: true,
      pushNotifications: false
    },
    inventory: {
      lowStockThreshold: 20,
      autoBackup: true,
      backupFrequency: "daily",
      categoryManagement: ["Vegetables", "Eggs", "Meat", "Milk", "Finals"]
    },
    user: {
      name: localStorage.getItem("name") || "Admin",
      firstName: localStorage.getItem("firstName") || "",
      lastName: localStorage.getItem("lastName") || "",
      email: localStorage.getItem("email") || "",
      role: localStorage.getItem("role") || "admin",
      profileImage: localStorage.getItem("profileImage") || "",
      changePassword: ""
    }
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState("general");
  const [message, setMessage] = useState({ type: "", text: "", show: false });
  const [validationErrors, setValidationErrors] = useState({});

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Show message popup
  const showMessage = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => {
      setMessage({ type: "", text: "", show: false });
    }, 3000);
  }, []);

  // Handle input changes
  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Clear validation error when field is updated
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate settings
  const validateSettings = () => {
    const errors = {};
    
    if (!settings.general.farmName.trim()) errors.farmName = "Farm name is required";
    
    if (settings.inventory.lowStockThreshold < 1) {
      errors.lowStockThreshold = "Low stock threshold must be at least 1";
    }
    
    if (settings.user.changePassword && settings.user.changePassword.length < 8) {
      errors.changePassword = "Password must be at least 8 characters";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle profile image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showMessage("error", "Please select an image file");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showMessage("error", "Image size must be less than 5MB");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append('profileImage', file);
      
      const response = await axios.post(
        "http://localhost:5000/api/users/upload-profile-image", 
        formData, 
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update local state
      handleInputChange("user", "profileImage", response.data.imageUrl);
      
      // Update localStorage
      localStorage.setItem("profileImage", response.data.imageUrl);
      
      // Emit socket event to update other components
      if (socket) {
        socket.emit('userProfileUpdated', {
          firstName: settings.user.firstName,
          lastName: settings.user.lastName,
          profileImage: response.data.imageUrl
        });
      }
      
      showMessage("success", "Profile image updated successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      showMessage("error", "Failed to upload image");
    }
  };

  // Handle save settings
  const saveSettings = async () => {
    if (!validateSettings()) {
      showMessage("error", "Please fix the validation errors");
      return;
    }
    
    try {
      // In a real application, this would save to a backend
      console.log("Saving settings:", settings);
      
      // Update localStorage with user data
      localStorage.setItem("firstName", settings.user.firstName);
      localStorage.setItem("lastName", settings.user.lastName);
      localStorage.setItem("name", `${settings.user.firstName} ${settings.user.lastName}`);
      localStorage.setItem("email", settings.user.email);
      
      // Emit socket event to update other components
      if (socket) {
        socket.emit('userProfileUpdated', {
          firstName: settings.user.firstName,
          lastName: settings.user.lastName,
          profileImage: settings.user.profileImage
        });
      }
      
      showMessage("success", "Settings saved successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("error", "Failed to save settings");
    }
  };

  // Handle data export
  const exportData = () => {
    // In a real application, this would export data
    showMessage("success", "Data export initiated. You'll receive an email when it's ready.");
  };

  // Handle data import
  const importData = () => {
    // In a real application, this would import data
    showMessage("info", "Please select a file to import your data.");
  };

  // Handle reset to defaults
  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all settings to default values?")) {
      // Reset logic would go here
      showMessage("success", "Settings reset to defaults");
    }
  };

  // Format role for display
  const formatRole = (role) => {
    const roleMap = {
      "animal": "Animal Manager",
      "plant": "Plant Manager", 
      "inv": "Inventory Manager",
      "emp": "Employee Manager",
      "health": "Health Manager",
      "owner": "Owner",
      "normal": "Normal User",
      "admin": "Administrator"
    };
    
    return roleMap[role] || role;
  };

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">System Settings</h1>
          <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage your inventory system preferences and configuration
          </p>
        </div>

        {/* Message Popup */}
        <MessagePopup 
          type={message.type} 
          message={message.text} 
          show={message.show} 
          onClose={() => setMessage({ type: "", text: "", show: false })} 
        />

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["general", "notifications", "inventory", "user", "data"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? "bg-blue-600 text-white" 
                  : `${darkMode ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-white text-gray-700 hover:bg-gray-200"}`
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={`rounded-xl shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"} p-6`}>
          
          {/* General Settings Tab */}
          {activeTab === "general" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg mr-3 ${darkMode ? "bg-blue-900/20" : "bg-blue-100"}`}>
                  <FiGlobe className={`text-xl ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                </div>
                <h2 className="text-xl font-semibold">General Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Farm Name *
                  </label>
                  <input
                    type="text"
                    value={settings.general.farmName}
                    onChange={(e) => handleInputChange("general", "farmName", e.target.value)}
                    className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} ${validationErrors.farmName ? "border-red-500" : ""}`}
                  />
                  {validationErrors.farmName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.farmName}</p>
                  )}
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Currency
                  </label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => handleInputChange("general", "currency", e.target.value)}
                    className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Language
                  </label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => handleInputChange("general", "language", e.target.value)}
                    className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                  >
                    <option value="English">English</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                    <option value="German">German</option>
                  </select>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Theme
                  </label>
                  <div className="flex items-center mt-2">
                    <span className="mr-2">Light</span>
                    <div 
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${darkMode ? "bg-blue-600" : "bg-gray-300"}`}
                      onClick={toggleTheme}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${darkMode ? "translate-x-6" : ""}`}></div>
                    </div>
                    <span className="ml-2">Dark</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Notification Settings Tab */}
          {activeTab === "notifications" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg mr-3 ${darkMode ? "bg-green-900/20" : "bg-green-100"}`}>
                  <FiBell className={`text-xl ${darkMode ? "text-green-400" : "text-green-600"}`} />
                </div>
                <h2 className="text-xl font-semibold">Notification Settings</h2>
              </div>
              
              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <label className={`flex items-center ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                      <span className="ml-2">
                        {key === "lowStock" && "Low stock alerts"}
                        {key === "expiryAlerts" && "Product expiry alerts"}
                        {key === "salesReport" && "Daily sales reports"}
                        {key === "emailNotifications" && "Email notifications"}
                        {key === "pushNotifications" && "Push notifications"}
                      </span>
                    </label>
                    <div 
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${value ? (darkMode ? "bg-blue-600" : "bg-blue-500") : (darkMode ? "bg-gray-600" : "bg-gray-300")}`}
                      onClick={() => handleInputChange("notifications", key, !value)}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${value ? "translate-x-6" : ""}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Inventory Settings Tab */}
          {activeTab === "inventory" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg mr-3 ${darkMode ? "bg-purple-900/20" : "bg-purple-100"}`}>
                  <FiDatabase className={`text-xl ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
                </div>
                <h2 className="text-xl font-semibold">Inventory Settings</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Low Stock Threshold *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.inventory.lowStockThreshold}
                    onChange={(e) => handleInputChange("inventory", "lowStockThreshold", parseInt(e.target.value))}
                    className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} ${validationErrors.lowStockThreshold ? "border-red-500" : ""}`}
                  />
                  {validationErrors.lowStockThreshold && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.lowStockThreshold}</p>
                  )}
                  <p className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    Alert when stock falls below this quantity
                  </p>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Auto Backup
                  </label>
                  <div className="flex items-center mt-2">
                    <div 
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${settings.inventory.autoBackup ? (darkMode ? "bg-blue-600" : "bg-blue-500") : (darkMode ? "bg-gray-600" : "bg-gray-300")}`}
                      onClick={() => handleInputChange("inventory", "autoBackup", !settings.inventory.autoBackup)}
                    >
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${settings.inventory.autoBackup ? "translate-x-6" : ""}`}></div>
                    </div>
                    <span className="ml-2">{settings.inventory.autoBackup ? "Enabled" : "Disabled"}</span>
                  </div>
                  
                  {settings.inventory.autoBackup && (
                    <div className="mt-3">
                      <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Backup Frequency
                      </label>
                      <select
                        value={settings.inventory.backupFrequency}
                        onChange={(e) => handleInputChange("inventory", "backupFrequency", e.target.value)}
                        className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6">
                <h3 className={`text-md font-medium mb-2 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Product Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {settings.inventory.categoryManagement.map((category, index) => (
                    <span key={index} className={`px-3 py-1 rounded-full text-sm ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                      {category}
                    </span>
                  ))}
                  <button className={`px-3 py-1 rounded-full text-sm ${darkMode ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-500 hover:bg-blue-600"} text-white`}>
                    + Add Category
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* User Settings Tab */}
          {activeTab === "user" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg mr-3 ${darkMode ? "bg-amber-900/20" : "bg-amber-100"}`}>
                  <FiUser className={`text-xl ${darkMode ? "text-amber-400" : "text-amber-600"}`} />
                </div>
                <h2 className="text-xl font-semibold">User Account</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    value={settings.user.firstName}
                    onChange={(e) => handleInputChange("user", "firstName", e.target.value)}
                    className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={settings.user.lastName}
                    onChange={(e) => handleInputChange("user", "lastName", e.target.value)}
                    className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={settings.user.email}
                    onChange={(e) => handleInputChange("user", "email", e.target.value)}
                    className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                  />
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Role
                  </label>
                  <input
                    type="text"
                    value={formatRole(settings.user.role)}
                    disabled
                    className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-500"}`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Profile Image
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className={`rounded-full overflow-hidden w-16 h-16 flex items-center justify-center ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}>
                      {settings.user.profileImage ? (
                        <img 
                          src={settings.user.profileImage} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiUser size={24} className={darkMode ? "text-gray-400" : "text-gray-500"} />
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                        <FiCamera size={14} />
                        <span>Change Image</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                    Change Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={settings.user.changePassword}
                    onChange={(e) => handleInputChange("user", "changePassword", e.target.value)}
                    className={`w-full p-3 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"} ${validationErrors.changePassword ? "border-red-500" : ""}`}
                  />
                  {validationErrors.changePassword && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.changePassword}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Data Management Tab */}
          {activeTab === "data" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <div className="flex items-center mb-4">
                <div className={`p-2 rounded-lg mr-3 ${darkMode ? "bg-red-900/20" : "bg-red-100"}`}>
                  <FiShield className={`text-xl ${darkMode ? "text-red-400" : "text-red-600"}`} />
                </div>
                <h2 className="text-xl font-semibold">Data Management</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={exportData}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed ${darkMode ? "border-blue-500 hover:bg-blue-900/20" : "border-blue-400 hover:bg-blue-50"} transition-colors`}
                >
                  <FiDownload className="text-2xl mb-2 text-blue-500" />
                  <span className="font-medium">Export Data</span>
                  <span className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Download all inventory data</span>
                </button>
                
                <button
                  onClick={importData}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed ${darkMode ? "border-green-500 hover:bg-green-900/20" : "border-green-400 hover:bg-green-50"} transition-colors`}
                >
                  <FiUpload className="text-2xl mb-2 text-green-500" />
                  <span className="font-medium">Import Data</span>
                  <span className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Upload inventory data</span>
                </button>
                
                <button
                  onClick={resetToDefaults}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed ${darkMode ? "border-red-500 hover:bg-red-900/20" : "border-red-400 hover:bg-red-50"} transition-colors`}
                >
                  <FiRefreshCw className="text-2xl mb-2 text-red-500" />
                  <span className="font-medium">Reset Settings</span>
                  <span className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Restore default settings</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* Save Button */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
            className="mt-8 flex justify-end pt-6 border-t border-gray-200 dark:border-gray-700"
          >
            <button
              onClick={saveSettings}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg transition-colors"
            >
              <FiSave className="text-lg" />
              <span>Save All Changes</span>
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ISettings;