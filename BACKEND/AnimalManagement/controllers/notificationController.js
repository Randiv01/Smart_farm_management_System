import Notification from "../models/Notification.js";

// Get all notifications
export const getNotifications = async (req, res) => {
  try {
    const { type, priority, read, limit = 50, page = 1 } = req.query;
    
    // Build filter object
    const filter = {};
    if (type) filter.type = type;
    if (priority) filter.priority = priority;
    if (read !== undefined) filter.read = read === 'true';
    
    // Add expiry filter (only show non-expired notifications)
    filter.$or = [
      { expiresAt: null },
      { expiresAt: { $gt: new Date() } }
    ];

    const skip = (page - 1) * limit;
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ ...filter, read: false });

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching notifications"
    });
  }
};

// Get notification by ID
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Get notification by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching notification"
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { 
        read: true, 
        readAt: new Date() 
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error marking notification as read"
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { read: false },
      { 
        read: true, 
        readAt: new Date() 
      }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error marking all notifications as read"
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting notification"
    });
  }
};

// Create notification (for internal use)
export const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.createNotification(notificationData);
    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

// Get notification statistics
export const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ["$read", false] }, 1, 0]
            }
          },
          critical: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ["$priority", "critical"] }, { $eq: ["$read", false] }] },
                1,
                0
              ]
            }
          },
          byType: {
            $push: {
              type: "$type",
              priority: "$priority",
              read: "$read"
            }
          }
        }
      }
    ]);

    // Process by type statistics
    const byType = {};
    if (stats[0] && stats[0].byType) {
      stats[0].byType.forEach(item => {
        if (!byType[item.type]) {
          byType[item.type] = { total: 0, unread: 0, critical: 0 };
        }
        byType[item.type].total++;
        if (!item.read) byType[item.type].unread++;
        if (item.priority === 'critical' && !item.read) byType[item.type].critical++;
      });
    }

    res.status(200).json({
      success: true,
      data: {
        total: stats[0]?.total || 0,
        unread: stats[0]?.unread || 0,
        critical: stats[0]?.critical || 0,
        byType
      }
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching notification statistics"
    });
  }
};
