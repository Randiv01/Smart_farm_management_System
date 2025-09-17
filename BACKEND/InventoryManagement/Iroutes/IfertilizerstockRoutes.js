import express from "express";
import {
  getFertilizers,
  getFertilizer,
  createFertilizer,
  updateFertilizer,
  deleteFertilizer,
  refillFertilizer,
  useFertilizer,
  getUsageData,
  getLowStockAlerts,
  getExpiringAlerts
} from "../Icontrollers/IfertilizerstockController.js";

const router = express.Router();

// Fertilizer routes
router.get("/", getFertilizers);
router.get("/alerts/low-stock", getLowStockAlerts);
router.get("/alerts/expiring", getExpiringAlerts);
router.get("/:id", getFertilizer);
router.get("/usage/:id", getUsageData);
router.post("/", createFertilizer);
router.put("/:id", updateFertilizer);
router.delete("/:id", deleteFertilizer);
router.patch("/refill/:id", refillFertilizer);
router.patch("/use/:id", useFertilizer);

export default router;