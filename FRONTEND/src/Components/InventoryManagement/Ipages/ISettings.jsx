// ISettings.jsx
import React, { useState } from "react";
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
  FiUpload
} from "react-icons/fi";
import { motion } from "framer-motion";

const ISettings = () => {
  const { theme, toggleTheme } = useITheme();
  const darkMode = theme === "dark";
  
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
      name: "Farm Manager",
      email: "manager@greenvalley.com",
      role: "Administrator",
      changePassword: ""
    }
  });

  // Handle input changes
  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // Handle save settings
  const saveSettings = () => {
    // In a real application, this would save to a backend
    console.log("Saving settings:", settings);
    alert("Settings saved successfully!");
  };

  // Handle data export
  const exportData = () => {
    // In a real application, this would export data
    alert("Data export functionality would be implemented here");
  };

  // Handle data import
  const importData = () => {
    // In a real application, this would import data
    alert("Data import functionality would be implemented here");
  };

  // Handle reset to defaults
  const resetToDefaults = () => {
    if (window.confirm("Are you sure you want to reset all settings to default values?")) {
      // Reset logic would go here
      alert("Settings reset to defaults");
    }
  };

  return (
    <div className={`min-h-full p-4 md:p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"}`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">System Settings</h1>
          <p className={`mt-1 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
            Manage your inventory system preferences and configuration
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* General Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
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
                  Farm Name
                </label>
                <input
                  type="text"
                  value={settings.general.farmName}
                  onChange={(e) => handleInputChange("general", "farmName", e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Currency
                </label>
                <select
                  value={settings.general.currency}
                  onChange={(e) => handleInputChange("general", "currency", e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
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
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
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

          {/* Notification Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
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

          {/* Inventory Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
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
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  min="1"
                  value={settings.inventory.lowStockThreshold}
                  onChange={(e) => handleInputChange("inventory", "lowStockThreshold", parseInt(e.target.value))}
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                />
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
                      className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
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

          {/* User Settings */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
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
                  Name
                </label>
                <input
                  type="text"
                  value={settings.user.name}
                  onChange={(e) => handleInputChange("user", "name", e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
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
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Role
                </label>
                <input
                  type="text"
                  value={settings.user.role}
                  disabled
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-500"}`}
                />
              </div>
              
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  Change Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={settings.user.changePassword}
                  onChange={(e) => handleInputChange("user", "changePassword", e.target.value)}
                  className={`w-full p-2 rounded-lg border ${darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                />
              </div>
            </div>
          </motion.div>

          {/* Data Management */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
            className={`rounded-xl p-5 shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
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
        </div>

        {/* Save Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="mt-8 flex justify-end"
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
  );
};

export default ISettings;