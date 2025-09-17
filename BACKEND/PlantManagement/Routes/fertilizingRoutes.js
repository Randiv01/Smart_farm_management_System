import express from "express";
import {
  getFertilizingRecords,
  addFertilizingRecord,
  updateFertilizingRecord,
  deleteFertilizingRecord,
} from "../Controllers/fertilizingController.js";

const router = express.Router();

// CRUD routes
router.get("/", getFertilizingRecords);              // GET all (optional date range)
router.post("/", addFertilizingRecord);             // ADD new record
router.put("/:id", updateFertilizingRecord);        // UPDATE record
router.delete("/:id", deleteFertilizingRecord);     // DELETE record

export default router;
