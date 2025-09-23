// FRONTEND\src\Components\PlantManagement\pages\P-Settings.jsx
import React, { useState, useEffect } from "react";
import { User, Camera, Trash2, Save, Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useTheme } from "../context/ThemeContext";

export default function PSettings() {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    dateOfBirth: "",
    bio: "",
    role: "plant"
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [profileImage, setProfileImage] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);

  // Theme variables
  const bgCard = theme === 'dark' ? 'bg-[#2d2d2d]' : 'bg-white';
  const textColor = theme === 'dark' ? 'text-gray-200' : 'text-gray-800';
  const borderColor = theme === 'dark' ? 'border-[#555]' : 'border-gray-300';
  const inputBg = theme === 'dark' ? '#3a3a3b' : '#fff';
  const inputText = theme === 'dark' ? '#f4f7fb' : '#1f2937';

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await axios.get("/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const user = response.data;
        
        setProfileForm({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          phone: user.phone || "",
          address: user.address || "",
          city: user.city || "",
          country: user.country || "",
          dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "",
          bio: user.bio || "",
          role: user.role || "plant"
        });

        if (user.profileImage) {
          const imageUrl = `/api${user.profileImage}`;
          setProfileImage(imageUrl);
          localStorage.setItem("profileImage", imageUrl);
        }

        // Store user details in localStorage
        localStorage.setItem("userFullName", `${user.firstName || ""} ${user.lastName || ""}`);
        localStorage.setItem("userEmail", user.email || "");
        localStorage.setItem("userPhone", user.phone || "");
        localStorage.setItem("userAddress", user.address || "");
        localStorage.setItem("userCity", user.city || "");
        localStorage.setItem("userCountry", user.country || "");
        localStorage.setItem("userDateOfBirth", user.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : "");
        localStorage.setItem("userBio", user.bio || "");
        localStorage.setItem("userRole", user.role || "plant");
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      // Fallback to localStorage data if API fails
      const name = localStorage.getItem("userFullName") || "Plant Manager";
      const nameParts = name.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      
      setProfileForm(prev => ({
        ...prev,
        firstName,
        lastName,
        email: localStorage.getItem("userEmail") || prev.email,
        phone: localStorage.getItem("userPhone") || prev.phone,
        address: localStorage.getItem("userAddress") || prev.address,
        city: localStorage.getItem("userCity") || prev.city,
        country: localStorage.getItem("userCountry") || prev.country,
        dateOfBirth: localStorage.getItem("userDateOfBirth") || prev.dateOfBirth,
        bio: localStorage.getItem("userBio") || prev.bio,
        role: localStorage.getItem("userRole") || prev.role
      }));
      
      const image = localStorage.getItem("profileImage") || "";
      setProfileImage(image);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setMessage({ type: "error", text: "Please select an image file" });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: "Image size must be less than 5MB" });
        return;
      }

      setProfileImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage("");
    setProfileImageFile(null);
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

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage({ type: "error", text: "No authentication token found. Please login again." });
        setIsLoading(false);
        return;
      }

      const formData = new FormData();

      // Append profile image if selected
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      // Append other profile data
      formData.append("firstName", profileForm.firstName || "");
      formData.append("lastName", profileForm.lastName || "");
      formData.append("phone", profileForm.phone || "");
      formData.append("address", profileForm.address || "");
      formData.append("city", profileForm.city || "");
      formData.append("country", profileForm.country || "");
      formData.append("dateOfBirth", profileForm.dateOfBirth || "");
      formData.append("bio", profileForm.bio || "");

      console.log('Sending profile update request...');

      // API call with proxy support
      const response = await axios.put("/api/users/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        },
        timeout: 15000 // 15 second timeout
      });

      console.log('Profile update successful:', response.data);

      if (response.data) {
        const userData = response.data;
        const fullName = `${userData.firstName} ${userData.lastName}`;
        
        // Update localStorage with complete user data
        localStorage.setItem("userFullName", fullName);
        localStorage.setItem("userEmail", userData.email || "");
        localStorage.setItem("userPhone", userData.phone || "");
        localStorage.setItem("userAddress", userData.address || "");
        localStorage.setItem("userCity", userData.city || "");
        localStorage.setItem("userCountry", userData.country || "");
        localStorage.setItem("userDateOfBirth", userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : "");
        localStorage.setItem("userBio", userData.bio || "");
        localStorage.setItem("userRole", userData.role || "plant");

        // Update profile image
        if (userData.profileImage) {
          const imageUrl = `/api${userData.profileImage}`;
          setProfileImage(imageUrl);
          localStorage.setItem("profileImage", imageUrl);
        }

        // Dispatch event to update navbar in real-time
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
          detail: {
            fullName,
            profileImage: userData.profileImage ? `/api${userData.profileImage}` : profileImage,
            role: userData.role || profileForm.role
          }
        }));

        setMessage({ type: "success", text: "Profile updated successfully!" });
        setProfileImageFile(null);

        // Refresh form data to ensure sync
        setTimeout(() => {
          setProfileForm(prev => ({
            ...prev,
            firstName: userData.firstName || prev.firstName,
            lastName: userData.lastName || prev.lastName,
            phone: userData.phone || prev.phone,
            address: userData.address || prev.address,
            city: userData.city || prev.city,
            country: userData.country || prev.country,
            dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().split('T')[0] : prev.dateOfBirth,
            bio: userData.bio || prev.bio,
            role: userData.role || prev.role
          }));
        }, 100);
      }
    } catch (error) {
      console.error("Profile update failed:", error);
      
      let errorMessage = "Failed to update profile. Please try again.";
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please check your internet connection.";
      } else if (error.response) {
        // Server responded with error status
        console.error("Error response:", error.response.status, error.response.data);
        
        switch (error.response.status) {
          case 401:
            errorMessage = "Authentication failed. Please login again.";
            break;
          case 404:
            errorMessage = "Profile update service not available. Please contact support.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = error.response.data?.error || error.response.data?.message || errorMessage;
        }
      } else if (error.request) {
        // No response received
        errorMessage = "Cannot connect to server. Please ensure the backend server is running on port 5000.";
      } else {
        // Other errors
        errorMessage = error.message || errorMessage;
      }
      
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: "", text: "" });

    // Validate passwords match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (passwordForm.newPassword.length < 8) {
      setMessage({ type: "error", text: "Password must be at least 8 characters long" });
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put("/api/users/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      if (response.data) {
        setMessage({ type: "success", text: "Password changed successfully!" });
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      console.error("Failed to change password:", error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || "Failed to change password";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pt-16 pb-10 bg-background ${textColor}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Account Settings</h1>
          <p className="mt-2 text-lg">Manage your profile and security settings</p>
        </div>

        {/* Tabs */}
        <div className={`flex border-b mb-6 ${borderColor}`}>
          <button
            className={`py-3 px-6 font-medium ${activeTab === 'profile' 
              ? `border-b-2 border-[var(--primary)] text-[var(--primary)]`
              : `${textColor} hover:text-[var(--primary)]`
            }`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`py-3 px-6 font-medium ${activeTab === 'password' 
              ? `border-b-2 border-[var(--primary)] text-[var(--primary)]`
              : `${textColor} hover:text-[var(--primary)]`
            }`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-md border ${
            message.type === 'success' 
              ? 'bg-green-100 text-green-800 border-green-300'
              : 'bg-red-100 text-red-800 border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className={`p-6 rounded-lg shadow ${bgCard}`}>
              <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
              
              {/* Profile Image Upload */}
              <div className="flex items-center mb-8">
                <div className="relative mr-6">
                  {profileImage ? (
                    <div className="relative">
                      <img 
                        src={profileImage} 
                        alt="Profile" 
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextElementSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed ${borderColor} bg-card hidden`}>
                        <User size={32} className={textColor} />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 border-dashed ${borderColor}`}>
                      <User size={32} className={textColor} />
                    </div>
                  )}
                </div>
                <div>
                  <label htmlFor="profileImage" className="cursor-pointer">
                    <div className={`inline-flex items-center px-4 py-2 rounded-md bg-card border ${borderColor} ${textColor} hover:bg-[var(--primary)] hover:text-white transition-colors`}>
                      <Camera size={18} className="mr-2" />
                      {profileImage ? 'Change Photo' : 'Upload Photo'}
                    </div>
                    <input
                      id="profileImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className={`mt-2 text-sm ${textColor} opacity-70`}>JPG, PNG or GIF. Max 5MB.</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium mb-2">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={profileForm.firstName}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
                    required
                    style={{ backgroundColor: inputBg, color: inputText }}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={profileForm.lastName}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
                    required
                    style={{ backgroundColor: inputBg, color: inputText }}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileForm.email}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-gray-100 text-gray-500 cursor-not-allowed`}
                    disabled
                  />
                  <p className={`mt-1 text-sm ${textColor} opacity-70`}>Email cannot be changed</p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
                    style={{ backgroundColor: inputBg, color: inputText }}
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium mb-2">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
                    style={{ backgroundColor: inputBg, color: inputText }}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={profileForm.city}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
                    style={{ backgroundColor: inputBg, color: inputText }}
                  />
                </div>

                <div>
                  <label htmlFor="country" className="block text-sm font-medium mb-2">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={profileForm.country}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
                    style={{ backgroundColor: inputBg, color: inputText }}
                  />
                </div>

                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-2">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={profileForm.dateOfBirth}
                    onChange={handleProfileChange}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
                    style={{ backgroundColor: inputBg, color: inputText }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bio" className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    rows={3}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)]`}
                    placeholder="Tell us a bit about yourself..."
                    style={{ backgroundColor: inputBg, color: inputText }}
                  />
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium mb-2">Role</label>
                  <input
                    type="text"
                    id="role"
                    value={getRoleDisplayName(profileForm.role)}
                    className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-gray-100 text-gray-500 cursor-not-allowed`}
                    disabled
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`inline-flex items-center px-6 py-3 rounded-md font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className={`p-6 rounded-lg shadow ${bgCard}`}>
              <h2 className="text-xl font-semibold mb-6">Change Password</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)] pr-10`}
                      required
                      style={{ backgroundColor: inputBg, color: inputText }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} className={textColor} />
                      ) : (
                        <Eye size={18} className={textColor} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)] pr-10`}
                      required
                      style={{ backgroundColor: inputBg, color: inputText }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} className={textColor} />
                      ) : (
                        <Eye size={18} className={textColor} />
                      )}
                    </button>
                  </div>
                  <p className={`mt-1 text-sm ${textColor} opacity-70`}>Must be at least 8 characters long</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className={`w-full px-4 py-2 rounded-md border ${borderColor} bg-card ${textColor} focus:outline-none focus:ring-1 focus:ring-[var(--primary)] pr-10`}
                      required
                      style={{ backgroundColor: inputBg, color: inputText }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} className={textColor} />
                      ) : (
                        <Eye size={18} className={textColor} />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`inline-flex items-center px-6 py-3 rounded-md font-medium bg-[var(--primary)] text-white hover:bg-[var(--primary)]/90 transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}