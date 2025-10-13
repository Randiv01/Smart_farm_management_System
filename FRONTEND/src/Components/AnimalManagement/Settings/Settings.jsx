import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLoader } from "../contexts/LoaderContext";
import { useUser } from "../contexts/UserContext";
import axios from "axios";
import { FiCheck, FiX, FiCamera, FiTrash2, FiAlertCircle, FiMoon, FiSun } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

// MessagePopup Component
const MessagePopup = ({ type, message, show, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 100 }}
          className="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black/50 backdrop-blur-sm"
        >
          <div
            className={`rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center border-t-4 ${
              type === "success" ? "border-green-500 bg-green-50 dark:bg-green-900/30" : "border-red-500 bg-red-50 dark:bg-red-900/30"
            }`}
          >
            <div className="flex justify-center mb-4">
              {type === "success" ? (
                <FiCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
              ) : (
                <FiAlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
            </div>
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{message}</p>
            <button
              onClick={onClose}
              className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 transition-colors"
            >
              <FiX className="h-4 w-4 mr-2" /> Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Main Settings Component
export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === "dark";
  const { setLoading: setGlobalLoading } = useLoader();
  const { userData: contextUserData, updateUserData, refreshUserData } = useUser();

  const [userData, setUserData] = useState({
    firstName: contextUserData.firstName || "",
    lastName: contextUserData.lastName || "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    dateOfBirth: "",
    bio: "",
    profileImage: contextUserData.profileImage || "",
    role: contextUserData.role || "",
    specialization: "",
    experience: "",
    education: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [activeTab, setActiveTab] = useState("profile");
  const [message, setMessage] = useState({ type: "", text: "", show: false });
  const [validationErrors, setValidationErrors] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [showImageActions, setShowImageActions] = useState(false);

  useEffect(() => {
    document.title = "Settings - Animal Manager";
  }, []);

  const getProfileImageUrl = useCallback((path) => {
    if (!path) return null;
    // The path from the DB is like `/uploads/image.jpg`. We just need to add the server's address.
    const baseUrl = "http://localhost:5000";
    // Remove any previous cache-busting query params before adding a new one
    const cleanPath = path.split("?")[0];
    return `${baseUrl}${cleanPath}`;
  }, []);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => {
      setMessage({ type: "", text: "", show: false });
    }, 3000);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setGlobalLoading(true);
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userDataFromApi = response.data;
        setUserData(userDataFromApi);
        const hasChanged =
          contextUserData.firstName !== userDataFromApi.firstName ||
          contextUserData.lastName !== userDataFromApi.lastName ||
          contextUserData.profileImage !== userDataFromApi.profileImage ||
          contextUserData.role !== userDataFromApi.role;
        if (hasChanged) {
          updateUserData({
            firstName: userDataFromApi.firstName,
            lastName: userDataFromApi.lastName,
            profileImage: userDataFromApi.profileImage,
            role: userDataFromApi.role,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        showMessage("error", "Failed to load user data");
      } finally {
        setGlobalLoading(false);
      }
    };

    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/users/roles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableRoles(response.data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };

    fetchUserData();
    fetchRoles();
  }, [setGlobalLoading, updateUserData, contextUserData, showMessage]);

  const handleUserChange = (field, value) => {
    if (field === "phone") {
      const numericValue = value.replace(/\D/g, "").slice(0, 10);
      setUserData((prev) => ({ ...prev, [field]: numericValue }));
    } else {
      setUserData((prev) => ({ ...prev, [field]: value }));
    }
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const validateProfile = () => {
    const errors = {};
    if (!userData.firstName.trim()) errors.firstName = "First name is required";
    if (!userData.lastName.trim()) errors.lastName = "Last name is required";
    if (userData.phone && !/^\d{10}$/.test(userData.phone)) {
      errors.phone = "Please enter a valid 10-digit phone number";
    }
    if (userData.dateOfBirth) {
      const birthDate = new Date(userData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        errors.dateOfBirth = "You must be at least 18 years old";
      } else if (birthDate > today) {
        errors.dateOfBirth = "Date of birth cannot be in the future";
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = "Current password is required";
    if (!passwordData.newPassword) errors.newPassword = "New password is required";
    if (passwordData.newPassword.length < 8) errors.newPassword = "Password must be at least 8 characters";
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showMessage("error", "Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage("error", "Image size must be less than 5MB");
      return;
    }
    try {
      setGlobalLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profileImage", file);
      const response = await axios.post("http://localhost:5000/api/users/upload-profile-image", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      // Refresh user data from API to get the latest profile image
      await refreshUserData();
      showMessage("success", "Profile image updated successfully");

    } catch (error) {
      console.error("Error uploading image:", error);
      showMessage("error", "Failed to upload image");
    } finally {
      setGlobalLoading(false);
      setShowImageActions(false);
    }
  };

  const handleDeleteImage = async () => {
    try {
      setGlobalLoading(true);
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:5000/api/users/profile-image", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh user data from API to get the latest profile image
      await refreshUserData();
      showMessage("success", "Profile image removed successfully");
    } catch (error) {
      console.error("Error deleting image:", error);
      showMessage("error", "Failed to remove profile image");
    } finally {
      setGlobalLoading(false);
      setShowImageActions(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    try {
      setGlobalLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put("http://localhost:5000/api/users/profile", userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Refresh user data from API to get the latest information
      await refreshUserData();
      
      showMessage("success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      showMessage("error", error.response?.data?.error || "Failed to update profile");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    try {
      setGlobalLoading(true);
      const token = localStorage.getItem("token");
      await axios.put(
        "http://localhost:5000/api/users/change-password",
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showMessage("success", "Password changed successfully!");
    } catch (error) {
      console.error("Error changing password:", error);
      showMessage("error", error.response?.data?.error || "Failed to change password");
    } finally {
      setGlobalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }
    try {
      setGlobalLoading(true);
      const token = localStorage.getItem("token");
      await axios.delete("http://localhost:5000/api/users/account", {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      window.location.href = "/login";
    } catch (error) {
      console.error("Error deleting account:", error);
      showMessage("error", "Failed to delete account");
    } finally {
      setGlobalLoading(false);
    }
  };

  const formatRole = (role) => {
    const roleMap = {
      animal: "Animal Manager",
      plant: "Plant Manager",
      inv: "Inventory Manager",
      emp: "Employee Manager",
      health: "Health Manager",
      owner: "Owner",
      normal: "Normal User",
      admin: "Administrator",
    };
    return roleMap[role] || role;
  };

  return (
    <div className={`min-h-screen p-6 ${darkMode ? "bg-gray-900 text-white" : "light-beige"} font-sans`}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="text-blue-600 dark:text-blue-400">⚙️</span> User Settings
          </h2>

          {/* Message Popup */}
          <MessagePopup
            type={message.type}
            message={message.text}
            show={message.show}
            onClose={() => setMessage({ type: "", text: "", show: false })}
          />

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-3 mb-8 border-b border-gray-200 dark:border-gray-700">
            {["profile", "security", "account"].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-6 py-3 rounded-t-lg text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-blue-600 text-white border-b-2 border-blue-600"
                    : darkMode
                    ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    : "bg-white text-gray-700 hover:bg-gray-200"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </motion.button>
            ))}
          </div>

          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`rounded-2xl shadow-lg p-8 ${darkMode ? "bg-gray-800" : "bg-white"}`}
          >
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="space-y-8">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="text-blue-500">👤</span> Profile Information
                </h3>
                <div className="flex flex-col lg:flex-row gap-8">
                  {/* Profile Image */}
                  <div className="flex-shrink-0 text-center">
                    <div className="relative group">
                      <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-600 mx-auto shadow-md">
                        {userData.profileImage ? (
                          <img
    src={
      // ✅ FIX: This logic is now simpler and more robust
      userData.profileImage 
        ? getProfileImageUrl(userData.profileImage) 
        : "https://via.placeholder.com/150?text=No+Image"
    }
    alt="Profile"
    className="w-full h-full object-cover transition-transform group-hover:scale-105"
  />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <span className="text-5xl font-semibold text-gray-500 dark:text-gray-400">
                              {userData.firstName?.[0] || ""}{userData.lastName?.[0] || ""}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-center mt-4 gap-3">
                        <label
                          className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                          title="Upload a new profile image"
                        >
                          <FiCamera size={16} />
                          Upload
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </label>
                        {userData.profileImage && (
                          <button
                            onClick={handleDeleteImage}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm"
                            title="Remove profile image"
                          >
                            <FiTrash2 size={16} />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {/* Profile Form */}
                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={userData.firstName}
                        onChange={(e) => handleUserChange("firstName", e.target.value)}
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                          validationErrors.firstName
                            ? "border-red-500"
                            : darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="John"
                      />
                      {validationErrors.firstName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={userData.lastName}
                        onChange={(e) => handleUserChange("lastName", e.target.value)}
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                          validationErrors.lastName
                            ? "border-red-500"
                            : darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Doe"
                      />
                      {validationErrors.lastName && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={userData.email}
                        disabled
                        className={`w-full p-3 rounded-lg border ${
                          darkMode ? "bg-gray-600 border-gray-500 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-600"
                        } cursor-not-allowed`}
                        placeholder="john.doe@example.com"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={userData.phone}
                        onChange={(e) => handleUserChange("phone", e.target.value)}
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                          validationErrors.phone
                            ? "border-red-500"
                            : darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="0772500123"
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10 digits only (e.g., 0772500123)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split("T")[0] : ""}
                        onChange={(e) => handleUserChange("dateOfBirth", e.target.value)}
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                          validationErrors.dateOfBirth
                            ? "border-red-500"
                            : darkMode
                            ? "bg-gray-700 border-gray-600 text-white"
                            : "bg-white border-gray-300 text-gray-900"
                        }`}
                      />
                      {validationErrors.dateOfBirth && (
                        <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role</label>
                      <input
                        type="text"
                        value={formatRole(userData.role)}
                        disabled
                        className={`w-full p-3 rounded-lg border ${
                          darkMode ? "bg-gray-600 border-gray-500 text-gray-400" : "bg-gray-100 border-gray-300 text-gray-600"
                        } cursor-not-allowed`}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Role cannot be changed</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                      <input
                        type="text"
                        value={userData.address}
                        onChange={(e) => handleUserChange("address", e.target.value)}
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="123 Farm Lane"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                      <input
                        type="text"
                        value={userData.city}
                        onChange={(e) => handleUserChange("city", e.target.value)}
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Springfield"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Country</label>
                      <input
                        type="text"
                        value={userData.country}
                        onChange={(e) => handleUserChange("country", e.target.value)}
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="United States"
                      />
                    </div>
                    {userData.role === "animal" && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialization</label>
                          <input
                            type="text"
                            value={userData.specialization}
                            onChange={(e) => handleUserChange("specialization", e.target.value)}
                            className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                            }`}
                            placeholder="e.g., Veterinary Medicine"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Experience (years)</label>
                          <input
                            type="number"
                            min="0"
                            value={userData.experience}
                            onChange={(e) => handleUserChange("experience", e.target.value)}
                            className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                              darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                            }`}
                            placeholder="5"
                          />
                        </div>
                      </>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                      <textarea
                        value={userData.bio}
                        onChange={(e) => handleUserChange("bio", e.target.value)}
                        rows="4"
                        className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                          darkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                        }`}
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveProfile}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors flex items-center gap-2"
                  >
                    <FiCheck size={16} />
                    Save Profile
                  </motion.button>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="space-y-8">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="text-blue-500">🔒</span> Security Settings
                </h3>
                <div className="grid grid-cols-1 gap-6 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                        validationErrors.currentPassword
                          ? "border-red-500"
                          : darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                      }`}
                      placeholder="••••••••"
                    />
                    {validationErrors.currentPassword && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.currentPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                        validationErrors.newPassword
                          ? "border-red-500"
                          : darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                        }`}
                      placeholder="••••••••"
                    />
                    {validationErrors.newPassword && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.newPassword}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:ring-2 focus:ring-blue-500 transition-all ${
                        validationErrors.confirmPassword
                          ? "border-red-500"
                          : darkMode
                          ? "bg-gray-700 border-gray-600 text-white"
                          : "bg-white border-gray-300 text-gray-900"
                        }`}
                      placeholder="••••••••"
                    />
                    {validationErrors.confirmPassword && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                    )}
                  </div>
                  <div className="flex justify-end mt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleChangePassword}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors flex items-center gap-2"
                    >
                      <FiCheck size={16} />
                      Change Password
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-8">
                <h3 className="text-2xl font-semibold flex items-center gap-2">
                  <span className="text-blue-500">⚙️</span> Account Management
                </h3>
                <div className="space-y-6">
                  <div className={`p-6 rounded-xl shadow-md border-l-4 border-yellow-500 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <span className="text-yellow-500">📥</span> Download Your Data
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Export a copy of your personal data for your records.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg shadow-md transition-colors flex items-center gap-2"
                    >
                      <span className="text-sm">📥</span> Download Data
                    </motion.button>
                  </div>
                  <div className={`p-6 rounded-xl shadow-md border-l-4 border-red-500 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                      <span className="text-red-500">🗑️</span> Delete Account
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteAccount}
                      className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-md transition-colors flex items-center gap-2"
                    >
                      <FiTrash2 size={16} />
                      Delete Account
                    </motion.button>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Theme</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={toggleTheme}
                  className={`relative inline-flex items-center h-7 rounded-full w-12 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? "bg-blue-600" : "bg-gray-300"
                  }`}
                  aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
                >
                  <span
                    className={`inline-block w-5 h-5 transform bg-white rounded-full transition-transform ${
                      darkMode ? "translate-x-6" : "translate-x-1"
                    } flex items-center justify-center`}
                  >
                    {darkMode ? (
                      <FiMoon className="text-blue-600" size={12} />
                    ) : (
                      <FiSun className="text-yellow-500" size={12} />
                    )}
                  </span>
                </motion.button>
                <span className="text-sm text-gray-600 dark:text-gray-400">{darkMode ? "Dark" : "Light"} Mode</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}