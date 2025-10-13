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
  FiCamera,
  FiHelpCircle,
  FiInfo,
  FiEye,
  FiEyeOff,
  FiChevronRight,
  FiSettings,
  FiMail,
  FiLock
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import io from 'socket.io-client';

// Enhanced MessagePopup Component
const MessagePopup = ({ type, message, show, onClose, darkMode }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.3 }}
          className="fixed top-4 right-4 z-50 max-w-sm"
        >
          <div
            className={`rounded-lg shadow-lg p-4 flex items-start space-x-3 ${
              type === "success"
                ? darkMode ? "bg-green-900 border border-green-700" : "bg-green-50 border border-green-200"
                : type === "error"
                ? darkMode ? "bg-red-900 border border-red-700" : "bg-red-50 border border-red-200"
                : darkMode ? "bg-blue-900 border border-blue-700" : "bg-blue-50 border border-blue-200"
            }`}
          >
            <div className={`flex-shrink-0 rounded-full p-1 ${
              type === "success" 
                ? darkMode ? "bg-green-800 text-green-300" : "bg-green-100 text-green-600"
                : type === "error" 
                ? darkMode ? "bg-red-800 text-red-300" : "bg-red-100 text-red-600"
                : darkMode ? "bg-blue-800 text-blue-300" : "bg-blue-100 text-blue-600"
            }`}>
              {type === "success" ? (
                <FiCheck className="h-4 w-4" />
              ) : type === "error" ? (
                <FiAlertCircle className="h-4 w-4" />
              ) : (
                <FiInfo className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{message}</p>
            </div>
            <button
              onClick={onClose}
              className={`flex-shrink-0 ${darkMode ? "text-gray-300 hover:text-white" : "text-gray-400 hover:text-gray-600"}`}
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Help Tooltip Component
const HelpTooltip = ({ content, darkMode }) => {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className={`${darkMode ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"} ml-1`}
      >
        <FiHelpCircle size={14} />
      </button>
      {show && (
        <div className={`absolute z-10 w-48 p-2 text-sm ${
          darkMode ? "text-gray-300 bg-gray-800 border-gray-700" : "text-gray-600 bg-white border-gray-200"
        } border rounded-lg shadow-lg -left-2 top-6`}>
          {content}
        </div>
      )}
    </div>
  );
};

// Section Header Component
const SectionHeader = ({ icon: Icon, title, description, darkMode }) => (
  <div className="mb-6">
    <div className="flex items-center mb-2">
      <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
        darkMode ? "bg-blue-900 text-blue-300" : "bg-blue-100 text-blue-600"
      } mr-3`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h2>
    </div>
    {description && (
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"} ml-13`}>{description}</p>
    )}
  </div>
);

