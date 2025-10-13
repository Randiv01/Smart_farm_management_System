import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'success', 'error', 'urgent'],
    default: 'info'
  },
  category: {
    type: String,
    enum: [
      'daily_operations',
      'leave_management', 
      'attendance',
      'overtime',
      'employee_status',
      'system',
      'compliance'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  scheduledTime: {
    type: Date,
    default: Date.now
  },
  metadata: {
    employeeId: String,
    department: String,
    actionRequired: Boolean,
    actionType: String, // 'approve_leave', 'approve_overtime', 'review_attendance', etc.
    actionData: mongoose.Schema.Types.Mixed
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  readAt: {
    type: Date
  }
});

// Index for efficient queries
notificationSchema.index({ scheduledTime: 1, isRead: 1 });
notificationSchema.index({ category: 1, priority: 1 });

const ENotification = mongoose.model('ENotification', notificationSchema);

export default ENotification;
