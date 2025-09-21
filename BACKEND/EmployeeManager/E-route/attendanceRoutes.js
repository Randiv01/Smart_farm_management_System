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

// Update attendance record (PATCH or PUT)
router.patch("/:id", updateAttendance);
router.put("/:id", updateAttendance);

// Delete attendance record
router.delete("/:id", deleteAttendance);

export default router;
