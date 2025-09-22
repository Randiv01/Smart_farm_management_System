import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useETheme } from '../Econtexts/EThemeContext.jsx';
import { FiCheck, FiX, FiCamera, FiTrash2, FiAlertCircle, FiUploadCloud, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';

// Polished MessagePopup
const MessagePopup = ({ type, message, show, onClose }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 flex items-end md:items-center justify-center z-50 p-4 pointer-events-none"
        >
          <div
            role="status"
            aria-live="polite"
            className={`pointer-events-auto max-w-md w-full rounded-2xl shadow-2xl p-4 md:p-6 flex items-start gap-4 transition-transform transform ${
              type === 'success'
                ? 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 text-green-800'
                : 'bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 text-red-800'
            }`}
          >
            <div className="flex-shrink-0 mt-1">
              {type === 'success' ? (
                <FiCheck className="w-6 h-6" />
              ) : (
                <FiAlertCircle className="w-6 h-6" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{message}</p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close message"
              className="ml-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Image modal for preview
const ImageModal = ({ src, onClose }) => (
  <AnimatePresence>
    {src && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50"
      >
        <motion.div
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full"
        >
          <div className="relative">
            <img src={src} alt="Profile preview" className="w-full h-auto object-contain max-h-[70vh]" />
            <button
              onClick={onClose}
              aria-label="Close image preview"
              className="absolute top-3 right-3 bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-full p-2 shadow"
            >
              <FiX />
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ESystemSettings = () => {
  const { theme, toggleTheme } = useETheme();
  const darkMode = theme === 'dark';
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState(null);

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
  const [showImageModal, setShowImageModal] = useState(false);

  // Initialize socket connection (kept as-is)
  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const getProfileImageUrl = useCallback((path) => {
    if (!path) return null;
    const cleanPath = path.replace(/\\/g, '/');
    const parts = cleanPath.split('/');
    const filename = parts[parts.length - 1];
    return `/api/users/profile-image/${filename}`;
  }, []);

  const showMessage = useCallback((type, text, timeout = 3000) => {
    setMessage({ type, text, show: true });
    setTimeout(() => {
      setMessage({ type: '', text: '', show: false });
    }, timeout);
  }, []);

  // Emit user profile updates to socket
  const emitProfileUpdate = (updatedData) => {
    if (socket) {
      socket.emit('userProfileUpdated', updatedData);
    }
  };

  // Update localStorage and emit changes
  const updateUserDataStorage = (newData) => {
    if (newData.firstName) localStorage.setItem('firstName', newData.firstName);
    if (newData.lastName) localStorage.setItem('lastName', newData.lastName);
    if (newData.profileImage) localStorage.setItem('profileImage', newData.profileImage);

    emitProfileUpdate(newData);
    window.dispatchEvent(new Event('storage'));
  };

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
        updateUserDataStorage(userDataFromApi);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        showMessage('error', error.response?.data?.error || 'Failed to fetch user profile');
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

  // Input handlers
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

  // Validation functions (kept behavior)
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

  // Profile update
  const handleProfileUpdate = async () => {
    if (!validateProfile()) return;
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const updateData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        address: userData.address,
        city: userData.city,
        country: userData.country,
        dateOfBirth: userData.dateOfBirth,
        bio: userData.bio,
      };
      if (['animal', 'plant', 'health'].includes(userData.role)) {
        updateData.specialization = userData.specialization;
        updateData.experience = userData.experience;
        updateData.education = userData.education;
      }
      const response = await axios.put('/api/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserData({ ...userData, ...response.data });
      updateUserDataStorage(response.data);
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
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
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showMessage('success', 'Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      showMessage('error', error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Image handling (kept behavior but nicer feedback)
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

      const updatedUserData = { ...userData, profileImage: response.data.imageUrl };
      setUserData(updatedUserData);
      setImagePreview(URL.createObjectURL(file));
      updateUserDataStorage(updatedUserData);
      showMessage('success', 'Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      showMessage('error', error.response?.data?.error || 'Failed to upload image');
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

      const updatedUserData = { ...userData, profileImage: '' };
      setUserData(updatedUserData);
      setImagePreview(null);
      updateUserDataStorage(updatedUserData);
      showMessage('success', 'Profile image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      showMessage('error', error.response?.data?.error || 'Failed to remove image');
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
      console.error('Error deactivating account:', error);
      showMessage('error', error.response?.data?.error || 'Failed to deactivate account');
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
      console.error('Error deleting account:', error);
      showMessage('error', error.response?.data?.error || 'Failed to delete account');
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
    <div className={`h-full min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              System Settings
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">Manage your profile, password and account settings.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">Preview</div>
            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center bg-white dark:bg-gray-800">
              {imagePreview ? (
                <img src={imagePreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <FiUser className="w-6 h-6 text-gray-500 dark:text-gray-300" />
              )}
            </div>
          </div>
        </div>

        <MessagePopup
          type={message.type}
          message={message.text}
          show={message.show}
          onClose={() => setMessage({ type: '', text: '', show: false })}
        />

        <div className="flex flex-wrap gap-3 mb-6">
          {['profile', 'password', 'account'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : darkMode
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-white/90'
              }`}
              disabled={loading}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        <div className={`rounded-2xl shadow-xl p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 w-full md:w-44">
                  <div className="relative group">
                    <div className="w-44 h-44 rounded-2xl overflow-hidden border-4 border-gray-100 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setShowImageModal(true)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl font-semibold text-gray-400 dark:text-gray-500">
                          {userData.firstName?.[0] || 'S'}{userData.lastName?.[0] || ''}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center mt-4 gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 hover:scale-[1.01] transition transform shadow-sm">
                        <FiCamera />
                        <span className="text-sm">Change</span>
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
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:scale-[1.01] transition transform shadow-sm"
                          disabled={loading}
                        >
                          <FiTrash2 />
                          <span className="text-sm">Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Inputs - uses consistent styles */}
                  {[
                    { label: 'First Name *', field: 'firstName', type: 'text' },
                    { label: 'Last Name *', field: 'lastName', type: 'text' },
                    { label: 'Email', field: 'email', type: 'email', disabled: true },
                    { label: 'Phone', field: 'phone', type: 'tel' },
                    { label: 'Address', field: 'address', type: 'text' },
                    { label: 'City', field: 'city', type: 'text' },
                    { label: 'Country', field: 'country', type: 'text' },
                    { label: 'Date of Birth', field: 'dateOfBirth', type: 'date' },
                  ].map((item) => (
                    <div key={item.field}>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{item.label}</label>
                      <input
                        type={item.type}
                        value={
                          item.field === 'dateOfBirth' && userData.dateOfBirth
                            ? new Date(userData.dateOfBirth).toISOString().split('T')[0]
                            : userData[item.field]
                        }
                        onChange={(e) => handleInputChange(item.field, e.target.value)}
                        disabled={item.disabled || loading}
                        className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                          validationErrors[item.field]
                            ? 'border-red-400 ring-red-100'
                            : darkMode
                            ? 'bg-gray-700 text-white border-gray-600'
                            : 'bg-white text-gray-800 border-gray-200'
                        }`}
                      />
                      {validationErrors[item.field] && (
                        <p className="mt-1 text-xs text-red-500">{validationErrors[item.field]}</p>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                    <input
                      type="text"
                      value={formatRole(userData.role)}
                      disabled
                      className={`w-full p-3 rounded-xl border ${
                        darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Role cannot be changed</p>
                  </div>

                  {['animal', 'plant', 'health'].includes(userData.role) && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Specialization</label>
                        <input
                          type="text"
                          value={userData.specialization}
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                          maxLength="100"
                          className={`w-full p-3 rounded-xl border ${
                            darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-200'
                          }`}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Years of Experience</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={userData.experience}
                          onChange={(e) => handleInputChange('experience', e.target.value)}
                          className={`w-full p-3 rounded-xl border ${
                            darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-200'
                          }`}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Education</label>
                        <input
                          type="text"
                          value={userData.education}
                          onChange={(e) => handleInputChange('education', e.target.value)}
                          maxLength="200"
                          className={`w-full p-3 rounded-xl border ${
                            darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-200'
                          }`}
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className="blocktext-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                    <textarea
                      value={userData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows="4"
                      maxLength="500"
                      className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        validationErrors.bio
                          ? 'border-red-400 ring-red-100'
                          : darkMode
                          ? 'bg-gray-700 text-white border-gray-600'
                          : 'bg-white text-gray-800 border-gray-200'
                      }`}
                      disabled={loading}
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{userData.bio.length}/500</span>
                      {validationErrors.bio && <span className="text-red-500">{validationErrors.bio}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => { setUserData((prev) => ({ ...prev })); showMessage('success', 'No changes to revert ✨', 1800); }}
                  className="px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:shadow"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProfileUpdate}
                  className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:scale-[1.01] transition transform disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6 max-w-xl">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password *</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={`w-full p-3 rounded-xl border ${
                      validationErrors.currentPassword ? 'border-red-400' : darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{validationErrors.currentPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password *</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`w-full p-3 rounded-xl border ${
                      validationErrors.newPassword ? 'border-red-400' : darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.newPassword && <p className="text-xs text-red-500 mt-1">{validationErrors.newPassword}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`w-full p-3 rounded-xl border ${
                      validationErrors.confirmPassword ? 'border-red-400' : darkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.confirmPassword && <p className="text-xs text-red-500 mt-1">{validationErrors.confirmPassword}</p>}
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    onClick={handlePasswordUpdate}
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:scale-[1.01] transition transform disabled:opacity-60"
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="p-4 border border-yellow-200 rounded-xl bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-800/30">
                    <FiAlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-yellow-800 dark:text-yellow-200">Deactivate Account</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">Deactivating your account will disable your profile and remove it from public view. You can reactivate your account by logging in again.</p>
                    <div className="mt-3">
                      <button
                        onClick={handleDeactivateAccount}
                        className="px-4 py-2 rounded-full bg-yellow-600 text-white hover:brightness-105 shadow"
                        disabled={loading}
                      >
                        Deactivate Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-red-200 rounded-xl bg-red-50 dark:bg-red-900/20">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-800/30">
                    <FiTrash2 className="w-6 h-6 text-red-600 dark:text-red-300" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-red-800 dark:text-red-200">Delete Account</h4>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">Permanently delete your account and all associated data. This action cannot be undone.</p>
                    <div className="mt-3">
                      <button
                        onClick={handleDeleteAccount}
                        className="px-4 py-2 rounded-full bg-red-600 text-white hover:brightness-105 shadow"
                        disabled={loading}
                      >
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center">
              <span className="mr-3 text-sm text-gray-600 dark:text-gray-400">Theme</span>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex items-center h-7 rounded-full w-14 transition-colors focus:outline-none ${
                  darkMode ? 'bg-gradient-to-r from-indigo-500 to-blue-600' : 'bg-gray-300'
                }`}
                disabled={loading}
                aria-label="Toggle theme"
              >
                <span
                  className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform shadow ${
                    darkMode ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">{darkMode ? 'Dark' : 'Light'}</span>
            </div>
          </div>
        </div>
      </div>

      <ImageModal src={showImageModal ? imagePreview : null} onClose={() => setShowImageModal(false)} />
    </div>
  );
};

export default ESystemSettings;