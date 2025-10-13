import express from "express";
import {
  getFertilisers,
  getFertiliserById,
  createFertiliser,
  updateFertiliser,
  deleteFertiliser,
  decreaseFertiliserStock
} from "../Controllers/H_FertiliserController.js";

const router = express.Router();

router.get("/", getFertilisers);
router.get("/:id", getFertiliserById);
router.post("/", createFertiliser);
router.put("/:id", updateFertiliser);
router.delete("/:id", deleteFertiliser);
router.post("/decrease-stock", decreaseFertiliserStock);

export default router;