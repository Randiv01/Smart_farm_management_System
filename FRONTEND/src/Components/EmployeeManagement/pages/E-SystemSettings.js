import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useETheme } from '../Econtexts/EThemeContext.jsx';
import { FiCheck, FiX, FiCamera, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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
              type === 'success'
                ? 'bg-green-100 border-l-4 border-green-500 text-green-700'
                : 'bg-red-100 border-l-4 border-red-500 text-red-700'
            }`}
          >
            <div className="flex justify-center mb-3">
              {type === 'success' ? (
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

const ESystemSettings = () => {
  const { theme, toggleTheme } = useETheme();
  const darkMode = theme === 'dark';
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('profile');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    dateOfBirth: '',
    bio: '',
    role: 'normal',
    specialization: '',
    experience: '',
    education: '',
    profileImage: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [message, setMessage] = useState({ type: '', text: '', show: false });
  const [validationErrors, setValidationErrors] = useState({});
  const [availableRoles, setAvailableRoles] = useState([]);
  const [imagePreview, setImagePreview] = useState(null);

  const getProfileImageUrl = useCallback((path) => {
    if (!path) return null;
    const cleanPath = path.replace(/\\/g, '/');
    const parts = cleanPath.split('/');
    const filename = parts[parts.length - 1];
    return `/api/users/profile-image/${filename}`;
  }, []);

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text, show: true });
    setTimeout(() => {
      setMessage({ type: '', text: '', show: false });
    }, 3000);
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userDataFromApi = response.data;
        setUserData(userDataFromApi);
        if (userDataFromApi.profileImage) {
          setImagePreview(getProfileImageUrl(userDataFromApi.profileImage));
        }
      } catch (error) {
        showMessage('error', 'Failed to fetch user profile');
      } finally {
        setLoading(false);
      }
    };

    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/users/roles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableRoles(response.data);
      } catch (error) {
        console.error('Error fetching roles:', error);
      }
    };

    fetchUserProfile();
    fetchRoles();
  }, [showMessage, getProfileImageUrl]);

  const handleInputChange = (field, value) => {
    if (field === 'phone') {
      const numericValue = value.replace(/\D/g, '').slice(0, 10);
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
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateProfile = () => {
    const errors = {};
    if (!userData.firstName.trim()) errors.firstName = 'First name is required';
    if (!userData.lastName.trim()) errors.lastName = 'Last name is required';
    if (userData.phone && !/^\d{10}$/.test(userData.phone)) {
      errors.phone = 'Please enter a valid 10-digit phone number';
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
        errors.dateOfBirth = 'You must be at least 18 years old';
      } else if (birthDate > today) {
        errors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    if (userData.bio.length > 500) {
      errors.bio = 'Bio cannot exceed 500 characters';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordData.newPassword) errors.newPassword = 'New password is required';
    if (passwordData.newPassword.length < 8) errors.newPassword = 'Password must be at least 8 characters';
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileUpdate = async () => {
    if (!validateProfile()) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put('/api/users/profile', userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!validatePassword()) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put(
        '/api/users/change-password',
        {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      showMessage('success', 'Password changed successfully!');
    } catch (error) {
      showMessage('error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage('error', 'Image size must be less than 5MB');
      return;
    }
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('profileImage', file);
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/users/upload-profile-image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      setUserData((prev) => ({ ...prev, profileImage: response.data.imageUrl }));
      setImagePreview(URL.createObjectURL(file));
      showMessage('success', 'Profile image updated successfully');
    } catch (error) {
      showMessage('error', 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete('/api/users/profile-image', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData((prev) => ({ ...prev, profileImage: '' }));
      setImagePreview(null);
      showMessage('success', 'Profile image removed successfully');
    } catch (error) {
      showMessage('error', 'Failed to remove image');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account? You can reactivate it by logging in again.')) {
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.put('/api/users/deactivate', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.removeItem('token');
      window.location.href = '/login';
    } catch (error) {
      showMessage('error', 'Failed to deactivate account');
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete('/api/users/account', {
        headers: { Authorization: `Bearer ${token}` },
      });
      localStorage.clear();
      window.location.href = '/login';
    } catch (error) {
      showMessage('error', 'Failed to delete account');
      setLoading(false);
    }
  };

  const formatRole = (role) => {
    const roleMap = {
      normal: 'Normal User',
      animal: 'Animal Specialist',
      plant: 'Plant Specialist',
      inv: 'Inventory Manager',
      emp: 'Employee Manager',
      health: 'Health Specialist',
      owner: 'Owner',
      admin: 'Administrator',
    };
    return roleMap[role] || role;
  };

  return (
    <div className={`h-full ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 dark:text-white">
          System Settings
        </h2>

        <MessagePopup
          type={message.type}
          message={message.text}
          show={message.show}
          onClose={() => setMessage({ type: '', text: '', show: false })}
        />

        <div className="flex flex-wrap gap-2 mb-6">
          {['profile', 'password', 'account'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : darkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-200'
              }`}
              disabled={loading}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div
          className={`rounded-xl shadow-sm ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          } p-6`}
        >
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Profile Information
              </h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-300 dark:border-gray-600 mx-auto">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-4xl text-gray-500 dark:text-gray-400">
                            {userData.firstName?.[0]}
                            {userData.lastName?.[0]}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center mt-4 gap-2">
                      <label className="cursor-pointer bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
                        <FiCamera size={14} />
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                          disabled={loading}
                        />
                      </label>
                      {userData.profileImage && (
                        <button
                          onClick={handleRemoveImage}
                          className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                          disabled={loading}
                        >
                          <FiTrash2 size={14} />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={userData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.firstName
                          ? 'border-red-500'
                          : darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-300'
                      }`}
                      disabled={loading}
                    />
                    {validationErrors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.firstName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={userData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.lastName
                          ? 'border-red-500'
                          : darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-300'
                      }`}
                      disabled={loading}
                    />
                    {validationErrors.lastName && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.lastName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={userData.email}
                      disabled
                      className={`w-full p-3 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 text-gray-300 border-gray-500'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="0772500123"
                      className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.phone
                          ? 'border-red-500'
                          : darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-300'
                      }`}
                      disabled={loading}
                    />
                    {validationErrors.phone && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.phone}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      10 digits only (e.g., 0772500123)
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={userData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-300'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={userData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-300'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={userData.country}
                      onChange={(e) => handleInputChange('country', e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-300'
                      }`}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={
                        userData.dateOfBirth
                          ? new Date(userData.dateOfBirth).toISOString().split('T')[0]
                          : ''
                      }
                      onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.dateOfBirth
                          ? 'border-red-500'
                          : darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-300'
                      }`}
                      disabled={loading}
                    />
                    {validationErrors.dateOfBirth && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      value={formatRole(userData.role)}
                      disabled
                      className={`w-full p-3 rounded-lg border ${
                        darkMode
                          ? 'bg-gray-600 text-gray-300 border-gray-500'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Role cannot be changed
                    </p>
                  </div>
                  {['animal', 'plant', 'health'].includes(userData.role) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Specialization
                        </label>
                        <input
                          type="text"
                          value={userData.specialization}
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                          maxLength="100"
                          className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            darkMode
                              ? 'bg-gray-700 text-white border-gray-600'
                              : 'bg-white text-gray-800 border-gray-300'
                          }`}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Years of Experience
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={userData.experience}
                          onChange={(e) => handleInputChange('experience', e.target.value)}
                          className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            darkMode
                              ? 'bg-gray-700 text-white border-gray-600'
                              : 'bg-white text-gray-800 border-gray-300'
                          }`}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Education
                        </label>
                        <input
                          type="text"
                          value={userData.education}
                          onChange={(e) => handleInputChange('education', e.target.value)}
                          maxLength="200"
                          className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            darkMode
                              ? 'bg-gray-700 text-white border-gray-600'
                              : 'bg-white text-gray-800 border-gray-300'
                          }`}
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Bio
                    </label>
                    <textarea
                      value={userData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows="3"
                      maxLength="500"
                      className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        validationErrors.bio
                          ? 'border-red-500'
                          : darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-300'
                      }`}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                      {userData.bio.length}/500
                    </p>
                    {validationErrors.bio && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.bio}</p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleProfileUpdate}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}
          {activeTab === 'password' && (
            <div className="space-y-6 max-w-md">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Change Password
              </h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Current Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.currentPassword
                        ? 'border-red-500'
                        : darkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-800 border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.currentPassword && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.currentPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.newPassword
                        ? 'border-red-500'
                        : darkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-800 border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.newPassword && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.newPassword}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirm New Password *
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`w-full p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      validationErrors.confirmPassword
                        ? 'border-red-500'
                        : darkMode
                        ? 'bg-gray-700 text-white border-gray-600'
                        : 'bg-white text-gray-800 border-gray-300'
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={handlePasswordUpdate}
                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-md transition-colors disabled:opacity-50"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">
                Account Management
              </h3>
              <div className="p-4 border border-yellow-400 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <h4 className="text-lg font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Deactivate Account
                </h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                  Deactivating your account will disable your profile and remove it from public view.
                  You can reactivate your account by logging in again.
                </p>
                <button
                  onClick={handleDeactivateAccount}
                  className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  Deactivate Account
                </button>
              </div>
              <div className="p-4 border border-red-400 rounded-lg bg-red-50 dark:bg-red-900/20">
                <h4 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">
                  Delete Account
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <span className="mr-3 text-sm text-gray-600 dark:text-gray-400">Theme</span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                disabled={loading}
              >
                <span
                  className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                {darkMode ? 'Dark' : 'Light'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ESystemSettings;