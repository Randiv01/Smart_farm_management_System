// src/Components/UserHome/CustomerProfile/CustomerProfile.jsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useAuth } from "../UHContext/UHAuthContext";
import {
  User,
  Mail,
  Phone,
  FileText,
  Save,
  Loader,
  Upload,
  Trash2,
} from "lucide-react";

const CustomerProfile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    bio: "",
    profileImage: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
          bio: res.data.bio || "",
          profileImage: res.data.profileImage || "",
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
        text: err.response?.data?.message || "Failed to update profile",
      });
    } finally {
      setSaving(false);
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

      setProfile((prev) => ({ ...prev, profileImage: res.data.imagePath }));
      if (updateUser) updateUser({ profileImage: res.data.imagePath });

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
      await axios.delete("http://localhost:5000/api/users/remove-profile-image", {
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
    <div className="min-h-screen py-8 px-4 bg-gray-50 dark:bg-gray-900">
      <div
        className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl p-10"
        style={{ boxShadow: "0 0 8px rgba(102, 187, 106, 0.6)" }}
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="relative h-28 w-28 rounded-full overflow-hidden mx-auto shadow-lg">
            {profile.profileImage ? (
              <img
                src={
                  profile.profileImage.startsWith("http")
                    ? profile.profileImage
                    : `http://localhost:5000/${profile.profileImage}`
                }
                alt="Profile"
                className="h-28 w-28 object-cover"
              />
            ) : (
              <div className="h-28 w-28 flex items-center justify-center bg-green-100 dark:bg-green-900">
                <User className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 hover:opacity-100 flex items-center justify-center gap-3 transition">
              <button
                onClick={() => fileInputRef.current.click()}
                className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                disabled={uploading}
              >
                <Upload className="h-5 w-5" />
              </button>
              {profile.profileImage && (
                <button
                  onClick={handleRemoveImage}
                  className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                  disabled={uploading}
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
          />
          <h1 className="mt-5 text-3xl font-bold text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account information
          </p>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <div className="space-y-6">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) =>
                  handleInputChange("firstName", e.target.value)
                }
                placeholder="Enter your first name"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) =>
                  handleInputChange("lastName", e.target.value)
                }
                placeholder="Enter your last name"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Email cannot be changed
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter your phone number"
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Bio
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <textarea
                value={profile.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="mt-10 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            {saving ? (
              <>
                <Loader className="animate-spin h-5 w-5 mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
