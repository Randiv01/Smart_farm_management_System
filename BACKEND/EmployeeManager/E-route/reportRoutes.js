// E-route/reportRoutes.js - Employee Reports Routes
import express from "express";
import {
  getEmployeesForReports,
  getEmployeeReport,
  getAttendanceReport,
  getOvertimeReport,
  getSalaryReport,
  getLeaveReport,
  exportEmployeeReport,
  exportAttendanceReport,
  exportOvertimeReport,
  exportSalaryReport,
  exportLeaveReport
} from "../E-control/reportController.js";

const router = express.Router();

// Get employees with search and filter for reports
router.get("/employees", getEmployeesForReports);

// Get comprehensive employee report
router.get("/employee/:employeeId", getEmployeeReport);

// Get detailed reports for specific aspects
router.get("/employee/:employeeId/attendance", getAttendanceReport);
router.get("/employee/:employeeId/overtime", getOvertimeReport);
router.get("/employee/:employeeId/salary", getSalaryReport);
router.get("/employee/:employeeId/leave", getLeaveReport);

// Export comprehensive report
router.get("/employee/:employeeId/export", exportEmployeeReport);

// Export specific report types as PDF
router.get("/employee/:employeeId/attendance/export", exportAttendanceReport);
router.get("/employee/:employeeId/overtime/export", exportOvertimeReport);
router.get("/employee/:employeeId/salary/export", exportSalaryReport);
router.get("/employee/:employeeId/leave/export", exportLeaveReport);

export default router;

