import express from "express";
import {
  getSalaries,
  getSalarySummary,
  getSalaryById,
  processPayroll,
  updateSalary,
  deleteSalary,
  exportSalaryExcel,
  exportSalaryPDF,
  getSalaryAnalytics,
  createSalary,
  getEmployeesForSalary,
  debugOvertimeData
} from "../E-control/salaryController.js";

const router = express.Router();

// GET routes
router.get("/", getSalaries); // Get all salaries with filtering
router.get("/summary", getSalarySummary); // Get salary summary for dashboard
router.get("/analytics", getSalaryAnalytics); // Get analytics data for charts
router.get("/employees", getEmployeesForSalary); // Get employees for salary form
router.get("/debug/overtime", debugOvertimeData); // Debug overtime data
router.get("/export/excel", exportSalaryExcel); // Export to Excel
router.get("/export/pdf", exportSalaryPDF); // Export to PDF
router.get("/:id", getSalaryById); // Get single salary record

// POST routes
router.post("/", createSalary); // Create individual salary record
router.post("/process", processPayroll); // Process payroll for a month

// PUT routes
router.put("/:id", updateSalary); // Update salary record

// DELETE routes
router.delete("/:id", deleteSalary); // Delete salary record

export default router;
