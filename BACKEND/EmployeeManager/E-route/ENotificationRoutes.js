import express from "express";
import {
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  generateDailyNotifications,
  generateAllNotifications
} from "../E-control/ENotificationController.js";

const router = express.Router();

// Get notifications with filtering options
router.get("/", getNotifications);

// Create new notification
router.post("/", createNotification);

// Mark single notification as read
router.patch("/:id/read", markAsRead);

// Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// Delete notification
router.delete("/:id", deleteNotification);

// Generate daily notifications (for testing/scheduling)
router.post("/generate-daily", generateDailyNotifications);

// Generate all notifications (for testing/scheduling)
router.post("/generate-all", generateAllNotifications);

export default router;
