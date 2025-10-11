import express from 'express';
import {
  sendProductivityNotification,
  getProductivityNotifications,
  updateProductivityNotification,
  markProductivityNotificationAsRead,
  getRealProductivityData,
  updateRealProductivityData,
  getAvailableProductivities
} from '../controllers/productivityNotificationController.js';
import { protect } from '../../middleware/authMiddleware.js';

const router = express.Router();

// Send productivity notification (Animal Manager)
router.post('/productivity', protect, sendProductivityNotification);

// Get productivity notifications (Inventory Manager)
router.get('/productivity', protect, getProductivityNotifications);

// Update productivity notification (Inventory Manager)
router.put('/productivity/:notificationId', protect, updateProductivityNotification);

// Mark productivity notification as read
router.patch('/productivity/:notificationId/read', protect, markProductivityNotificationAsRead);

// Get available productivities for auto-filling form
router.get('/available-productivities', protect, getAvailableProductivities);

// Test endpoint without authentication
router.get('/test', (req, res) => {
  res.json({ message: 'Productivity notification API is working!' });
});

// Token validation endpoint with authentication
router.get('/validate-token', protect, (req, res) => {
  res.json({ 
    message: 'Token is valid!', 
    user: {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    }
  });
});

// Get real productivity data from database
router.get('/productivity-data', protect, getRealProductivityData);

// Update real productivity data in database
router.put('/productivity-data', protect, updateRealProductivityData);

export const productivityNotificationRouter = router;
