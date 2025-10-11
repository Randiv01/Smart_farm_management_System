import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useETheme } from '../Econtexts/EThemeContext.jsx';
import { FiCheck, FiX, FiCamera, FiTrash2, FiAlertCircle, FiUser } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import io from 'socket.io-client';
import Loader from '../Loader/Loader.js'; // Import the Loader component

// Polished MessagePopup with dark mode support
const MessagePopup = ({ type, message, show, onClose, darkMode }) => {
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
                ? darkMode 
                  ? 'bg-gradient-to-r from-green-900/80 to-green-800/80 border-l-4 border-green-400 text-green-200'
                  : 'bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 text-green-800'
                : darkMode
                ? 'bg-gradient-to-r from-red-900/80 to-red-800/80 border-l-4 border-red-400 text-red-200'
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
              className={`ml-2 p-2 rounded-lg transition-colors ${
                darkMode 
                  ? 'hover:bg-gray-700/50 text-gray-300' 
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Image modal for preview with dark mode support
const ImageModal = ({ src, onClose, darkMode }) => (
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
          className={`${darkMode ? 'bg-gray-900' : 'bg-white'} rounded-2xl overflow-hidden shadow-2xl max-w-3xl w-full`}
        >
          <div className="relative">
            <img src={src} alt="Profile preview" className="w-full h-auto object-contain max-h-[70vh]" />
            <button
              onClick={onClose}
              aria-label="Close image preview"
              className={`absolute top-3 right-3 backdrop-blur rounded-full p-2 shadow transition-colors ${
                darkMode 
                  ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-200' 
                  : 'bg-white/80 hover:bg-gray-100/80 text-gray-600'
              }`}
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

  // Set browser tab title
  useEffect(() => {
    document.title = "System Settings - Employee Manager";
  }, []);

  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(true); // Loader state
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
    return `http://localhost:5000/api/users/profile-image/${filename}`;
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
    window.dispatchEvent(new Event('profileUpdated'));
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setShowLoader(true);
        const token = localStorage.getItem('token');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const userDataFromApi = response.data;
        console.log('Fetched user data:', userDataFromApi);
        
        setUserData(userDataFromApi);
        
        if (userDataFromApi.profileImage) {
          const imageUrl = getProfileImageUrl(userDataFromApi.profileImage);
          console.log('Setting image preview:', imageUrl);
          setImagePreview(imageUrl);
        }
        
        updateUserDataStorage(userDataFromApi);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        if (error.response?.status === 401) {
          showMessage('error', 'Session expired. Please login again.');
          localStorage.clear();
          window.location.href = '/login';
        } else {
          showMessage('error', error.response?.data?.error || 'Failed to fetch user profile');
        }
      } finally {
        setLoading(false);
        setShowLoader(false);
      }
    };

    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await axios.get('http://localhost:5000/api/users/roles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableRoles(response.data);
      } catch (error) {
        console.error('Error fetching roles:', error);
        // Don't show error for roles as it's not critical
      }
    };

    fetchUserProfile();
    fetchRoles();
  }, [showMessage, getProfileImageUrl]);

  // Show loader while loading
  if (showLoader) {
    return <Loader darkMode={darkMode} />;
  }

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
      setShowLoader(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

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
      
      console.log('Updating profile with data:', updateData);
      
      const response = await axios.put('http://localhost:5000/api/users/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      console.log('Profile update response:', response.data);
      
      setUserData({ ...userData, ...response.data });
      updateUserDataStorage(response.data);
      showMessage('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.status === 401) {
        showMessage('error', 'Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        showMessage('error', error.response?.data?.error || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
      setShowLoader(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (!validatePassword()) return;
    try {
      setLoading(true);
      setShowLoader(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.put(
        'http://localhost:5000/api/users/change-password',
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
      if (error.response?.status === 401) {
        showMessage('error', 'Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        showMessage('error', error.response?.data?.error || 'Failed to change password');
      }
    } finally {
      setLoading(false);
      setShowLoader(false);
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
      setShowLoader(true);
      const formData = new FormData();
      formData.append('profileImage', file);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Uploading image:', file.name);
      
      const response = await axios.post('http://localhost:5000/api/users/upload-profile-image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('Image upload response:', response.data);

      const updatedUserData = { ...userData, profileImage: response.data.imageUrl };
      setUserData(updatedUserData);
      
      // Set preview using the server URL instead of local object URL
      const imageUrl = getProfileImageUrl(response.data.imageUrl);
      setImagePreview(imageUrl);
      
      updateUserDataStorage(updatedUserData);
      showMessage('success', 'Profile image updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error.response?.status === 401) {
        showMessage('error', 'Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        showMessage('error', error.response?.data?.error || 'Failed to upload image');
      }
    } finally {
      setLoading(false);
      setShowLoader(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setLoading(true);
      setShowLoader(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await axios.delete('http://localhost:5000/api/users/profile-image', {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUserData = { ...userData, profileImage: '' };
      setUserData(updatedUserData);
      setImagePreview(null);
      updateUserDataStorage(updatedUserData);
      showMessage('success', 'Profile image removed successfully');
    } catch (error) {
      console.error('Error removing image:', error);
      if (error.response?.status === 401) {
        showMessage('error', 'Session expired. Please login again.');
        localStorage.clear();
        window.location.href = '/login';
      } else {
        showMessage('error', error.response?.data?.error || 'Failed to remove image');
      }
    } finally {
      setLoading(false);
      setShowLoader(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account? You can reactivate it by logging in again.')) {
      return;
    }
    try {
      setLoading(true);
      setShowLoader(true); // Show loader when deactivating account
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
      setShowLoader(false); // Hide loader when done
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    try {
      setLoading(true);
      setShowLoader(true); // Show loader when deleting account
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
      setShowLoader(false); // Hide loader when done
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
    <div className={`h-full ${darkMode ? 'bg-gray-900 text-gray-200' : 'light-beige'}`}>
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              System Settings
            </h2>
            <p className={`mt-1 text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Manage your profile, password and account settings.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`text-sm ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Preview</div>
            <div className={`w-12 h-12 rounded-full overflow-hidden border-2 flex items-center justify-center ${
              darkMode 
                ? 'border-gray-700 bg-gray-800' 
                : 'border-gray-200 bg-white'
            }`}>
              {imagePreview ? (
                <img src={imagePreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <FiUser className={`w-6 h-6 ${
                  darkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
              )}
            </div>
          </div>
        </div>

        <MessagePopup
          type={message.type}
          message={message.text}
          show={message.show}
          darkMode={darkMode}
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
                    <div className={`w-44 h-44 rounded-2xl overflow-hidden border-4 bg-gradient-to-br flex items-center justify-center ${
                      darkMode 
                        ? 'border-gray-700 from-gray-800 to-gray-900' 
                        : 'border-gray-100 from-gray-50 to-gray-100'
                    }`}>
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Profile"
                          className="w-full h-full object-cover cursor-pointer"
                          onClick={() => setShowImageModal(true)}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-5xl font-semibold ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {userData.firstName?.[0] || 'S'}{userData.lastName?.[0] || ''}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-center mt-4 gap-2">
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg hover:scale-[1.01] transition transform shadow-sm ${
                        darkMode 
                          ? 'bg-gray-700 text-gray-200' 
                          : 'bg-white text-gray-700'
                      }`}>
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
                      <label className={`block text-sm font-medium mb-1 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{item.label}</label>
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
                            ? darkMode ? 'border-red-400 ring-red-900' : 'border-red-400 ring-red-100'
                            : darkMode
                            ? 'bg-gray-700 text-gray-200 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800'
                            : 'bg-white text-gray-800 border-gray-200 focus:ring-blue-500 focus:ring-offset-white'
                        }`}
                      />
                      {validationErrors[item.field] && (
                        <p className="mt-1 text-xs text-red-500">{validationErrors[item.field]}</p>
                      )}
                    </div>
                  ))}

                  <div>
                    <label className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Role</label>
                    <input
                      type="text"
                      value={formatRole(userData.role)}
                      disabled
                      className={`w-full p-3 rounded-xl border ${
                        darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    />
                    <p className={`text-xs mt-1 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Role cannot be changed</p>
                  </div>

                  {['animal', 'plant', 'health'].includes(userData.role) && (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Specialization</label>
                        <input
                          type="text"
                          value={userData.specialization}
                          onChange={(e) => handleInputChange('specialization', e.target.value)}
                          maxLength="100"
                          className={`w-full p-3 rounded-xl border ${
                            darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-200'
                          }`}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Years of Experience</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={userData.experience}
                          onChange={(e) => handleInputChange('experience', e.target.value)}
                          className={`w-full p-3 rounded-xl border ${
                            darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-200'
                          }`}
                          disabled={loading}
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-1 ${
                          darkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>Education</label>
                        <input
                          type="text"
                          value={userData.education}
                          onChange={(e) => handleInputChange('education', e.target.value)}
                          maxLength="200"
                          className={`w-full p-3 rounded-xl border ${
                            darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-200'
                          }`}
                          disabled={loading}
                        />
                      </div>
                    </>
                  )}

                  <div className="md:col-span-2">
                    <label className={`block text-sm font-medium mb-1 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Bio</label>
                    <textarea
                      value={userData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows="4"
                      maxLength="500"
                      className={`w-full p-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-1 ${
                        validationErrors.bio
                          ? darkMode ? 'border-red-400 ring-red-900' : 'border-red-400 ring-red-100'
                          : darkMode
                          ? 'bg-gray-700 text-gray-200 border-gray-600 focus:ring-blue-500 focus:ring-offset-gray-800'
                          : 'bg-white text-gray-800 border-gray-200 focus:ring-blue-500 focus:ring-offset-white'
                      }`}
                      disabled={loading}
                    />
                    <div className={`flex justify-between mt-2 text-xs ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      <span>{userData.bio.length}/500</span>
                      {validationErrors.bio && <span className="text-red-500">{validationErrors.bio}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-2">
                <button
                  onClick={() => { setUserData((prev) => ({ ...prev })); showMessage('success', 'No changes to revert ✨', 1800); }}
                  className={`px-4 py-2 rounded-full hover:shadow ${
                    darkMode 
                      ? 'bg-gray-700 text-gray-200' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
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
              <h3 className={`text-lg font-semibold ${
                darkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>Change Password</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Current Password *</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className={`w-full p-3 rounded-xl border ${
                      validationErrors.currentPassword ? 'border-red-400' : darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.currentPassword && <p className="text-xs text-red-500 mt-1">{validationErrors.currentPassword}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>New Password *</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className={`w-full p-3 rounded-xl border ${
                      validationErrors.newPassword ? 'border-red-400' : darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-200'
                    }`}
                    disabled={loading}
                  />
                  {validationErrors.newPassword && <p className="text-xs text-red-500 mt-1">{validationErrors.newPassword}</p>}
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Confirm New Password *</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className={`w-full p-3 rounded-xl border ${
                      validationErrors.confirmPassword ? 'border-red-400' : darkMode ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-200'
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
              <div className={`p-4 border rounded-xl ${
                darkMode 
                  ? 'border-yellow-800 bg-yellow-900/20' 
                  : 'border-yellow-200 bg-yellow-50'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-yellow-800/30' : 'bg-yellow-100'
                  }`}>
                    <FiAlertCircle className={`w-6 h-6 ${
                      darkMode ? 'text-yellow-300' : 'text-yellow-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`text-lg font-medium ${
                      darkMode ? 'text-yellow-200' : 'text-yellow-800'
                    }`}>Deactivate Account</h4>
                    <p className={`text-sm mt-1 ${
                      darkMode ? 'text-yellow-300' : 'text-yellow-700'
                    }`}>Deactivating your account will disable your profile and remove it from public view. You can reactivate your account by logging in again.</p>
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

              <div className={`p-4 border rounded-xl ${
                darkMode 
                  ? 'border-red-800 bg-red-900/20' 
                  : 'border-red-200 bg-red-50'
              }`}>
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    darkMode ? 'bg-red-800/30' : 'bg-red-100'
                  }`}>
                    <FiTrash2 className={`w-6 h-6 ${
                      darkMode ? 'text-red-300' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className={`text-lg font-medium ${
                      darkMode ? 'text-red-200' : 'text-red-800'
                    }`}>Delete Account</h4>
                    <p className={`text-sm mt-1 ${
                      darkMode ? 'text-red-300' : 'text-red-700'
                    }`}>Permanently delete your account and all associated data. This action cannot be undone.</p>
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

          <div className={`flex items-center justify-between mt-8 pt-6 border-t ${
            darkMode ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <div className="flex items-center">
              <span className={`mr-3 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Theme</span>
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
              <span className={`ml-3 text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>{darkMode ? 'Dark' : 'Light'}</span>
            </div>
          </div>
        </div>
      </div>

      <ImageModal src={showImageModal ? imagePreview : null} darkMode={darkMode} onClose={() => setShowImageModal(false)} />
    </div>
  );
};

export default ESystemSettings;