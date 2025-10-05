import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Package, 
  Beef, 
  Milk, 
  Egg, 
  Edit3, 
  X, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Hash,
  FileText
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext.js';
import { useUser } from '../contexts/UserContext.js';
import axios from 'axios';

const ProductivityNotification = ({ isOpen, onClose, animalData = null }) => {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  const { userData } = useUser();
  
  const [formData, setFormData] = useState({
    type: 'productivity', // 'productivity' or 'meat'
    productType: '',
    quantity: '',
    unit: '',
    quality: 'good', // 'excellent', 'good', 'fair', 'poor'
    notes: '',
    harvestDate: new Date().toISOString().split('T')[0],
    animalId: animalData?._id || '',
    batchId: animalData?.batchId || ''
  });
  
  const [availableProductivities, setAvailableProductivities] = useState([]);
  const [recentProductivities, setRecentProductivities] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  // Get product types based on available productivities from database
  const getProductTypes = () => {
    if (availableProductivities.length > 0) {
      return availableProductivities.map(product => ({
        value: product.productType,
        label: product.productType.charAt(0).toUpperCase() + product.productType.slice(1),
        icon: getProductIcon(product.productType),
        unit: product.unit,
        suggestedQuantity: product.suggestedQuantity,
        lastHarvestDate: product.lastHarvestDate
      }));
    }
    
    // Fallback to default types if no data available - return array based on form type
    const defaultProductivity = [
      { value: 'milk', label: 'Milk', icon: Milk, unit: 'liters' },
      { value: 'eggs', label: 'Eggs', icon: Egg, unit: 'pieces' },
      { value: 'wool', label: 'Wool', icon: Package, unit: 'kg' },
      { value: 'honey', label: 'Honey', icon: Package, unit: 'kg' },
      { value: 'other', label: 'Other', icon: Package, unit: 'units' }
    ];
    
    const defaultMeat = [
      { value: 'beef', label: 'Beef', icon: Beef, unit: 'kg' },
      { value: 'pork', label: 'Pork', icon: Beef, unit: 'kg' },
      { value: 'chicken', label: 'Chicken', icon: Beef, unit: 'kg' },
      { value: 'lamb', label: 'Lamb', icon: Beef, unit: 'kg' },
      { value: 'other', label: 'Other Meat', icon: Beef, unit: 'kg' }
    ];
    
    return formData.type === 'meat' ? defaultMeat : defaultProductivity;
  };

  const getProductIcon = (productType) => {
    switch (productType) {
      case 'milk': return Milk;
      case 'eggs': return Egg;
      case 'wool': return Package;
      case 'honey': return Package;
      case 'beef': return Beef;
      case 'pork': return Beef;
      case 'chicken': return Beef;
      case 'lamb': return Beef;
      default: return Package;
    }
  };

  const qualityOptions = [
    { value: 'excellent', label: 'Excellent', color: 'text-green-600' },
    { value: 'good', label: 'Good', color: 'text-blue-600' },
    { value: 'fair', label: 'Fair', color: 'text-yellow-600' },
    { value: 'poor', label: 'Poor', color: 'text-red-600' }
  ];

  useEffect(() => {
    if (animalData) {
      setFormData(prev => ({
        ...prev,
        animalId: animalData._id,
        batchId: animalData.batchId || '',
        type: animalData.type?.name?.toLowerCase().includes('meat') ? 'meat' : 'productivity'
      }));
    }
  }, [animalData]);

  // Fetch available productivities and auto-fill form
  const fetchAvailableProductivities = async () => {
    setLoadingData(true);
    let token; // Declare token outside try block
    
    try {
      // Get auth token from localStorage
      token = localStorage.getItem('token');
      
      console.log('Token from localStorage:', token ? 'Token exists' : 'No token found');
      console.log('Token value (first 20 chars):', token ? token.substring(0, 20) + '...' : 'No token');
      console.log('Animal data:', animalData);
      
      if (!token) {
        console.warn('No authentication token found, using default options');
        setAvailableProductivities([]);
        setRecentProductivities([]);
        setLoadingData(false);
        return;
      }
      
      // If no animal data, fetch general available productivities
      if (!animalData) {
        console.log('No specific animal data, fetching general productivities');
      }
      
      // Test token validity first
      console.log('Testing token validity...');
      try {
        const testResponse = await axios.get('http://localhost:5000/api/notifications/validate-token', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('Token test successful:', testResponse.data);
      } catch (testErr) {
        console.error('Token test failed:', testErr.response?.data);
        throw testErr; // Re-throw to trigger the main catch block
      }
      
      const response = await axios.get('http://localhost:5000/api/notifications/available-productivities', {
        params: {
          animalId: animalData?._id,
          batchId: animalData?.batchId,
          animalType: animalData?.type?.name
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('API Response:', response.data);

      const { availableProductivities, recentProductivities } = response.data;
      setAvailableProductivities(availableProductivities || []);
      setRecentProductivities(recentProductivities || []);

      // Auto-fill form with first available productivity if none selected
      if (availableProductivities.length > 0 && !formData.productType) {
        const firstProduct = availableProductivities[0];
        setFormData(prev => ({
          ...prev,
          productType: firstProduct.productType,
          quantity: firstProduct.suggestedQuantity.toString(),
          unit: firstProduct.unit,
          quality: firstProduct.suggestedQuality
        }));
      }
    } catch (err) {
      console.error('Error fetching available productivities:', err);
      console.error('Error details:', err.response?.data);
      
      if (err.response?.status === 401) {
        console.warn('Authentication failed - token may be expired or invalid');
        console.log('Current token:', token);
        // Clear invalid token
        localStorage.removeItem('token');
        // Show message to user
        setError('Authentication failed. Please log in again.');
      } else {
        setError('Failed to fetch productivity data. Using default options.');
      }
      
      // If authentication fails, show default options
      setAvailableProductivities([]);
      setRecentProductivities([]);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAvailableProductivities();
    }
  }, [isOpen, animalData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Auto-fill with suggested data when product type changes
    if (field === 'productType') {
      const selectedProduct = availableProductivities.find(p => p.productType === value);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          productType: value,
          unit: selectedProduct.unit,
          quantity: selectedProduct.suggestedQuantity.toString(),
          quality: selectedProduct.suggestedQuality
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');
      
      const notificationData = {
        ...formData,
        senderId: userData._id,
        senderName: userData.name,
        senderRole: userData.role,
        timestamp: new Date().toISOString(),
        status: 'pending', // pending, accepted, rejected
        recipientRole: 'inventory_manager'
      };

      const response = await axios.post('http://localhost:5000/api/notifications/productivity', notificationData, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          type: 'productivity',
          productType: '',
          quantity: '',
          unit: '',
          quality: 'good',
          notes: '',
          harvestDate: new Date().toISOString().split('T')[0],
          animalId: '',
          batchId: ''
        });
      }, 2000);

    } catch (err) {
      console.error('Error sending notification:', err);
      setError(err.response?.data?.message || 'Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              formData.type === 'meat' 
                ? 'bg-red-100 dark:bg-red-900/20' 
                : 'bg-green-100 dark:bg-green-900/20'
            }`}>
              {formData.type === 'meat' ? (
                <Beef className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : (
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              )}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Send {formData.type === 'meat' ? 'Meat' : 'Productivity'} Notification
              </h2>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Notify Inventory Manager about harvest details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {success ? (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className={`text-xl font-semibold mb-2 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Notification Sent Successfully!
              </h3>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                The Inventory Manager has been notified about the {formData.type} details.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Type Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('type', 'productivity')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === 'productivity'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : darkMode
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Package className={`h-8 w-8 mx-auto mb-2 ${
                    formData.type === 'productivity' 
                      ? 'text-green-600 dark:text-green-400' 
                      : darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                  <p className={`font-semibold ${
                    formData.type === 'productivity' 
                      ? 'text-green-800 dark:text-green-200' 
                      : darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Productivity
                  </p>
                  <p className={`text-xs ${
                    formData.type === 'productivity' 
                      ? 'text-green-600 dark:text-green-400' 
                      : darkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Milk, Eggs, Wool, etc.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('type', 'meat')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    formData.type === 'meat'
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : darkMode
                        ? 'border-gray-600 hover:border-gray-500'
                        : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <Beef className={`h-8 w-8 mx-auto mb-2 ${
                    formData.type === 'meat' 
                      ? 'text-red-600 dark:text-red-400' 
                      : darkMode ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                  <p className={`font-semibold ${
                    formData.type === 'meat' 
                      ? 'text-red-800 dark:text-red-200' 
                      : darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Meat
                  </p>
                  <p className={`text-xs ${
                    formData.type === 'meat' 
                      ? 'text-red-600 dark:text-red-400' 
                      : darkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                    Beef, Pork, Chicken, etc.
                  </p>
                </button>
              </div>

              {/* Product Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Available Product Types
                </label>
                {loadingData ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className={`ml-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Loading available products...
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {getProductTypes().map((product) => {
                      const IconComponent = product.icon;
                      return (
                        <button
                          key={product.value}
                          type="button"
                          onClick={() => handleInputChange('productType', product.value)}
                          className={`p-3 rounded-lg border-2 transition-all ${
                            formData.productType === product.value
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : darkMode
                                ? 'border-gray-600 hover:border-gray-500'
                                : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <IconComponent className={`h-6 w-6 mx-auto mb-1 ${
                            formData.productType === product.value 
                              ? 'text-blue-600 dark:text-blue-400' 
                              : darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`} />
                          <p className={`text-xs font-medium ${
                            formData.productType === product.value 
                              ? 'text-blue-800 dark:text-blue-200' 
                              : darkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>
                            {product.label}
                          </p>
                          {product.suggestedQuantity > 0 && (
                            <p className={`text-xs mt-1 ${
                              darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                              Last: {product.suggestedQuantity} {product.unit}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Quantity
                  </label>
                  <div className="relative">
                    <Hash className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.quantity}
                      onChange={(e) => handleInputChange('quantity', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      placeholder="Enter quantity"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Unit
                  </label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="kg, liters, pieces"
                    required
                  />
                </div>
              </div>

              {/* Quality and Harvest Date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Quality
                  </label>
                  <select
                    value={formData.quality}
                    onChange={(e) => handleInputChange('quality', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                  >
                    {qualityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Harvest Date
                  </label>
                  <div className="relative">
                    <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="date"
                      value={formData.harvestDate}
                      onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>


              {/* Notes */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Additional Notes
                </label>
                <div className="relative">
                  <FileText className={`absolute left-3 top-3 h-4 w-4 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                      darkMode 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Add any additional notes about the harvest..."
                  />
                </div>
              </div>

              {/* Animal/Batch Info */}
              {(formData.animalId || formData.batchId) ? (
                <div className={`p-4 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Related Animal/Batch
                  </h4>
                  <div className="space-y-1 text-sm">
                    {formData.animalId && (
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        Animal ID: {formData.animalId}
                      </p>
                    )}
                    {formData.batchId && (
                      <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                        Batch ID: {formData.batchId}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className={`p-4 rounded-lg border ${
                  darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${
                    darkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    General Productivity Notification
                  </h4>
                  <p className={`text-sm ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    No specific animal selected. You can still send productivity notifications for general harvests.
                  </p>
                </div>
              )}

              {/* Recent Productivity Data */}
              {recentProductivities.length > 0 && (
                <div className={`p-4 rounded-lg border ${
                  darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h4 className={`font-medium mb-3 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Recent Harvest History
                  </h4>
                  
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {recentProductivities.slice(0, 5).map((item) => (
                      <div key={item.id} className={`p-3 rounded-lg ${
                        darkMode ? 'bg-gray-600' : 'bg-white'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const IconComponent = getProductIcon(item.productType);
                              return IconComponent ? <IconComponent className="h-4 w-4 text-green-500" /> : null;
                            })()}
                            <span className={`text-sm font-medium ${
                              darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              {item.productType}
                            </span>
                          </div>
                          <span className={`text-sm ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {new Date(item.date).toLocaleDateString()}
                          </p>
                          <p className={`text-xs ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            by {item.recordedBy}
                          </p>
                        </div>
                        {item.notes && (
                          <p className={`text-xs mt-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {item.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.productType || !formData.quantity}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Notification
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductivityNotification;
