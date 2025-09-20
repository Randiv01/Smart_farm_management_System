// Backend: attendanceRoutes.js
import express from "express";
import {
  getAttendance,
  getSummary,
  getRecentCheckins,
  getReports,
  createAttendance,
  updateAttendance,
  deleteAttendance,
} from "../E-control/attendanceController.js";

const router = express.Router();

// Get all attendance records with optional filtering
router.get("/", getAttendance);

// Get attendance summary for a specific date
router.get("/summary/:date", getSummary);

// Get recent check-ins
router.get("/recent", getRecentCheckins);

// Get attendance reports for chart
router.get("/reports", getReports);

// Create new attendance record
router.post("/", createAttendance);

// Update attendance record
router.patch("/:id", updateAttendance);

// Delete attendance record
router.delete("/:id", deleteAttendance);

export default router;