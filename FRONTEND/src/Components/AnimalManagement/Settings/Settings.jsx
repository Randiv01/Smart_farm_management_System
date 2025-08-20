import React, { useState, useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLoader } from "../contexts/LoaderContext";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();

  // Profile & Account
  const [profileData, setProfileData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+1234567890",
    address: "123 Farm St, Countryside",
    profileImage: "",
    bio: "Farm manager with 10+ years of experience",
    dateOfBirth: "1985-05-15"
  });

  // Security
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,
    securityQuestions: [
      { question: "What was your first pet's name?", answer: "" },
      { question: "What city were you born in?", answer: "" }
    ]
  });

  // Farm & Business Settings
  const [farmSettings, setFarmSettings] = useState({
    farmName: "Green Valley Farm",
    defaultUnit: "m²",
    defaultZone: "Zone A",
    defaultAnimalType: "Cattle",
    businessType: "Dairy",
    establishedYear: "2010",
    employeesCount: "15"
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emergencyEmail: "alert@example.com",
    emergencyPhone: "+94769285819",
    enableSMS: true,
    enableEmail: true,
    enablePush: true,
    healthAlerts: true,
    feedingReminders: true,
    breedingAlerts: false,
    vaccinationReminders: true
  });

  // App Preferences
  const [appPreferences, setAppPreferences] = useState({
    dashboardLayout: "grid",
    appLanguage: "English",
    autoBackup: true,
    backupFrequency: "weekly",
    dataRetention: "1year",
    syncFrequency: "daily"
  });

  // Privacy Settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "private",
    activityTracking: true,
    dataSharing: false,
    personalizedAds: false,
    searchVisibility: false
  });

  // Advanced Settings
  const [advancedSettings, setAdvancedSettings] = useState({
    apiAccess: false,
    apiKey: "",
    dataExportFormat: "CSV",
    autoUpdate: true,
    debugMode: false,
    cacheSize: "500"
  });

  // Active tab state
  const [activeTab, setActiveTab] = useState("profile");

  // Handle profile data changes
  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  // Handle security data changes
  const handleSecurityChange = (field, value) => {
    setSecurityData(prev => ({ ...prev, [field]: value }));
  };

  // Handle security question changes
  const handleSecurityQuestionChange = (index, value) => {
    const updatedQuestions = [...securityData.securityQuestions];
    updatedQuestions[index].answer = value;
    setSecurityData(prev => ({ ...prev, securityQuestions: updatedQuestions }));
  };

  // Handle farm settings changes
  const handleFarmSettingChange = (field, value) => {
    setFarmSettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle notification settings changes
  const handleNotificationChange = (field, value) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle app preferences changes
  const handleAppPreferenceChange = (field, value) => {
    setAppPreferences(prev => ({ ...prev, [field]: value }));
  };

  // Handle privacy settings changes
  const handlePrivacyChange = (field, value) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle advanced settings changes
  const handleAdvancedChange = (field, value) => {
    setAdvancedSettings(prev => ({ ...prev, [field]: value }));
  };

  // Handle profile image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({ ...prev, profileImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle save settings
  const handleSaveSettings = async () => {
    try {
      setGlobalLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert("✅ Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("❌ Failed to save settings.");
    } finally {
      setGlobalLoading(false);
    }
  };

  // Handle reset to defaults
  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset all settings to default values?")) {
      // Reset logic would go here
      alert("Settings have been reset to defaults.");
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-100"} p-4 md:p-6`}>
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-white">Admin Settings</h2>
        
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["profile", "security", "farm", "notifications", "preferences", "privacy", "advanced"].map(tab => (
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
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Profile Information</h3>
              
              <div className="flex flex-col md:flex-row gap-6">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-600">
                      {profileData.profileImage ? (
                        <img src={profileData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                          <i className="fas fa-user text-4xl text-gray-500 dark:text-gray-400"></i>
                        </div>
                      )}
                    </div>
                    <label htmlFor="profileImage" className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer">
                      <i className="fas fa-camera"></i>
                      <input
                        id="profileImage"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>
                
                {/* Profile Form */}
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange("firstName", e.target.value)}
                      className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange("lastName", e.target.value)}
                      className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange("email", e.target.value)}
                      className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange("phone", e.target.value)}
                      className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                      }`}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                    <input
                      type="text"
                      value={profileData.address}
                      onChange={(e) => handleProfileChange("address", e.target.value)}
                      className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                      }`}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={profileData.dateOfBirth}
                      onChange={(e) => handleProfileChange("dateOfBirth", e.target.value)}
                      className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                      }`}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                    <textarea
                      value={profileData.bio}
                      onChange={(e) => handleProfileChange("bio", e.target.value)}
                      rows={3}
                      className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                        darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Security Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Change Password</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                      <input
                        type="password"
                        value={securityData.currentPassword}
                        onChange={(e) => handleSecurityChange("currentPassword", e.target.value)}
                        className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                      <input
                        type="password"
                        value={securityData.newPassword}
                        onChange={(e) => handleSecurityChange("newPassword", e.target.value)}
                        className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                        }`}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                      <input
                        type="password"
                        value={securityData.confirmPassword}
                        onChange={(e) => handleSecurityChange("confirmPassword", e.target.value)}
                        className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                        }`}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Add an extra layer of security to your account</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={securityData.twoFactorEnabled}
                        onChange={(e) => handleSecurityChange("twoFactorEnabled", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Security Questions</h4>
                  <div className="space-y-4">
                    {securityData.securityQuestions.map((q, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{q.question}</label>
                        <input
                          type="text"
                          value={q.answer}
                          onChange={(e) => handleSecurityQuestionChange(index, e.target.value)}
                          className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                            darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Farm Tab */}
          {activeTab === "farm" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Farm & Business Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Farm Name</label>
                  <input
                    type="text"
                    value={farmSettings.farmName}
                    onChange={(e) => handleFarmSettingChange("farmName", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Type</label>
                  <select
                    value={farmSettings.businessType}
                    onChange={(e) => handleFarmSettingChange("businessType", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  >
                    <option>Dairy</option>
                    <option>Meat Production</option>
                    <option>Poultry</option>
                    <option>Mixed Farming</option>
                    <option>Organic</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Unit</label>
                  <select
                    value={farmSettings.defaultUnit}
                    onChange={(e) => handleFarmSettingChange("defaultUnit", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  >
                    <option>m²</option>
                    <option>acres</option>
                    <option>hectares</option>
                    <option>km²</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Zone</label>
                  <input
                    type="text"
                    value={farmSettings.defaultZone}
                    onChange={(e) => handleFarmSettingChange("defaultZone", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Animal Type</label>
                  <input
                    type="text"
                    value={farmSettings.defaultAnimalType}
                    onChange={(e) => handleFarmSettingChange("defaultAnimalType", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year Established</label>
                  <input
                    type="number"
                    value={farmSettings.establishedYear}
                    onChange={(e) => handleFarmSettingChange("establishedYear", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Number of Employees</label>
                  <input
                    type="number"
                    value={farmSettings.employeesCount}
                    onChange={(e) => handleFarmSettingChange("employeesCount", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Notification Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Email</label>
                  <input
                    type="email"
                    value={notificationSettings.emergencyEmail}
                    onChange={(e) => handleNotificationChange("emergencyEmail", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={notificationSettings.emergencyPhone}
                    onChange={(e) => handleNotificationChange("emergencyPhone", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Notification Methods</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Email Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive important updates via email</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.enableEmail}
                          onChange={(e) => handleNotificationChange("enableEmail", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">SMS Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive text message alerts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.enableSMS}
                          onChange={(e) => handleNotificationChange("enableSMS", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Push Notifications</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Receive app notifications</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.enablePush}
                          onChange={(e) => handleNotificationChange("enablePush", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Notification Types</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Health Alerts</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Get notified about animal health issues</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.healthAlerts}
                          onChange={(e) => handleNotificationChange("healthAlerts", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Feeding Reminders</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reminders for feeding schedules</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.feedingReminders}
                          onChange={(e) => handleNotificationChange("feedingReminders", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Breeding Alerts</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Notifications about breeding cycles</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.breedingAlerts}
                          onChange={(e) => handleNotificationChange("breedingAlerts", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-gray-800 dark:text-white">Vaccination Reminders</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Reminders for vaccination schedules</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={notificationSettings.vaccinationReminders}
                          onChange={(e) => handleNotificationChange("vaccinationReminders", e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">App Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dashboard Layout</label>
                  <select
                    value={appPreferences.dashboardLayout}
                    onChange={(e) => handleAppPreferenceChange("dashboardLayout", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  >
                    <option value="grid">Grid View</option>
                    <option value="list">List View</option>
                    <option value="compact">Compact View</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Language</label>
                  <select
                    value={appPreferences.appLanguage}
                    onChange={(e) => handleAppPreferenceChange("appLanguage", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  >
                    <option>English</option>
                    <option>Sinhala</option>
                    <option>Tamil</option>
                    <option>Spanish</option>
                    <option>French</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Backup Frequency</label>
                  <select
                    value={appPreferences.backupFrequency}
                    onChange={(e) => handleAppPreferenceChange("backupFrequency", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Retention</label>
                  <select
                    value={appPreferences.dataRetention}
                    onChange={(e) => handleAppPreferenceChange("dataRetention", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  >
                    <option value="3months">3 Months</option>
                    <option value="6months">6 Months</option>
                    <option value="1year">1 Year</option>
                    <option value="2years">2 Years</option>
                    <option value="forever">Forever</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sync Frequency</label>
                  <select
                    value={appPreferences.syncFrequency}
                    onChange={(e) => handleAppPreferenceChange("syncFrequency", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  >
                    <option value="realtime">Real-time</option>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white">Auto Backup</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Automatically backup your data</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appPreferences.autoBackup}
                        onChange={(e) => handleAppPreferenceChange("autoBackup", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <h4 className="text-lg font-medium text-gray-800 dark:text-white">Auto Update</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Automatically update the application</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={appPreferences.autoUpdate}
                        onChange={(e) => handleAppPreferenceChange("autoUpdate", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Privacy Settings</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Visibility</label>
                  <select
                    value={privacySettings.profileVisibility}
                    onChange={(e) => handlePrivacyChange("profileVisibility", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  >
                    <option value="public">Public</option>
                    <option value="contacts">Contacts Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Activity Tracking</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Allow us to track your activity to improve our services</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.activityTracking}
                        onChange={(e) => handlePrivacyChange("activityTracking", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Data Sharing</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Allow anonymous data sharing for research purposes</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.dataSharing}
                        onChange={(e) => handlePrivacyChange("dataSharing", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Personalized Ads</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">See ads that are more relevant to you</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.personalizedAds}
                        onChange={(e) => handlePrivacyChange("personalizedAds", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">Search Visibility</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Allow your profile to appear in search results</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={privacySettings.searchVisibility}
                        onChange={(e) => handlePrivacyChange("searchVisibility", e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Data Download</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    You can download a copy of your data to keep for your records or to transfer to another service.
                  </p>
                  <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                    <i className="fas fa-download mr-2"></i>Download My Data
                  </button>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Account Deletion</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    <i className="fas fa-trash mr-2"></i>Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Tab */}
          {activeTab === "advanced" && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Advanced Settings</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">API Access</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enable access to the application API</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advancedSettings.apiAccess}
                      onChange={(e) => handleAdvancedChange("apiAccess", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                {advancedSettings.apiAccess && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">API Key</label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={advancedSettings.apiKey}
                        onChange={(e) => handleAdvancedChange("apiKey", e.target.value)}
                        className={`flex-grow rounded-lg border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                          darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                        }`}
                        placeholder="Generate an API key"
                      />
                      <button className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        Generate
                      </button>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data Export Format</label>
                  <select
                    value={advancedSettings.dataExportFormat}
                    onChange={(e) => handleAdvancedChange("dataExportFormat", e.target.value)}
                    className={`w-full rounded-lg border-gray-300 shadow-sm ${
                      darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-800"
                    }`}
                  >
                    <option value="CSV">CSV</option>
                    <option value="JSON">JSON</option>
                    <option value="XML">XML</option>
                    <option value="PDF">PDF</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cache Size (MB)</label>
                  <input
                    type="range"
                    min="100"
                    max="1000"
                    step="100"
                    value={advancedSettings.cacheSize}
                    onChange={(e) => handleAdvancedChange("cacheSize", e.target.value)}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-right">{advancedSettings.cacheSize} MB</div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="font-medium text-gray-800 dark:text-white">Debug Mode</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Enable detailed logging for troubleshooting</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={advancedSettings.debugMode}
                      onChange={(e) => handleAdvancedChange("debugMode", e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Reset All Settings</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    This will reset all your settings to their default values. This action cannot be undone.
                  </p>
                  <button 
                    onClick={handleResetDefaults}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                  >
                    <i className="fas fa-undo mr-2"></i>Reset to Defaults
                  </button>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-3 text-gray-800 dark:text-white">Clear Cache</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Clear all cached data to free up space. This may slow down the app temporarily.
                  </p>
                  <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                    <i className="fas fa-broom mr-2"></i>Clear Cache
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="mr-3 text-sm text-gray-600 dark:text-gray-400">Theme</span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                  darkMode ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {darkMode ? 'Dark' : 'Light'}
              </span>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => {}}
                className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}