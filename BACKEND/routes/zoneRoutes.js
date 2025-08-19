import express from "express";
import {
  getZones,
  addZone,
  updateZone,
  deleteZone,
  getZoneTypeCounts, // Import the new function
  getFarmUtilization // Import the new function
} from "../controllers/zoneController.js";

const router = express.Router();

router.get("/", getZones);
router.post("/", addZone);
router.put("/:id", updateZone);
router.delete("/:id", deleteZone);

// New routes to match the frontend
router.get("/type-counts", getZoneTypeCounts);
router.get("/utilization", getFarmUtilization);

export default router;