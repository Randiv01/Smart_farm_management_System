import express from "express";
import {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats
} from "../controllers/notificationController.js";

const router = express.Router();

// Get all notifications
router.get("/", getNotifications);

// Get notification statistics
router.get("/stats", getNotificationStats);

// Get notification by ID
router.get("/:id", getNotificationById);

// Mark notification as read
router.patch("/:id/read", markAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// Delete notification
router.delete("/:id", deleteNotification);

export default router;

