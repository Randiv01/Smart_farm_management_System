import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Beef, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Clock, 
  User, 
  Calendar,
  DollarSign,
  Hash,
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { useTheme } from '../../AnimalManagement/contexts/ThemeContext.js';
import axios from 'axios';

const ProductivityNotifications = ({ isOpen, onClose }) => {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingNotification, setEditingNotification] = useState(null);
  const [editForm, setEditForm] = useState({
    quantity: '',
    notes: '',
    estimatedValue: ''
  });
  const [realProductivityData, setRealProductivityData] = useState([]);
  const [realMeatData, setRealMeatData] = useState([]);
  const [loadingRealData, setLoadingRealData] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      fetchRealProductivityData();
    }
  }, [isOpen]);

  // Fetch real productivity data from database
  const fetchRealProductivityData = async () => {
    setLoadingRealData(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications/productivity-data', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setRealProductivityData(response.data.productivityData || []);
      setRealMeatData(response.data.meatData || []);
    } catch (err) {
      console.error('Error fetching real productivity data:', err);
    } finally {
      setLoadingRealData(false);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/notifications/productivity', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setNotifications(response.data.notifications || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (notificationId, action, data = {}) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/notifications/productivity/${notificationId}`,
        { action, ...data },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, ...response.data.notification }
            : notification
        )
      );
      
      setEditingNotification(null);
      setEditForm({ quantity: '', notes: '', estimatedValue: '' });
      
    } catch (err) {
      console.error('Error updating notification:', err);
      setError('Failed to update notification');
    }
  };

  const startEditing = (notification) => {
    setEditingNotification(notification.id);
    setEditForm({
      quantity: notification.data.quantity.toString(),
      notes: notification.data.notes || '',
      estimatedValue: notification.data.estimatedValue?.toString() || ''
    });
  };

  const cancelEditing = () => {
    setEditingNotification(null);
    setEditForm({ quantity: '', notes: '', estimatedValue: '' });
  };

  const saveEdit = () => {
    if (editingNotification) {
      handleAction(editingNotification, 'edit', editForm);
    }
  };

  // Update real productivity data in database
  const updateRealData = async (dataId, type, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5000/api/notifications/productivity-data', {
        dataId,
        type,
        updates
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Refresh real data
      fetchRealProductivityData();
      
      return response.data;
    } catch (err) {
      console.error('Error updating real productivity data:', err);
      setError('Failed to update productivity data');
    }
  };

  const getProductIcon = (productType, harvestType) => {
    if (harvestType === 'meat') {
      return <Beef className="h-5 w-5 text-red-500" />;
    }
    
    switch (productType) {
      case 'milk':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'eggs':
        return <Package className="h-5 w-5 text-yellow-500" />;
      case 'wool':
        return <Package className="h-5 w-5 text-gray-500" />;
      case 'honey':
        return <Package className="h-5 w-5 text-orange-500" />;
      default:
        return <Package className="h-5 w-5 text-green-500" />;
    }
  };

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'good': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'fair': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'poor': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'rejected': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'pending': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div className={`relative w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${
          darkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Productivity Notifications
              </h2>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Manage harvest notifications from Animal Management
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
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Loading notifications...
              </span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className={`text-lg font-semibold mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                No Notifications
              </h3>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                No productivity notifications from Animal Management yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-6 rounded-xl border ${
                    darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getProductIcon(notification.data.productType, notification.data.harvestType)}
                      <div>
                        <h3 className={`font-semibold ${
                          darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {notification.data.harvestType === 'meat' ? 'Meat' : 'Productivity'} Harvest
                        </h3>
                        <p className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          From: {notification.data.senderName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(notification.data.quality)}`}>
                        {notification.data.quality}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(notification.data.status)}`}>
                        {notification.data.status}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {editingNotification === notification.id ? (
                          <input
                            type="number"
                            step="0.01"
                            value={editForm.quantity}
                            onChange={(e) => setEditForm(prev => ({ ...prev, quantity: e.target.value }))}
                            className={`w-20 px-2 py-1 border rounded ${
                              darkMode 
                                ? 'bg-gray-600 border-gray-500 text-white' 
                                : 'bg-white border-gray-300 text-gray-900'
                            }`}
                          />
                        ) : (
                          `${notification.data.quantity} ${notification.data.unit}`
                        )}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-500" />
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {notification.data.productType}
                      </span>
                    </div>
                    
                    {notification.data.estimatedValue && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-500" />
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          ${notification.data.estimatedValue}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Harvest Date */}
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Harvest Date: {new Date(notification.data.harvestDate).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Notes */}
                  {notification.data.notes && (
                    <div className="mb-4">
                      <p className={`text-sm font-medium mb-1 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Notes:
                      </p>
                      {editingNotification === notification.id ? (
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          rows={2}
                          className={`w-full px-3 py-2 border rounded ${
                            darkMode 
                              ? 'bg-gray-600 border-gray-500 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        />
                      ) : (
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {notification.data.notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Received: {formatDate(notification.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  {notification.data.status === 'pending' && (
                    <div className="flex items-center gap-3">
                      {editingNotification === notification.id ? (
                        <>
                          <button
                            onClick={saveEdit}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Check className="h-4 w-4" />
                            Save Changes
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleAction(notification.id, 'accept')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => handleAction(notification.id, 'reject')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </button>
                          <button
                            onClick={() => startEditing(notification)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Status Message */}
                  {notification.data.status !== 'pending' && (
                    <div className={`p-3 rounded-lg ${
                      notification.data.status === 'accepted' 
                        ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}>
                      <p className={`text-sm font-medium ${
                        notification.data.status === 'accepted' 
                          ? 'text-green-800 dark:text-green-200'
                          : 'text-red-800 dark:text-red-200'
                      }`}>
                        {notification.data.status === 'accepted' 
                          ? '✅ Notification accepted and processed'
                          : '❌ Notification rejected'
                        }
                      </p>
                      {notification.data.processedAt && (
                        <p className={`text-xs mt-1 ${
                          notification.data.status === 'accepted' 
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          Processed: {formatDate(notification.data.processedAt)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Real Productivity Data Section */}
          <div className="mt-8">
            <div className={`p-6 rounded-xl border ${
              darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Current Database Records
              </h3>
              
              {loadingRealData ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className={`ml-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Loading database records...
                  </span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Productivity Data */}
                  {realProductivityData.length > 0 && (
                    <div>
                      <h4 className={`font-medium mb-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Animal Productivity Records
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {realProductivityData.slice(0, 6).map((item) => (
                          <div key={item.id} className={`p-3 rounded-lg border ${
                            darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-green-500" />
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
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {new Date(item.date).toLocaleDateString()}
                              </span>
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {item.recordedBy}
                              </span>
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

                  {/* Meat Data */}
                  {realMeatData.length > 0 && (
                    <div>
                      <h4 className={`font-medium mb-3 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Meat Production Records
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {realMeatData.slice(0, 6).map((item) => (
                          <div key={item.id} className={`p-3 rounded-lg border ${
                            darkMode ? 'bg-gray-600 border-gray-500' : 'bg-gray-50 border-gray-200'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Beef className="h-4 w-4 text-red-500" />
                                <span className={`text-sm font-medium ${
                                  darkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {item.meatType}
                                </span>
                              </div>
                              <span className={`text-sm ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center justify-between text-xs">
                              <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                                {new Date(item.productionDate).toLocaleDateString()}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.status === 'Fresh' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                item.status === 'Stored' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                                item.status === 'Processed' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300' :
                                item.status === 'Sold' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                              }`}>
                                {item.status}
                              </span>
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

                  {realProductivityData.length === 0 && realMeatData.length === 0 && (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        No productivity records found in database
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductivityNotifications;
