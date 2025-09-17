// BACKEND/HealthManagement/Routes/H_FertiliserRoute.js
import express from "express";
import {
  getFertilisers,
  getFertiliserById,
  createFertiliser,
  updateFertiliser,
  deleteFertiliser,
} from "../Controllers/H_FertiliserController.js";

const router = express.Router();

router.get("/", getFertilisers);
router.get("/:id", getFertiliserById);
router.post("/", createFertiliser);
router.put("/:id", updateFertiliser);
router.delete("/:id", deleteFertiliser);

export default router;
