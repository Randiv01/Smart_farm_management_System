import express from "express";
import {
  getAnimalFoods,
  getAnimalFood,
  createAnimalFood,
  updateAnimalFood,
  deleteAnimalFood,
  refillAnimalFood,
  recordConsumption,
  getConsumptionData,
  getLowStockAlerts,
  getExpiringAlerts
} from "../Icontrollers/animalfoodController.js";

const router = express.Router();

// Animal food routes
router.get("/", getAnimalFoods);
router.get("/alerts/low-stock", getLowStockAlerts);
router.get("/alerts/expiring", getExpiringAlerts);
router.get("/:id", getAnimalFood);
router.get("/consumption/:id", getConsumptionData);
router.post("/", createAnimalFood);
router.put("/:id", updateAnimalFood);
router.delete("/:id", deleteAnimalFood);
router.patch("/refill/:id", refillAnimalFood);
router.patch("/consume/:id", recordConsumption);

export default router;