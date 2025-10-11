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
  scanQRCode,
  debugAttendance,
  debugDate,
} from "../E-control/attendanceController.js";

const router = express.Router();

// Middleware to log all requests for debugging
router.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.method === "GET" ? req.query : req.body);
  next();
});

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

// QR Code scan endpoint
router.post("/scan", scanQRCode);

// Update attendance record (PATCH or PUT)
router.patch("/:id", updateAttendance);
router.put("/:id", updateAttendance);

// Delete attendance record
router.delete("/:id", deleteAttendance);

// Debug endpoints
router.get("/debug/:employeeId", debugAttendance);
router.get("/debug-date", debugDate);

export default router;