// Toggle Switch Component
const ToggleSwitch = ({ enabled, onChange, label, description, darkMode }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex flex-col">
      <span className={`text-sm font-medium ${darkMode ? "text-white" : "text-gray-900"}`}>{label}</span>
      {description && (
        <span className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>{description}</span>
      )}
    </div>
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
        enabled ? 'bg-blue-600' : darkMode ? 'bg-gray-600' : 'bg-gray-200'
      }`}
      onClick={() => onChange(!enabled)}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full ${
          darkMode ? 'bg-gray-300' : 'bg-white'
        } shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

// Input Field Component
const InputField = ({ label, type = "text", value, onChange, error, helpText, required, darkMode, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <label className={`flex items-center text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {helpText && <HelpTooltip content={helpText} darkMode={darkMode} />}
      </label>
      <div className="relative">
        <input
          type={type === "password" && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
            error 
              ? 'border-red-300' 
              : darkMode 
                ? 'border-gray-600 bg-gray-700 text-white' 
                : 'border-gray-300'
          } ${type === "password" ? 'pr-10' : ''} ${
            darkMode && !error ? 'bg-gray-700 text-white' : ''
          }`}
          {...props}
        />
        {type === "password" && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FiEyeOff size={16} className={darkMode ? "text-gray-400" : ""} /> : <FiEye size={16} className={darkMode ? "text-gray-400" : ""} />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {helpText && !error && <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{helpText}</p>}
    </div>
  );
};

// Card Component
const Card = ({ children, className = "", darkMode }) => (
  <div className={`rounded-xl shadow-sm border p-6 ${
    darkMode 
      ? "bg-gray-800 border-gray-700 text-white" 
      : "bg-white border-gray-200"
  } ${className}`}>
    {children}
  </div>
);

const ISettings = () => {
  const { theme, toggleTheme } = useITheme();
  const darkMode = theme === "dark";
  const [socket, setSocket] = useState(null);
  
  // State for all settings
  const [settings, setSettings] = useState({
    general: {
      farmName: "Mount Olive",
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
  const [isSaving, setIsSaving] = useState(false);

  // Tab configurations
  const tabs = [
    { id: "general", label: "General", icon: FiGlobe, description: "Basic system settings" },
    { id: "notifications", label: "Notifications", icon: FiBell, description: "Alert preferences" },
    { id: "inventory", label: "Inventory", icon: FiDatabase, description: "Stock management" },
    { id: "user", label: "Account", icon: FiUser, description: "Profile settings" },
    { id: "data", label: "Data", icon: FiShield, description: "Backup & security" },
  ];

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
    }, 4000);
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
    
    if (!settings.general.farmName.trim()) {
      errors.farmName = "Farm name is required";
    }
    
    if (settings.inventory.lowStockThreshold < 1) {
      errors.lowStockThreshold = "Low stock threshold must be at least 1";
    }
    
    if (settings.inventory.lowStockThreshold > 1000) {
      errors.lowStockThreshold = "Threshold seems too high";
    }
    
    if (settings.user.changePassword && settings.user.changePassword.length < 8) {
      errors.changePassword = "Password must be at least 8 characters";
    }
    
    if (settings.user.changePassword && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(settings.user.changePassword)) {
      errors.changePassword = "Password must contain uppercase, lowercase, and numbers";
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
      showMessage("error", "Please select an image file (JPEG, PNG, etc.)");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
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
      
      handleInputChange("user", "profileImage", response.data.imageUrl);
      localStorage.setItem("profileImage", response.data.imageUrl);
      
      if (socket) {
        socket.emit('userProfileUpdated', {
          firstName: settings.user.firstName,
          lastName: settings.user.lastName,
          profileImage: response.data.imageUrl
        });
      }
      
      showMessage("success", "Profile image updated successfully! 🎉");
    } catch (error) {
      console.error("Error uploading image:", error);
      showMessage("error", "Failed to upload image. Please try again.");
    }
  };

  // Handle save settings
  const saveSettings = async () => {
    if (!validateSettings()) {
      showMessage("error", "Please fix the errors before saving");
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update localStorage
      localStorage.setItem("firstName", settings.user.firstName);
      localStorage.setItem("lastName", settings.user.lastName);
      localStorage.setItem("name", `${settings.user.firstName} ${settings.user.lastName}`);
      localStorage.setItem("email", settings.user.email);
      
      if (socket) {
        socket.emit('userProfileUpdated', {
          firstName: settings.user.firstName,
          lastName: settings.user.lastName,
          profileImage: settings.user.profileImage
        });
      }
      
      showMessage("success", "Settings saved successfully! ✅");
    } catch (error) {
      console.error("Error saving settings:", error);
      showMessage("error", "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle data export
  const exportData = () => {
    showMessage("success", "Export started! You'll receive an email when it's ready.");
  };

  // Handle data import
  const importData = () => {
    showMessage("info", "Please select a CSV or JSON file to import your data.");
  };

  // Handle reset to defaults
  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all settings to default values? This cannot be undone.")) {
      showMessage("success", "Settings have been reset to defaults");
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
      "normal": "User",
      "admin": "Administrator"
    };
    
    return roleMap[role] || role;
  };

  return (
    <div className={`min-h-full p-6 ${darkMode ? "bg-dark-bg text-dark-text" : "bg-light-beige text-gray-900"}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg ${
              darkMode ? "bg-blue-900" : "bg-blue-100"
            }`}>
              <FiSettings className={`text-xl ${
                darkMode ? "text-blue-300" : "text-blue-600"
              }`} />
            </div>
            <div>
              <h1 className={`text-2xl md:text-3xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}>Settings</h1>
              <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
                Manage your inventory system preferences
              </p>
            </div>
          </div>
        </div>

        {/* Message Popup */}
        <MessagePopup 
          type={message.type} 
          message={message.text} 
          show={message.show} 
          onClose={() => setMessage({ type: "", text: "", show: false })}
          darkMode={darkMode}
        />

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <Card darkMode={darkMode}>
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      activeTab === tab.id
                        ? darkMode 
                          ? 'bg-blue-900 text-blue-300 border border-blue-700' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                        : darkMode
                          ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <tab.icon className="mr-3 h-4 w-4" />
                    <span className="flex-1 text-left">{tab.label}</span>
                    <FiChevronRight className="h-4 w-4" />
                  </button>
                ))}
              </nav>
            </Card>

            {/* Quick Actions */}
            <Card darkMode={darkMode} className="mt-4">
              <h3 className={`font-medium ${darkMode ? "text-white" : "text-gray-900"} mb-3`}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={saveSettings}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  <FiSave className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={resetToDefaults}
                  className={`w-full flex items-center justify-center px-3 py-2 rounded-lg transition-colors ${
                    darkMode
                      ? "text-gray-300 border border-gray-600 hover:bg-gray-700"
                      : "text-gray-600 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <FiRefreshCw className="mr-2 h-4 w-4" />
                  Reset Defaults
                </button>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <Card darkMode={darkMode}>
              {/* General Settings */}
              {activeTab === "general" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionHeader
                    icon={FiGlobe}
                    title="General Settings"
                    description="Basic system configuration and preferences"
                    darkMode={darkMode}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Farm Name"
                      value={settings.general.farmName}
                      onChange={(e) => handleInputChange("general", "farmName", e.target.value)}
                      error={validationErrors.farmName}
                      required
                      helpText="Your farm or business name as it will appear throughout the system"
                      darkMode={darkMode}
                    />
                    
                    <div className="space-y-2">
                      <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Currency
                      </label>
                      <select
                        value={settings.general.currency}
                        onChange={(e) => handleInputChange("general", "currency", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode 
                            ? "bg-gray-700 border-gray-600 text-white" 
                            : "border-gray-300"
                        }`}
                      >
                        <option value="USD">US Dollar ($)</option>
                        <option value="EUR">Euro (€)</option>
                        <option value="GBP">British Pound (£)</option>
                        <option value="JPY">Japanese Yen (¥)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Language
                      </label>
                      <select
                        value={settings.general.language}
                        onChange={(e) => handleInputChange("general", "language", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          darkMode 
                            ? "bg-gray-700 border-gray-600 text-white" 
                            : "border-gray-300"
                        }`}
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Sinhala</option>
                        <option value="French">Tamil</option>
                      </select>
                    </div>
                    
                    <div className="space-y-4">
                      <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Theme Preference
                      </label>
                      <div className={`flex items-center justify-between p-3 rounded-lg border ${
                        darkMode ? "border-gray-600" : "border-gray-200"
                      }`}>
                        <span className={darkMode ? "text-gray-300" : "text-gray-700"}>Dark Mode</span>
                        <button
                          onClick={toggleTheme}
                          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            darkMode ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full ${
                              darkMode ? 'bg-gray-300' : 'bg-white'
                            } shadow ring-0 transition duration-200 ease-in-out ${
                              darkMode ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Notification Settings */}
              {activeTab === "notifications" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionHeader
                    icon={FiBell}
                    title="Notification Preferences"
                    description="Choose how and when you want to receive alerts"
                    darkMode={darkMode}
                  />
                  
                  <div className="space-y-1">
                    <ToggleSwitch
                      enabled={settings.notifications.lowStock}
                      onChange={(value) => handleInputChange("notifications", "lowStock", value)}
                      label="Low Stock Alerts"
                      description="Get notified when product quantities are running low"
                      darkMode={darkMode}
                    />
                    
                    <ToggleSwitch
                      enabled={settings.notifications.expiryAlerts}
                      onChange={(value) => handleInputChange("notifications", "expiryAlerts", value)}
                      label="Expiry Alerts"
                      description="Receive warnings about products nearing expiration"
                      darkMode={darkMode}
                    />
                    
                    <ToggleSwitch
                      enabled={settings.notifications.salesReport}
                      onChange={(value) => handleInputChange("notifications", "salesReport", value)}
                      label="Daily Sales Reports"
                      description="Get summary emails of daily sales performance"
                      darkMode={darkMode}
                    />
                    
                    <ToggleSwitch
                      enabled={settings.notifications.emailNotifications}
                      onChange={(value) => handleInputChange("notifications", "emailNotifications", value)}
                      label="Email Notifications"
                      description="Receive important updates via email"
                      darkMode={darkMode}
                    />
                    
                    <ToggleSwitch
                      enabled={settings.notifications.pushNotifications}
                      onChange={(value) => handleInputChange("notifications", "pushNotifications", value)}
                      label="Browser Notifications"
                      description="Show pop-up notifications in your browser"
                      darkMode={darkMode}
                    />
                  </div>
                </motion.div>
              )}

              {/* Inventory Settings */}
              {activeTab === "inventory" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionHeader
                    icon={FiDatabase}
                    title="Inventory Management"
                    description="Configure stock tracking and category settings"
                    darkMode={darkMode}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="Low Stock Threshold"
                      type="number"
                      min="1"
                      max="1000"
                      value={settings.inventory.lowStockThreshold}
                      onChange={(e) => handleInputChange("inventory", "lowStockThreshold", parseInt(e.target.value))}
                      error={validationErrors.lowStockThreshold}
                      helpText="Alert when product quantity falls below this number"
                      darkMode={darkMode}
                    />
                    
                    <div className="space-y-4">
                      <ToggleSwitch
                        enabled={settings.inventory.autoBackup}
                        onChange={(value) => handleInputChange("inventory", "autoBackup", value)}
                        label="Automatic Backups"
                        description="Regularly backup your inventory data"
                        darkMode={darkMode}
                      />
                      
                      {settings.inventory.autoBackup && (
                        <div className="space-y-2">
                          <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                            Backup Frequency
                          </label>
                          <select
                            value={settings.inventory.backupFrequency}
                            onChange={(e) => handleInputChange("inventory", "backupFrequency", e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              darkMode 
                                ? "bg-gray-700 border-gray-600 text-white" 
                                : "border-gray-300"
                            }`}
                          >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className={`mt-6 pt-6 border-t ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <h3 className={`text-lg font-medium ${darkMode ? "text-white" : "text-gray-900"} mb-4`}>
                      Product Categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {settings.inventory.categoryManagement.map((category, index) => (
                        <span key={index} className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                          darkMode 
                            ? "bg-blue-900 text-blue-300" 
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {category}
                        </span>
                      ))}
                      <button className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        darkMode
                          ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}>
                        + Add Category
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* User Settings */}
              {activeTab === "user" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionHeader
                    icon={FiUser}
                    title="Account Settings"
                    description="Manage your profile information and security"
                    darkMode={darkMode}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField
                      label="First Name"
                      value={settings.user.firstName}
                      onChange={(e) => handleInputChange("user", "firstName", e.target.value)}
                      helpText="Your first name as it will appear to other users"
                      darkMode={darkMode}
                    />
                    
                    <InputField
                      label="Last Name"
                      value={settings.user.lastName}
                      onChange={(e) => handleInputChange("user", "lastName", e.target.value)}
                      darkMode={darkMode}
                    />
                    
                    <InputField
                      label="Email Address"
                      type="email"
                      value={settings.user.email}
                      onChange={(e) => handleInputChange("user", "email", e.target.value)}
                      helpText="We'll send important notifications to this address"
                      darkMode={darkMode}
                    />
                    
                    <div className="space-y-2">
                      <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                        Account Role
                      </label>
                      <div className={`px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? "bg-gray-700 border-gray-600" 
                          : "bg-gray-50 border-gray-200"
                      }`}>
                        <span className={darkMode ? "text-gray-300" : "text-gray-700"}>
                          {formatRole(settings.user.role)}
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                        Contact administrator to change role
                      </p>
                    </div>
                    
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className={`text-sm font-medium ${darkMode ? "text-gray-300" : "text-gray-700"} mb-2 block`}>
                          Profile Picture
                        </label>
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center overflow-hidden ${
                              darkMode 
                                ? "bg-gradient-to-br from-blue-900 to-purple-900" 
                                : "bg-gradient-to-br from-blue-100 to-purple-100"
                            }`}>
                              {settings.user.profileImage ? (
                                <img 
                                  src={settings.user.profileImage} 
                                  alt="Profile" 
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FiUser size={24} className={darkMode ? "text-gray-400" : "text-gray-400"} />
                              )}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 rounded-full p-1 shadow-sm ${
                              darkMode ? "bg-gray-700" : "bg-white"
                            }`}>
                              <FiCamera size={12} className={darkMode ? "text-gray-400" : "text-gray-600"} />
                            </div>
                          </div>
                          <div>
                            <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2">
                              <FiCamera size={14} />
                              <span>Change Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                            </label>
                            <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"} mt-1`}>
                              JPG, PNG or GIF, max 5MB
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <InputField
                        label="New Password"
                        type="password"
                        value={settings.user.changePassword}
                        onChange={(e) => handleInputChange("user", "changePassword", e.target.value)}
                        error={validationErrors.changePassword}
                        helpText="Leave blank to keep current password"
                        darkMode={darkMode}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Data Management */}
              {activeTab === "data" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <SectionHeader
                    icon={FiShield}
                    title="Data Management"
                    description="Backup, restore, and manage your system data"
                    darkMode={darkMode}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                      onClick={exportData}
                      className={`flex flex-col items-center text-center p-6 border-2 border-dashed rounded-xl transition-all group ${
                        darkMode
                          ? "border-blue-700 hover:border-blue-500 hover:bg-blue-900/20"
                          : "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                        darkMode
                          ? "bg-blue-800 group-hover:bg-blue-700"
                          : "bg-blue-100 group-hover:bg-blue-200"
                      }`}>
                        <FiDownload className={`text-xl ${
                          darkMode ? "text-blue-300" : "text-blue-600"
                        }`} />
                      </div>
                      <h3 className={`font-semibold mb-1 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}>Export Data</h3>
                      <p className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}>Download all your inventory data as CSV</p>
                    </button>
                    
                    <button
                      onClick={importData}
                      className={`flex flex-col items-center text-center p-6 border-2 border-dashed rounded-xl transition-all group ${
                        darkMode
                          ? "border-green-700 hover:border-green-500 hover:bg-green-900/20"
                          : "border-green-200 hover:border-green-300 hover:bg-green-50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                        darkMode
                          ? "bg-green-800 group-hover:bg-green-700"
                          : "bg-green-100 group-hover:bg-green-200"
                      }`}>
                        <FiUpload className={`text-xl ${
                          darkMode ? "text-green-300" : "text-green-600"
                        }`} />
                      </div>
                      <h3 className={`font-semibold mb-1 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}>Import Data</h3>
                      <p className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}>Upload and restore from backup files</p>
                    </button>
                    
                    <button
                      onClick={resetToDefaults}
                      className={`flex flex-col items-center text-center p-6 border-2 border-dashed rounded-xl transition-all group ${
                        darkMode
                          ? "border-gray-600 hover:border-gray-400 hover:bg-gray-700"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 transition-colors ${
                        darkMode
                          ? "bg-gray-700 group-hover:bg-gray-600"
                          : "bg-gray-100 group-hover:bg-gray-200"
                      }`}>
                        <FiRefreshCw className={`text-xl ${
                          darkMode ? "text-gray-300" : "text-gray-600"
                        }`} />
                      </div>
                      <h3 className={`font-semibold mb-1 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}>Reset Settings</h3>
                      <p className={`text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}>Restore all settings to default values</p>
                    </button>
                  </div>
                  
                  <div className={`mt-6 p-4 rounded-lg border ${
                    darkMode 
                      ? "bg-yellow-900/20 border-yellow-800" 
                      : "bg-yellow-50 border-yellow-200"
                  }`}>
                    <div className="flex">
                      <FiAlertCircle className={`mt-0.5 mr-3 flex-shrink-0 ${
                        darkMode ? "text-yellow-400" : "text-yellow-600"
                      }`} />
                      <div>
                        <h4 className={`text-sm font-medium ${
                          darkMode ? "text-yellow-300" : "text-yellow-800"
                        }`}>Important Notice</h4>
                        <p className={`text-sm mt-1 ${
                          darkMode ? "text-yellow-200" : "text-yellow-700"
                        }`}>
                          Data management actions cannot be undone. Please ensure you have backups before proceeding.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ISettings;