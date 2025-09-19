import express from "express";
import {
  getOvertimeRecords,
  getOvertimeRecord,
  createOvertimeRecord,
  updateOvertimeRecord,
  deleteOvertimeRecord,
  getOvertimeAnalytics
} from "../E-control/overtimeController.js";

const router = express.Router();

// Overtime records routes
router.get("/", getOvertimeRecords);
router.get("/analytics", getOvertimeAnalytics);
router.get("/:id", getOvertimeRecord);
router.post("/", createOvertimeRecord);
router.put("/:id", updateOvertimeRecord);
router.delete("/:id", deleteOvertimeRecord);

export default router;