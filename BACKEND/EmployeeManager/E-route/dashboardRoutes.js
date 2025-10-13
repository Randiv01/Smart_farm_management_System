// E-route/dashboardRoutes.js - Dashboard API Routes
import express from "express";
import {
  getDashboardMetrics,
  getEmployeeStatusData,
  getWeeklyAttendanceData,
  getDashboardSummary
} from "../E-control/dashboardController.js";

const router = express.Router();

// Get dashboard metrics (total employees, present today, on leave, overtime hours)
router.get("/metrics", getDashboardMetrics);

// Get employee status distribution for pie chart
router.get("/employee-status", getEmployeeStatusData);

// Get weekly attendance data for bar chart
router.get("/weekly-attendance", getWeeklyAttendanceData);

// Get complete dashboard summary (all data in one call)
router.get("/summary", getDashboardSummary);

export default router;
