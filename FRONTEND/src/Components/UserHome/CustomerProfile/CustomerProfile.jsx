// src/Components/UserHome/CustomerProfile/CustomerProfile.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../UHContext/UHAuthContext";
import { useTheme } from "../UHContext/UHThemeContext";
import Footer from "../UHFooter/UHFooter";
import {
  User,
  Mail,
  Phone,
  FileText,
  Save,
  Loader,
  Upload,
  Trash2,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Lock,
  Eye,
  EyeOff,
  Building,
  Globe,
  Camera,
  Shield,
  Settings,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Star,
  Award,
  Edit3
} from "lucide-react";

const CustomerProfile = () => {
  const { user, updateUser } = useAuth();
  const { darkMode } = useTheme();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    dateOfBirth: "",
    bio: "",
    specialization: "",
    experience: "",
    education: "",
    profileImage: "",
    role: ""
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.token) {
        setLoading(false);
        return;
      }

      try {
        const res = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        setProfile({
          firstName: res.data.firstName || "",
          lastName: res.data.lastName || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
          address: res.data.address || "",
          city: res.data.city || "",
          country: res.data.country || "",
          dateOfBirth: res.data.dateOfBirth ? new Date(res.data.dateOfBirth).toISOString().split('T')[0] : "",
          bio: res.data.bio || "",
          specialization: res.data.specialization || "",
          experience: res.data.experience || "",
          education: res.data.education || "",
          profileImage: res.data.profileImage || "",
          role: res.data.role || ""
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
        setMessage({ type: "error", text: "Failed to load profile data" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (message.text) setMessage({ type: "", text: "" });
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    if (!user?.token) {
      setMessage({ type: "error", text: "Authentication required" });
      return;
    }

    setSaving(true);
    try {
      await axios.put("http://localhost:5000/api/users/profile", profile, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      if (updateUser) updateUser(profile);

      setMessage({ type: "success", text: "Profile updated successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to update profile",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!user?.token) {
      setMessage({ type: "error", text: "Authentication required" });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords don't match" });
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: "error", text: "New password must be at least 8 characters long" });
      return;
    }

    setChangingPassword(true);
    try {
      await axios.put("http://localhost:5000/api/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setMessage({ type: "success", text: "Password updated successfully!" });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Error updating password:", err);
      setMessage({
        type: "error",
        text: err.response?.data?.error || "Failed to update password",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.token) return;

    const formData = new FormData();
    formData.append("profileImage", file);

    setUploading(true);
    try {
      const res = await axios.post(
        "http://localhost:5000/api/users/upload-profile-image",
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setProfile((prev) => ({ ...prev, profileImage: res.data.imageUrl }));
      if (updateUser) updateUser({ profileImage: res.data.imageUrl });

      setMessage({ type: "success", text: "Profile picture updated!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Error uploading image:", err);
      setMessage({ type: "error", text: "Failed to upload image" });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user?.token) return;

    try {
      await axios.delete("http://localhost:5000/api/users/profile-image", {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setProfile((prev) => ({ ...prev, profileImage: "" }));
      if (updateUser) updateUser({ profileImage: "" });

      setMessage({ type: "success", text: "Profile picture removed" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (err) {
      console.error("Error removing image:", err);
      setMessage({ type: "error", text: "Failed to remove profile picture" });
    }
  };

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

  if (!user)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Please log in</p>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-dark-bg' : 'bg-light-beige'}`}>
      {/* Background Pattern - only show in light mode */}
      {!darkMode && (
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23059669' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>
      )}
      
      <div className="relative z-10 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Modern Header Card */}
          <div className={`backdrop-blur-xl rounded-3xl shadow-2xl border mb-8 overflow-hidden transition-colors duration-300 ${
            darkMode 
              ? 'bg-dark-card/90 border-gray-700/50' 
              : 'bg-white/90 border-white/30'
          }`}>
            {/* Gradient Header */}
            <div className="relative bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-8 md:p-12">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Profile Image Section */}
                <div className="relative group">
                  <div className="relative h-32 w-32 rounded-full overflow-hidden shadow-2xl ring-4 ring-white/30 dark:ring-gray-700/50">
                    {profile.profileImage ? (
                      <img
                        src={
                          profile.profileImage.startsWith("http")
                            ? profile.profileImage
                            : `http://localhost:5000${profile.profileImage}`
                        }
                        alt="Profile"
                        className="h-32 w-32 object-cover transition-transform duration-300 group-hover:scale-110"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/128x128?text=Image+Not+Found';
                          console.error("Failed to load profile image:", profile.profileImage);
                        }}
                      />
                    ) : (
                      <div className="h-32 w-32 flex items-center justify-center bg-white/20 backdrop-blur-sm">
                        <User className="h-16 w-16 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-all duration-300 rounded-full">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="p-3 bg-white/90 text-emerald-600 rounded-full hover:bg-white hover:scale-110 transition-all duration-200 shadow-lg"
                      disabled={uploading}
                      title="Upload Photo"
                    >
                      {uploading ? (
                        <Loader className="h-5 w-5 animate-spin" />
                      ) : (
                        <Camera className="h-5 w-5" />
                      )}
                    </button>
                    {profile.profileImage && (
                      <button
                        onClick={handleRemoveImage}
                        className="p-3 bg-red-500/90 text-white rounded-full hover:bg-red-600 hover:scale-110 transition-all duration-200 shadow-lg"
                        disabled={uploading}
                        title="Remove Photo"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-white">
                      {profile.firstName || 'User'} {profile.lastName}
                    </h1>
                    <div className="flex items-center gap-1">
                      <Star className="h-6 w-6 text-yellow-300 fill-current" />
                      <Star className="h-6 w-6 text-yellow-300 fill-current" />
                      <Star className="h-6 w-6 text-yellow-300 fill-current" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                    <Award className="h-5 w-5 text-white/80" />
                    <span className="text-xl text-white/90 font-medium">
                      {getRoleDisplayName(profile.role)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Mail className="h-5 w-5 text-white/80" />
                    <span className="text-lg text-white/80">{profile.email}</span>
                  </div>
                  
                  {profile.phone && (
                    <div className="flex items-center justify-center md:justify-start gap-2 mt-2">
                      <Phone className="h-5 w-5 text-white/80" />
                      <span className="text-lg text-white/80">{profile.phone}</span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white font-medium">Active</span>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">100%</div>
                    <div className="text-white/80 text-sm">Profile Complete</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          {/* Modern Tab Navigation */}
          <div className={`backdrop-blur-xl rounded-2xl shadow-xl border mb-8 transition-colors duration-300 ${
            darkMode 
              ? 'bg-dark-card/90 border-gray-700/50' 
              : 'bg-white/90 border-white/30'
          }`}>
            <div className={`flex p-2 rounded-xl m-4 transition-colors duration-300 ${
              darkMode ? 'bg-gray-700/50' : 'bg-gray-50/50'
            }`}>
              <button
                className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "profile"
                    ? darkMode
                      ? "bg-gray-600 text-emerald-400 shadow-lg transform scale-105"
                      : "bg-white text-emerald-600 shadow-lg transform scale-105"
                    : darkMode
                      ? "text-gray-400 hover:text-emerald-400 hover:bg-gray-600/50"
                      : "text-gray-600 hover:text-emerald-600 hover:bg-white/50"
                }`}
                onClick={() => setActiveTab("profile")}
              >
                <User className="h-5 w-5" />
                <span>Profile Information</span>
                {activeTab === "profile" && <Sparkles className="h-4 w-4" />}
              </button>
              <button
                className={`flex-1 flex items-center justify-center gap-3 py-4 px-6 rounded-lg font-semibold transition-all duration-300 ${
                  activeTab === "password"
                    ? darkMode
                      ? "bg-gray-600 text-emerald-400 shadow-lg transform scale-105"
                      : "bg-white text-emerald-600 shadow-lg transform scale-105"
                    : darkMode
                      ? "text-gray-400 hover:text-emerald-400 hover:bg-gray-600/50"
                      : "text-gray-600 hover:text-emerald-600 hover:bg-white/50"
                }`}
                onClick={() => setActiveTab("password")}
              >
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
                {activeTab === "password" && <Sparkles className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Modern Message Display */}
          {message.text && (
            <div className="mb-8">
              <div
                className={`flex items-center gap-4 p-6 rounded-2xl backdrop-blur-xl border transition-colors duration-300 ${
                  message.type === "success"
                    ? darkMode
                      ? "bg-emerald-900/20 text-emerald-200 border-emerald-800"
                      : "bg-emerald-50/80 text-emerald-800 border-emerald-200"
                    : darkMode
                      ? "bg-red-900/20 text-red-200 border-red-800"
                      : "bg-red-50/80 text-red-800 border-red-200"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className={`h-6 w-6 flex-shrink-0 ${
                    darkMode ? "text-emerald-400" : "text-emerald-600"
                  }`} />
                ) : (
                  <AlertCircle className={`h-6 w-6 flex-shrink-0 ${
                    darkMode ? "text-red-400" : "text-red-600"
                  }`} />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </div>
          )}

          {/* Main Content Area */}
          <div className={`backdrop-blur-xl rounded-2xl shadow-xl border p-8 transition-colors duration-300 ${
            darkMode 
              ? 'bg-dark-card/90 border-gray-700/50' 
              : 'bg-white/90 border-white/30'
          }`}>

            {/* Profile Tab - Horizontal Layout */}
            {activeTab === "profile" && (
              <div className="space-y-6">
                {/* Section Header */}
                <div className="text-center mb-6">
                  <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                    darkMode ? 'text-dark-text' : 'text-gray-900'
                  }`}>
                    Personal Information
                  </h2>
                  <p className={`transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Update your personal details and preferences
                  </p>
                </div>

                {/* Horizontal Cards Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Column */}
                  <div className="space-y-6">
                    
                    {/* Basic Information Card */}
                    <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-6 border border-emerald-200/50 dark:border-gray-600/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                          <User className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Basic Information
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {/* First Name */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            First Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                              type="text"
                              value={profile.firstName}
                              onChange={(e) =>
                                handleInputChange("firstName", e.target.value)
                              }
                              placeholder="Enter your first name"
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                            />
                          </div>
                        </div>

                        {/* Last Name */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Last Name
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                              type="text"
                              value={profile.lastName}
                              onChange={(e) =>
                                handleInputChange("lastName", e.target.value)
                              }
                              placeholder="Enter your last name"
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                            />
                          </div>
                        </div>

                        {/* Date of Birth */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Date of Birth
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                              type="date"
                              value={profile.dateOfBirth}
                              onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information Card */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-6 border border-blue-200/50 dark:border-gray-600/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Contact Information
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Email */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="email"
                              value={profile.email}
                              disabled
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Email cannot be changed
                          </p>
                        </div>

                        {/* Phone */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Phone Number
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                              type="tel"
                              value={profile.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              placeholder="Enter your phone number"
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    
                    {/* Location Information Card */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-6 border border-purple-200/50 dark:border-gray-600/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <MapPin className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Location Information
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Address */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Street Address
                          </label>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                              type="text"
                              value={profile.address}
                              onChange={(e) => handleInputChange("address", e.target.value)}
                              placeholder="Enter your street address"
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                            />
                          </div>
                        </div>

                        {/* City */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            City
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                              type="text"
                              value={profile.city}
                              onChange={(e) => handleInputChange("city", e.target.value)}
                              placeholder="Enter your city"
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                            />
                          </div>
                        </div>

                        {/* Country */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Country
                          </label>
                          <div className="relative">
                            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input
                              type="text"
                              value={profile.country}
                              onChange={(e) => handleInputChange("country", e.target.value)}
                              placeholder="Enter your country"
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional Information Card */}
                    <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl p-6 border border-orange-200/50 dark:border-gray-600/50">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                          <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          Additional Information
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {/* Role */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Role
                          </label>
                          <div className="relative">
                            <Award className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              value={getRoleDisplayName(profile.role)}
                              disabled
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <Lock className="h-3 w-3" />
                            Role assigned by administrator
                          </p>
                        </div>

                        {/* Bio */}
                        <div className="group">
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Bio
                          </label>
                          <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <textarea
                              value={profile.bio}
                              onChange={(e) => handleInputChange("bio", e.target.value)}
                              placeholder="Tell us about yourself..."
                              rows={3}
                              className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                            />
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Share about yourself
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {profile.bio.length}/500
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-center pt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader className="animate-spin h-6 w-6" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                        <span>Save Changes</span>
                        <Sparkles className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Password Tab - Compact Layout */}
            {activeTab === "password" && (
              <div className="space-y-6">
                {/* Section Header */}
                <div className="text-center mb-6">
                  <h2 className={`text-2xl font-bold mb-2 transition-colors duration-300 ${
                    darkMode ? 'text-dark-text' : 'text-gray-900'
                  }`}>
                    Security Settings
                  </h2>
                  <p className={`transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    Update your password to keep your account secure
                  </p>
                </div>

                {/* Password Change Card */}
                <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-gray-700/50 to-gray-600/50 border-gray-600/50' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200/50'
                }`}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg transition-colors duration-300 ${
                      darkMode ? 'bg-red-900/30' : 'bg-red-100'
                    }`}>
                      <Shield className={`h-6 w-6 transition-colors duration-300 ${
                        darkMode ? 'text-red-400' : 'text-red-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold transition-colors duration-300 ${
                        darkMode ? 'text-dark-text' : 'text-gray-900'
                      }`}>
                        Change Password
                      </h3>
                      <p className={`text-sm transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        Keep your account secure with a strong password
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Password Fields */}
                    <div className="space-y-4">
                      {/* Current Password */}
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input
                            type={showPassword.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                            placeholder="Enter your current password"
                            className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            onClick={() => togglePasswordVisibility("current")}
                          >
                            {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* New Password */}
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input
                            type={showPassword.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                            placeholder="Enter your new password"
                            className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            onClick={() => togglePasswordVisibility("new")}
                          >
                            {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div className="group">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                          <input
                            type={showPassword.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                            placeholder="Confirm your new password"
                            className="w-full pl-10 pr-10 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-0 focus:border-emerald-500 dark:focus:border-emerald-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-500"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            onClick={() => togglePasswordVisibility("confirm")}
                          >
                            {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Password Requirements */}
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-semibold text-blue-800 dark:text-blue-200">Password Requirements</span>
                        </div>
                        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            At least 8 characters long
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Mix of uppercase and lowercase letters
                          </li>
                          <li className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            Include numbers and special characters
                          </li>
                        </ul>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-semibold text-green-800 dark:text-green-200">Security Tips</span>
                        </div>
                        <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
                          <li>• Use a unique password</li>
                          <li>• Don't reuse old passwords</li>
                          <li>• Consider using a password manager</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Update Password Button */}
                  <div className="flex justify-center pt-6">
                    <button
                      onClick={handlePasswordUpdate}
                      disabled={changingPassword}
                      className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-500/50 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
                    >
                      {changingPassword ? (
                        <>
                          <Loader className="animate-spin h-6 w-6" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                          <span>Update Password</span>
                          <Sparkles className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CustomerProfile;