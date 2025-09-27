import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Notification title is required"],
    trim: true,
  },
  message: {
    type: String,
    required: [true, "Notification message is required"],
    trim: true,
  },
  type: {
    type: String,
    required: [true, "Notification type is required"],
    enum: {
      values: ["feed_stock", "health", "expiry", "productivity", "feeding", "zone", "meat", "system"],
      message: "Invalid notification type"
    }
  },
  priority: {
    type: String,
    required: [true, "Notification priority is required"],
    enum: {
      values: ["low", "medium", "high", "critical"],
      message: "Invalid notification priority"
    },
    default: "medium"
  },
  category: {
    type: String,
    required: [true, "Notification category is required"],
    enum: {
      values: ["alert", "warning", "info", "success"],
      message: "Invalid notification category"
    }
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  relatedEntity: {
    type: {
      type: String,
      enum: ["animal", "feed", "batch", "zone", "health_record", "feeding_schedule"]
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedEntity.type"
    }
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  expiresAt: {
    type: Date,
    default: null // null means notification doesn't expire
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for better query performance
NotificationSchema.index({ type: 1, priority: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time ago
NotificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`; // 30 days
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`; // months
});

// Virtual for formatted timestamp
NotificationSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
});

// Static method to create notification with duplicate prevention
NotificationSchema.statics.createNotification = async function(data) {
  // Check for existing similar notification within the last 6 hours for critical/high priority
  // and 24 hours for medium/low priority
  const timeWindow = data.priority === 'critical' || data.priority === 'high' 
    ? 6 * 60 * 60 * 1000  // 6 hours
    : 24 * 60 * 60 * 1000; // 24 hours
  
  const timeThreshold = new Date(Date.now() - timeWindow);
  
  // Build query for duplicate detection
  const duplicateQuery = {
    type: data.type,
    createdAt: { $gte: timeThreshold },
    read: false // Only check unread notifications
  };

  // For feed stock and zone notifications, check by related entity
  if (data.type === 'feed_stock' || data.type === 'zone') {
    duplicateQuery.relatedEntity = data.relatedEntity;
  } else {
    // For other types, check by title and message
    duplicateQuery.title = data.title;
    duplicateQuery.message = data.message;
  }
  
  const existingNotification = await this.findOne(duplicateQuery);

  // If similar notification exists and is unread, don't create a new one
  if (existingNotification) {
    console.log(`Duplicate notification prevented: ${data.title} (${data.type})`);
    return existingNotification;
  }

  // Create new notification
  const notification = await this.create({
    title: data.title,
    message: data.message,
    type: data.type,
    priority: data.priority || 'medium',
    category: data.category || 'info',
    relatedEntity: data.relatedEntity,
    metadata: data.metadata || {},
    expiresAt: data.expiresAt
  });

  console.log(`New notification created: ${data.title} (${data.type})`);
  return notification;
};

// Static method to clean up old read notifications
NotificationSchema.statics.cleanupOldNotifications = async function() {
  try {
    // Delete read notifications older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const result = await this.deleteMany({
      read: true,
      createdAt: { $lt: thirtyDaysAgo }
    });
    
    console.log(`Cleaned up ${result.deletedCount} old read notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old notifications:', error);
    return 0;
  }
};

export default mongoose.model("Notification", NotificationSchema);
