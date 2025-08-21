import express from "express";
import {
  getFeedStocks,
  createFeedStock,
  updateFeedStock,
  deleteFeedStock
} from "../controllers/feedStockController.js";

const router = express.Router();

router.get("/", getFeedStocks);
router.post("/", createFeedStock);
router.put("/:id", updateFeedStock);
router.delete("/:id", deleteFeedStock);

export default router;
