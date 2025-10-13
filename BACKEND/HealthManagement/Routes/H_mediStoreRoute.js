import express from "express";
import {
  addMedicine,
  getMedicines,
  getMedicineById,
  updateMedicine,
  deleteMedicine,
  decreaseMedicineQuantity,
  decreaseMultipleMedicines
} from "../Controllers/H_MediStoreController.js";

const router = express.Router();

router.get("/", getMedicines);
router.get("/:id", getMedicineById);
router.post("/", addMedicine);
router.put("/:id", updateMedicine);
router.delete("/:id", deleteMedicine);

// New routes for decreasing medicine quantities
router.patch("/decrease-quantity", decreaseMedicineQuantity);
router.patch("/decrease-multiple", decreaseMultipleMedicines);

export default router;