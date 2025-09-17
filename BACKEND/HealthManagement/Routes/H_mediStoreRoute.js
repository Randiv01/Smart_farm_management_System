// BACKEND/HealthManagement/Routes/H_MediStoreRoute.js
import express from "express";
import {
  addMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
} from "../Controllers/H_MediStoreController.js";

const router = express.Router();

router.get("/", getMedicines);
router.get("/:id", getMedicineById);
router.post("/", addMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

export default router;
