import Notification from '../models/Notification.js';
import AnimalProductivity from '../models/AnimalProductivity.js';
import MeatProductivity from '../models/MeatProductivity.js';
import HarvestHistory from '../models/HarvestHistory.js';
import Animal from '../models/Animal.js';
import mongoose from 'mongoose';

// Send productivity/meat notification to inventory manager
export const sendProductivityNotification = async (req, res) => {
  try {
    const {
      type, // 'productivity' or 'meat'
      productType,
      quantity,
      unit,
      quality,
      notes,
      harvestDate,
      animalId,
      batchId,
      estimatedValue,
      senderId,
      senderName,
      senderRole,
      recipientRole
    } = req.body;

    // Validate required fields
    if (!type || !productType || !quantity || !unit || !senderId) {
      return res.status(400).json({
        message: 'Missing required fields: type, productType, quantity, unit, senderId'
      });
    }

    // Create notification
    const notification = new Notification({
      type: 'productivity_notification',
      title: `${type === 'meat' ? 'Meat' : 'Productivity'} Harvest Notification`,
      message: `${senderName} has reported ${quantity} ${unit} of ${productType} (${quality} quality)`,
      data: {
        notificationType: 'productivity',
        harvestType: type,
        productType,
        quantity: parseFloat(quantity),
        unit,
        quality,
        notes: notes || '',
        harvestDate,
        animalId: animalId || null,
        batchId: batchId || null,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : null,
        senderId,
        senderName,
        senderRole,
        recipientRole,
        status: 'pending',
        editable: true
      },
      recipientRole,
      senderId,
      priority: 'medium',
      status: 'unread',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await notification.save();

    // Send real-time notification via Socket.io
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`role-${recipientRole}`).emit('new_notification', {
        id: notification._id,
        type: 'productivity_notification',
        title: notification.title,
        message: notification.message,
        data: notification.data,
        timestamp: notification.createdAt
      });
    }

    res.status(201).json({
      message: 'Productivity notification sent successfully',
      notification: {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        data: notification.data
      }
    });

  } catch (error) {
    console.error('Error sending productivity notification:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get productivity notifications for inventory manager
export const getProductivityNotifications = async (req, res) => {
  try {
    const { role, userId } = req.user;
    
    // Only inventory managers can view productivity notifications
    if (role !== 'inventory_manager') {
      return res.status(403).json({
        message: 'Access denied. Only inventory managers can view productivity notifications.'
      });
    }

    const notifications = await Notification.find({
      type: 'productivity_notification',
      $or: [
        { recipientRole: role },
        { recipientId: userId }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(50);

    res.json({
      notifications: notifications.map(notification => ({
        id: notification._id,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        status: notification.status,
        priority: notification.priority,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching productivity notifications:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update productivity notification (edit quantity, accept/reject)
export const updateProductivityNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { action, quantity, notes, estimatedValue } = req.body;
    const { userId, role } = req.user;

    // Only inventory managers can update productivity notifications
    if (role !== 'inventory_manager') {
      return res.status(403).json({
        message: 'Access denied. Only inventory managers can update productivity notifications.'
      });
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    if (notification.type !== 'productivity_notification') {
      return res.status(400).json({
        message: 'Invalid notification type'
      });
    }

    let updateData = {};

    switch (action) {
      case 'accept':
        updateData = {
          status: 'read',
          'data.status': 'accepted',
          'data.processedBy': userId,
          'data.processedAt': new Date(),
          updatedAt: new Date()
        };
        break;

      case 'reject':
        updateData = {
          status: 'read',
          'data.status': 'rejected',
          'data.processedBy': userId,
          'data.processedAt': new Date(),
          updatedAt: new Date()
        };
        break;

      case 'edit':
        if (quantity !== undefined) {
          updateData['data.quantity'] = parseFloat(quantity);
        }
        if (notes !== undefined) {
          updateData['data.notes'] = notes;
        }
        if (estimatedValue !== undefined) {
          updateData['data.estimatedValue'] = estimatedValue ? parseFloat(estimatedValue) : null;
        }
        updateData['data.editedBy'] = userId;
        updateData['data.editedAt'] = new Date();
        updateData.updatedAt = new Date();
        break;

      default:
        return res.status(400).json({
          message: 'Invalid action. Use: accept, reject, or edit'
        });
    }

    const updatedNotification = await Notification.findByIdAndUpdate(
      notificationId,
      { $set: updateData },
      { new: true }
    );

    // Send real-time update via Socket.io
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`role-${notification.data.senderRole}`).emit('notification_updated', {
        id: updatedNotification._id,
        action,
        data: updatedNotification.data,
        timestamp: new Date()
      });
    }

    res.json({
      message: `Notification ${action}ed successfully`,
      notification: {
        id: updatedNotification._id,
        title: updatedNotification.title,
        message: updatedNotification.message,
        data: updatedNotification.data,
        status: updatedNotification.status
      }
    });

  } catch (error) {
    console.error('Error updating productivity notification:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get available productivities for auto-filling form
export const getAvailableProductivities = async (req, res) => {
  try {
    console.log('getAvailableProductivities called');
    console.log('Request user:', req.user);
    console.log('Request headers:', req.headers);
    console.log('Query params:', req.query);
    
    const { animalId, batchId, animalType } = req.query;
    const { userId, role } = req.user;

    let availableProductivities = [];
    let recentProductivities = [];

    // Get recent productivity data for the specific animal/batch
    const productivityQuery = {};
    if (animalId) {
      productivityQuery.animalId = animalId;
    }
    if (batchId) {
      productivityQuery.batchId = batchId;
    }

    // Get last 30 days of productivity data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    productivityQuery.date = { $gte: thirtyDaysAgo };

    recentProductivities = await AnimalProductivity.find(productivityQuery)
      .populate('animalId', 'animalId type data')
      .sort({ date: -1 })
      .limit(20);

    // Get available product types based on animal type and recent data
    const productTypeMap = {
      'buffalo': ['milk'],
      'cow': ['milk'],
      'goat': ['milk'],
      'sheep': ['wool', 'milk'],
      'duck': ['eggs'],
      'chicken': ['eggs'],
      'pig': ['meat'],
      'cattle': ['meat'],
      'lamb': ['meat']
    };

    // Determine available product types based on animal type
    const animalTypeLower = animalType?.toLowerCase() || '';
    let availableTypes = [];
    
    // Check if animal type matches any key in the map
    for (const [key, products] of Object.entries(productTypeMap)) {
      if (animalTypeLower.includes(key)) {
        availableTypes = [...availableTypes, ...products];
      }
    }

    // If no specific match, get from recent productivity data
    if (availableTypes.length === 0 && recentProductivities.length > 0) {
      availableTypes = [...new Set(recentProductivities.map(p => p.productType))];
    }

    // If still no types, use default based on common patterns
    if (availableTypes.length === 0) {
      if (animalTypeLower.includes('milk') || animalTypeLower.includes('dairy')) {
        availableTypes = ['milk'];
      } else if (animalTypeLower.includes('egg') || animalTypeLower.includes('poultry')) {
        availableTypes = ['eggs'];
      } else if (animalTypeLower.includes('wool') || animalTypeLower.includes('sheep')) {
        availableTypes = ['wool'];
      } else if (animalTypeLower.includes('meat') || animalTypeLower.includes('beef') || animalTypeLower.includes('pork')) {
        availableTypes = ['meat'];
      } else {
        availableTypes = ['milk', 'eggs', 'wool', 'honey', 'other'];
      }
    }

    // Get recent quantities for each product type
    const recentQuantities = {};
    recentProductivities.forEach(item => {
      if (!recentQuantities[item.productType]) {
        recentQuantities[item.productType] = {
          quantity: item.quantity,
          unit: item.unit || 'units',
          date: item.date,
          quality: 'good' // Default quality
        };
      }
    });

    // Format available productivities
    availableProductivities = availableTypes.map(type => {
      const recent = recentQuantities[type];
      return {
        productType: type,
        suggestedQuantity: recent?.quantity || 0,
        unit: recent?.unit || (type === 'milk' ? 'liters' : type === 'eggs' ? 'pieces' : type === 'wool' ? 'kg' : 'units'),
        lastHarvestDate: recent?.date,
        suggestedQuality: recent?.quality || 'good'
      };
    });

    res.json({
      availableProductivities,
      recentProductivities: recentProductivities.map(item => ({
        id: item._id,
        productType: item.productType,
        quantity: item.quantity,
        unit: item.unit || 'units',
        date: item.date,
        notes: item.notes,
        recordedBy: item.recordedBy
      })),
      animalType: animalType,
      animalId: animalId,
      batchId: batchId
    });

  } catch (error) {
    console.error('Error fetching available productivities:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get real productivity data from database
export const getRealProductivityData = async (req, res) => {
  try {
    const { type, animalId, batchId, dateRange } = req.query;
    const { userId, role } = req.user;

    let productivityData = [];
    let meatData = [];

    // Get animal productivity data
    if (!type || type === 'productivity') {
      const animalProductivityQuery = {};
      
      if (animalId) {
        animalProductivityQuery.animalId = animalId;
      }
      if (batchId) {
        animalProductivityQuery.batchId = batchId;
      }
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        animalProductivityQuery.date = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      productivityData = await AnimalProductivity.find(animalProductivityQuery)
        .populate('animalId', 'animalId type data')
        .sort({ date: -1 })
        .limit(50);
    }

    // Get meat productivity data
    if (!type || type === 'meat') {
      const meatProductivityQuery = {};
      
      if (batchId) {
        meatProductivityQuery.batchId = batchId;
      }
      if (dateRange) {
        const [startDate, endDate] = dateRange.split(',');
        meatProductivityQuery.productionDate = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      meatData = await MeatProductivity.find(meatProductivityQuery)
        .sort({ productionDate: -1 })
        .limit(50);
    }

    // Get harvest history
    const harvestHistory = await HarvestHistory.find({})
      .sort({ productionDate: -1 })
      .limit(20);

    res.json({
      productivityData: productivityData.map(item => ({
        id: item._id,
        type: 'productivity',
        animalId: item.animalId?._id,
        animalData: item.animalId,
        batchId: item.batchId,
        productType: item.productType,
        quantity: item.quantity,
        unit: item.unit || 'units',
        date: item.date,
        notes: item.notes,
        recordedBy: item.recordedBy,
        isGroup: item.isGroup,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      meatData: meatData.map(item => ({
        id: item._id,
        type: 'meat',
        batchId: item.batchId,
        batchName: item.batchName,
        animalType: item.animalType,
        meatType: item.meatType,
        quantity: item.quantity,
        unit: item.unit,
        productionDate: item.productionDate,
        expiryDate: item.expiryDate,
        status: item.status,
        healthCondition: item.healthCondition,
        notes: item.notes,
        slaughterDate: item.slaughterDate,
        totalMeatProduced: item.totalMeatProduced,
        storageLocation: item.storageLocation,
        harvestNotes: item.harvestNotes,
        daysActive: item.daysActive,
        daysUntilExpiry: item.daysUntilExpiry,
        isExpired: item.isExpired,
        isNearExpiry: item.isNearExpiry,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      })),
      harvestHistory: harvestHistory.map(item => ({
        id: item._id,
        batchId: item.batchId,
        batchName: item.batchName,
        animalType: item.animalType,
        meatType: item.meatType,
        quantity: item.quantity,
        unit: item.unit,
        productionDate: item.productionDate,
        slaughterDate: item.slaughterDate,
        totalMeatProduced: item.totalMeatProduced,
        storageLocation: item.storageLocation,
        notes: item.notes,
        harvestNotes: item.harvestNotes,
        statusAtHarvest: item.statusAtHarvest,
        healthConditionAtHarvest: item.healthConditionAtHarvest,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching real productivity data:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update real productivity data in database
export const updateRealProductivityData = async (req, res) => {
  try {
    const { dataId, type, updates } = req.body;
    const { userId, role } = req.user;

    let updatedData;

    if (type === 'productivity') {
      updatedData = await AnimalProductivity.findByIdAndUpdate(
        dataId,
        { 
          ...updates,
          updatedAt: new Date(),
          recordedBy: userId
        },
        { new: true }
      ).populate('animalId', 'animalId type data');
    } else if (type === 'meat') {
      updatedData = await MeatProductivity.findByIdAndUpdate(
        dataId,
        { 
          ...updates,
          updatedAt: new Date()
        },
        { new: true }
      );
    } else {
      return res.status(400).json({
        message: 'Invalid data type. Use "productivity" or "meat"'
      });
    }

    if (!updatedData) {
      return res.status(404).json({
        message: 'Data not found'
      });
    }

    res.json({
      message: 'Productivity data updated successfully',
      data: updatedData
    });

  } catch (error) {
    console.error('Error updating productivity data:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Mark productivity notification as read
export const markProductivityNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const { userId, role } = req.user;

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { 
        $set: { 
          status: 'read',
          updatedAt: new Date()
        } 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    res.json({
      message: 'Notification marked as read',
      notification: {
        id: notification._id,
        status: notification.status
      }
    });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
};
