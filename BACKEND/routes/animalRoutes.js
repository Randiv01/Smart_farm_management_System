import express from "express";
import {
  getAnimalsByType,
  addAnimal,
  deleteAnimal,
  updateAnimal,
} from "../controllers/animalController.js";

const router = express.Router();

// GET /animals/:type (e.g., /animals/cows)
router.get("/:type", getAnimalsByType);

// POST /animals/:type (e.g., /animals/goats)
router.post("/:type", addAnimal);

// DELETE /animals/:id
router.delete("/:id", deleteAnimal);

// PUT /animals/:id  <-- New update route
router.put("/:id", updateAnimal);

export default router;
